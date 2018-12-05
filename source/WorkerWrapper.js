/* globals DedicatedWorkerGlobalScope, Worker */
import PubSub from './PubSub'
import MessageEvent from './MessageEvent'

/*
 *  WorkerWrapper
 */
function WorkerWrapper (worker) {
  if (
    worker instanceof Worker ||
      worker instanceof DedicatedWorkerGlobalScope
  ) {
    this._init(worker)
  } else {
    throw new Error('WorkerWrapper#constructor expects to receive a Worker instance')
  }
}

WorkerWrapper.prototype._init = function _init (worker) {
  this._currentChannel = 'message'

  this._worker = worker
  this._proxyEventListeners = null
  this._pubsub = new PubSub()

  this._registerDefaultEventListeners()
}

/*
 * Wrapping Worker methods
 */
WorkerWrapper.prototype.addEventListener = function addEventListener (ch, fn) {
  if (typeof ch === 'string' && typeof fn === 'function') {
    this._pubsub.subscribe(ch, fn)
  } else {
    throw new Error('')
  }
}

// TODO
WorkerWrapper.prototype.removeEventListener = function removeEventListener (ch, fn) {
  if (typeof ch === 'string' && typeof fn === 'function') {
    this._pubsub.unsubscribe(ch, fn)
  } else {
    throw new Error('')
  }
}

WorkerWrapper.prototype.postMessage = function postMessage (data) {
  // Create message
  const messageEvent = new MessageEvent()
  messageEvent.setChannel(this._currentChannel)
  messageEvent.setPayload(data)

  // Send message
  this._worker.postMessage(messageEvent.serialize())

  // Reset channel to default
  this._currentChannel = 'message'
}

WorkerWrapper.prototype.setChannel = function setChannel (channel) {
  this._currentChannel = channel

  return this
}

WorkerWrapper.prototype.terminate = function terminate () {
  this._worker.terminate()
}

WorkerWrapper.prototype._registerDefaultEventListeners = function _registerDefaultEventListeners () {
  this._proxyEventListeners = this._proxyEvents.bind(this)

  // TODO: Fix me
  this._worker.addEventListener('message', this._proxyEventListeners)
  // this._worker.addEventListener('messageerror', this._$proxyEventListener)
  // this._worker.addEventListener('error', this._$proxyEventListener)
}

WorkerWrapper.prototype._proxyEvents = function _proxyEvents (evt) {
  const messageEvent = new MessageEvent(evt)
  const channel = messageEvent.getChannel()

  this._pubsub.publish(channel, evt)
}

export default WorkerWrapper
