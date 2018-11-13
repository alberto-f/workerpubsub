/* globals fetch, Blob, Worker */

/*
 * DedicatedWorkerGlobalScopeBuilder allows us to dynamically decorate DedicatedWorkerGlobalScope.
 * Useful for define/attach functions to *self* (DedicatedWorkerGlobalScope)
 */
function DedicatedWorkerGlobalScopeBuilder () {
  this.context = ''
}

DedicatedWorkerGlobalScopeBuilder.prototype.addGlobal = function addGlobal (fn) {
  this.context += `${fn};`
  return this
}

DedicatedWorkerGlobalScopeBuilder.prototype.add = function add (name, fn) {
  this.context += `self.${name} = ${fn};`
  return this
}

DedicatedWorkerGlobalScopeBuilder.prototype.addIIF = function addIIF (fn) {
  this.context += `(${fn})(self);`
  return this
}

DedicatedWorkerGlobalScopeBuilder.prototype.build = function build (name, fn) {
  return this.context
}

/*
 * Minimum Worker PubSub Implementation
 */
const WorkerPubSub = (self) => {
  self.channels = {}

  self.on = (ch, cb) => {
    (self.channels[ch] = self.channels[ch] || []).push(cb)
  }

  self.trigger = (ch, evt) => {
    (self.channels[ch] || []).forEach(listener => listener(evt))
  }

  self.addEventListener('message', evt => {
    let { ch } = evt.data
    self.trigger(ch, evt)
  })
}


/*
 * WorkerScope overwriting/extending methods scope offers
 */
const WorkerScopeCtxDecoration = (ctx) => {
  
  ctx.setChannel = (channel) => {
    ctx.currentChannel = channel || null
    return ctx
  }

  ctx._origPostMessage = ctx.postMessage;
  ctx.postMessage = (payload) => {
    const ch =  ctx.currentChannel || null
    const message = { ch, payload }

    ctx._origPostMessage(message)
  }
}


/*
 * Command Pattern
 */
function WorkerCommand(type, ...params){
  this.type = type
  this.params = params
}

WorkerCommand.Commands = {
  AddEventListener: 'addEventListener',
  RemoveEventListener: 'removeEventListener',
  PostMessage: 'postMessage',
  Terminate: 'terminate'
}

/*
 *
 *  WorkerState
 *
 *  In this state, the operations are passed to the worker instance.
 * 
 */
function WorkerState(worker, commands){

  this._worker = worker
  this._commands = commands

  this.addEventListener = function WorkerStateAddEventListener(ch, fn){
    this._worker.addEventListener(ch, fn)
  }

  this.removeEventListener = function WorkerStateRemoveEventListener(ch, fn){
    this._worker.removeEventListener(ch, fn)
  }

  this.postMessage = function WorkerStatePostMessage(message){
    this._worker.postMessage(message)
  }

  this.terminate = function WorkerStateTerminate(){
    this._worker.terminate()
  }

  this.execCommands = function WorkerStateExecCommands( commands ){
    commands.forEach( command => {
      this._worker[command.type].apply(this._worker, command.params)
    })
  }

  this.execCommands(commands)
}

/*
 *
 *  WorkerCommandState
 *
 *  In this state, the operations are saved to apply in a future.
 * 
 */
function WorkerCommandState(){
  this._commands = []

  this.addEventListener = function WorkerInterfaceAddEventListener(ch, fn){
    this._commands.push(new WorkerCommand(WorkerCommand.Commands.AddEventListener, ch, fn))
  }

  this.removeEventListener = function WorkerInterfaceRemoveEventListener(ch, fn){
    this._commands.push(new WorkerCommand(WorkerCommand.Commands.AddEventListener, ch, fn))
  }

  this.postMessage = function WorkerInterfacePostMessage(message){
    this._commands.push(new WorkerCommand(WorkerCommand.Commands.PostMessage, message))
  }

  this.terminate = function WorkerInterfaceTerminate(){
    this._commands.push(new WorkerCommand(WorkerCommand.Commands.Terminate))
  }

  this.getCommands = function WorkerInterfaceGetCommands(  ){
    return this._commands
  }
}

/*
 * WorkerInterface class
 *
 *  This class should implement the Worker Interface.

 *  Queue commands for every method that is called, simulating the execution of them.
 *  Whenever it receives a Worker instance it will replay the calling method.
 *
 */
function WorkerInterface(){

  this.addEventListener = function WorkerInterfaceAddEventListener(ch, fn){
    this._state.addEventListener(ch, fn)
  }

  this.removeEventListener = function WorkerInterfaceRemoveEventListener(ch, fn){
    this._state.removeEventListener(ch, fn)
  }

  this.postMessage = function WorkerInterfacePostMessage(message){
    this._state.postMessage(message)
  }

  this.terminate = function WorkerInterfaceTerminate(){
    this._state.terminate()
  }

  this._state = null

  this.setState = function WorkerInterfaceSetState(state){
    this._state = state
  }

  this.getState = function WorkerInterfaceGetState(  ){
    return this._state
  }
}

// Custom specialization of Worker
WorkerInterface.prototype = Worker.prototype
WorkerInterface.prototype.constructor = WorkerInterface



/*
 * Worker - Proxy handler
 *
 * A Worker Proxy Construct handler to be able to extend/add methods to DedicatedWorkerGlobalScope.
 *  
 */
let workerInterface = null
const WorkerHandler = {
  construct: function (Target, args, newTarget) {
    fetch(args[0]).then(response => response.text())
      .then(script => {
        const dedicatedWorkerContext = new DedicatedWorkerGlobalScopeBuilder()
                                        .addIIF(WorkerPubSub)
                                        .addIIF(WorkerScopeCtxDecoration)
                                        .addGlobal(script)
                                        .build()

        // Create local script url
        const scriptBlob = new Blob([dedicatedWorkerContext], { type: 'application/javascript' })
        const scriptUrl = URL.createObjectURL(scriptBlob)

        // Create Worker instance
        const commands = workerInterface.getState().getCommands()
        workerInterface.setState(
          new WorkerState(
            new Target(scriptUrl),
            commands
          )
        )
      })

    workerInterface = new WorkerInterface(args)
    workerInterface.setState(new WorkerCommandState())
    return workerInterface
  }
}

window.Worker = new Proxy(Worker, WorkerHandler)
