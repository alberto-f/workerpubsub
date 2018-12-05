/* globals Error */
/*
 * MessageEvent received events
 */
function MessageEvent (event) {
  this._channel = null
  this._payload = null
  if (event !== undefined && event.data) {
    console.assert(event.data.channel !== undefined, 'MessageEvent received event missing `data.channel` property')
    console.assert(event.data.payload !== undefined, 'MessageEvent received event missing `data.payload` property')
    this._channel = event.data.channel
    this._payload = event.data.payload
  }
}

MessageEvent.prototype.setChannel = function setChannel (channel) {
  this._channel = channel
}

MessageEvent.prototype.setPayload = function setPayload (payload) {
  this._payload = payload
}

MessageEvent.prototype.getChannel = function getChannel () {
  return this._channel
}

MessageEvent.prototype.getPayload = function getPayload () {
  return this._payload
}

MessageEvent.prototype.serialize = function serialize () {
  if (this._channel == null) {
    throw Error('MessageEvent has no channel defined')
  } else if (this._payload == null) {
    throw Error('MessageEvent has no channel defined')
  }

  return { channel: this._channel, payload: this._payload }
}

export default MessageEvent
