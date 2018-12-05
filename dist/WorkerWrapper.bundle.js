(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.WorkerWrapper = factory());
}(this, (function () { 'use strict';

  /*
   * PubSub implementation
   */
  function PubSub () {
    this._channels = {};
  }

  PubSub.prototype.subscribe = function subscribe (ch = 'message', callback) {
    (this._channels[ch] = this._channels[ch] || []).push(callback);
  };

  PubSub.prototype.unsubscribe = function unsubscribe (ch, callback) {
    if (typeof ch === 'string') {
      const index = this._channels[ch].findIndex((fn) => fn === callback);
      const exists = (index > -1);
      if (exists) {
        this._channels[ch].splice(index, 1);
      }
    }
  };

  PubSub.prototype.getSubscribers = function getSubscribers (ch) {
    return this._channels[ch] || []
  };

  PubSub.prototype.publish = function publish (ch, data) {
    (this._channels[ch] || []).forEach(subscriberCallback => subscriberCallback(data));
  };

  /* globals Error */
  /*
   * MessageEvent received events
   */
  function MessageEvent (event) {
    this._channel = null;
    this._payload = null;
    if (event !== undefined && event.data) {
      console.assert(event.data.channel !== undefined, 'MessageEvent received event missing `data.channel` property');
      console.assert(event.data.payload !== undefined, 'MessageEvent received event missing `data.payload` property');
      this._channel = event.data.channel;
      this._payload = event.data.payload;
    }
  }

  MessageEvent.prototype.setChannel = function setChannel (channel) {
    this._channel = channel;
  };

  MessageEvent.prototype.setPayload = function setPayload (payload) {
    this._payload = payload;
  };

  MessageEvent.prototype.getChannel = function getChannel () {
    return this._channel
  };

  MessageEvent.prototype.getPayload = function getPayload () {
    return this._payload
  };

  MessageEvent.prototype.serialize = function serialize () {
    if (this._channel == null) {
      throw Error('MessageEvent has no channel defined')
    } else if (this._payload == null) {
      throw Error('MessageEvent has no channel defined')
    }

    return { channel: this._channel, payload: this._payload }
  };

  /* globals DedicatedWorkerGlobalScope, Worker */

  /*
   *  WorkerWrapper
   */
  function WorkerWrapper (worker) {
    if (
      worker instanceof Worker ||
        worker instanceof DedicatedWorkerGlobalScope
    ) {
      this._init(worker);
    } else {
      throw new Error('WorkerWrapper#constructor expects to receive a Worker instance')
    }
  }

  WorkerWrapper.prototype._init = function _init (worker) {
    this._currentChannel = 'message';

    this._worker = worker;
    this._proxyEventListeners = null;
    this._pubsub = new PubSub();

    this._registerDefaultEventListeners();
  };

  /*
   * Wrapping Worker methods
   */
  WorkerWrapper.prototype.addEventListener = function addEventListener (ch, fn) {
    if (typeof ch === 'string' && typeof fn === 'function') {
      this._pubsub.subscribe(ch, fn);
    } else {
      throw new Error('')
    }
  };

  // TODO
  WorkerWrapper.prototype.removeEventListener = function removeEventListener (ch, fn) {
    if (typeof ch === 'string' && typeof fn === 'function') {
      this._pubsub.unsubscribe(ch, fn);
    } else {
      throw new Error('')
    }
  };

  WorkerWrapper.prototype.postMessage = function postMessage (data) {
    // Create message
    const messageEvent = new MessageEvent();
    messageEvent.setChannel(this._currentChannel);
    messageEvent.setPayload(data);

    // Send message
    this._worker.postMessage(messageEvent.serialize());

    // Reset channel to default
    this._currentChannel = 'message';
  };

  WorkerWrapper.prototype.setChannel = function setChannel (channel) {
    this._currentChannel = channel;

    return this
  };

  WorkerWrapper.prototype.terminate = function terminate () {
    this._worker.terminate();
  };

  WorkerWrapper.prototype._registerDefaultEventListeners = function _registerDefaultEventListeners () {
    this._proxyEventListeners = this._proxyEvents.bind(this);

    // TODO: Fix me
    this._worker.addEventListener('message', this._proxyEventListeners);
    // this._worker.addEventListener('messageerror', this._$proxyEventListener)
    // this._worker.addEventListener('error', this._$proxyEventListener)
  };

  WorkerWrapper.prototype._proxyEvents = function _proxyEvents (evt) {
    const messageEvent = new MessageEvent(evt);
    const channel = messageEvent.getChannel();

    this._pubsub.publish(channel, evt);
  };

  return WorkerWrapper;

})));
