/* globals Worker */

(function () {
  /*
   * Class for serialising sending events
   */
  function WorkerMessageSerializer () {

  }

  WorkerMessageSerializer.serialize = function serialize (ch = 'message', payload) {
    return { ch, payload }
  }

  /*
   * Class for deserialising received events
   */
  function WorkerEventDeserializer () {

  }

  WorkerEventDeserializer.deserialize = function deserialize (evt) {
    const { ch, payload } = evt.data

    console.assert(ch !== undefined, 'WorkerEventDeserializer received event missing `ch` property')
    console.assert(payload !== undefined, 'WorkerEventDeserializer received event missing `payload` property')

    return { ch, payload }
  }

  /*
   * QElem class
   */
  function QElem (ch = 'message', callback) {
    if (typeof ch !== 'string' || typeof callback !== 'function') {
      throw new Error('QElem constructor received unexpected parameters types.')
    }

    this.ch = ch
    this.callback = callback
  }

  /*
   * Queue class
   */
  function Queue () {
    this._queue = new Set(null)
  }

  Queue.prototype.has = function QueueHas (entry) {
    return this._queue.has(entry)
  }

  Queue.prototype.forEach = function QueueForEach (cb) {
    this._queue.forEach(cb)
  }

  Queue.prototype.add = function QueueAdd (qElem) {
    if (!(qElem instanceof QElem)) {
      throw new Error('The element you tried to add to the Queue is not a QElem instance object.')
    }
    this._queue.add(qElem)
  }

  Queue.prototype.delete = function QueueDelete (qElem) {
    if (!(qElem instanceof QElem)) {
      throw new Error('The element you tried to add to the Queue is not a QElem instance object.')
    }

    this._queue.delete(qElem)
  }

  Queue.prototype.clear = function QueueClear () {
    this._queue.clear()
  }

  /*
   * PubSub implementation using Queue for delay subscription.
   */
  function PubSub () {
    // List of available channels to send messages to.
    this.channels = {}

    // Queue keeping pending eventListeners.
    this.pendingListenersQueue = new Queue()
  }

  PubSub.prototype.queue = function queue (ch = 'message', callback) {
    const qElem = new QElem(ch, callback)
    this.pendingListenersQueue.add(qElem)
  }

  PubSub.prototype.get = function get (ch) {
    return this.channels[ch] || []
  }

  PubSub.prototype.subscribe = function subscribe () {
    this.pendingListenersQueue.forEach(qElem => {
      console.assert(qElem instanceof QElem, 'Assert Failed: Expected qElem object instance.')
      const { ch, callback } = qElem;
      (this.channels[ch] = this.channels[ch] || []).push(callback)
    })

    // Once pending listeners have been saved, let's empty the queue
    this.pendingListenersQueue.clear()
  }

  /*
   *  WorkeritPubSub
   */
  function WorkeritPubSub (worker) {
    if (!(worker instanceof Worker)) {
      throw new Error('WorkeritPubSub#constructor expects to receive a Worker instance')
    }

    this._worker = worker
    this._pubsub = new PubSub()

    this._currentChannel = null

    this._registerDefaultEventListeners()
  }

  /*
   * Wrapping Worker methods
   */
  WorkeritPubSub.prototype.addEventListener = function addEventListener (ch, cb) {
    if (typeof ch === 'string' && typeof cb === 'function') {
      this._pubsub.queue(ch, cb)
    } else {
      throw new Error('')
    }
  }

  // TODO
  WorkeritPubSub.prototype.removeEventListener = function removeEventListener (eventName, cb) {

  }

  WorkeritPubSub.prototype.postMessage = function postMessage (data) {
    this._pubsub.subscribe()

    const message = WorkerMessageSerializer.serialize(this._currentChannel, data)
    this._worker.postMessage(message)

    this._currentChannel = null
  }

  WorkeritPubSub.prototype.terminate = function terminate () {
    this._worker.terminate()
  }

  WorkeritPubSub.prototype.setChannel = function setChannel (channel) {
    this._currentChannel = channel
    // Allow chaining method
    return this
  }

  WorkeritPubSub.prototype._registerDefaultEventListeners = function _registerDefaultEventListeners () {
    const handleEvent = this._handleEventListener.bind(this)

    this._worker.addEventListener('message', handleEvent)
    this._worker.addEventListener('onmessageerror', handleEvent)
    this._worker.addEventListener('onerror', handleEvent)
  }

  WorkeritPubSub.prototype._handleEventListener = function _handleEventListener (evt) {
    const data = WorkerEventDeserializer.deserialize(evt)
    const listeners = this._pubsub.get(data.ch)

    listeners.forEach(listener => listener(evt))
  }

  if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    // CommonJS
    module.exports = WorkeritPubSub
  } else {
    // Browser Global
    window.WorkeritPubSub = WorkeritPubSub
  }
})()
