
/*
 * PubSub implementation
 */
function PubSub () {
  this._channels = {}
}

PubSub.prototype.subscribe = function subscribe (ch = 'message', callback) {
  (this._channels[ch] = this._channels[ch] || []).push(callback)
}

PubSub.prototype.unsubscribe = function unsubscribe (ch, callback) {
  if (typeof ch === 'string') {
    const index = this._channels[ch].findIndex((fn) => fn === callback)
    const exists = (index > -1)
    if (exists) {
      this._channels[ch].splice(index, 1)
    }
  }
}

PubSub.prototype.getSubscribers = function getSubscribers (ch) {
  return this._channels[ch] || []
}

PubSub.prototype.publish = function publish (ch, data) {
  (this._channels[ch] || []).forEach(subscriberCallback => subscriberCallback(data))
}

export default PubSub
