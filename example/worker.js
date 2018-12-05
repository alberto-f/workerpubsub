
importScripts('WorkerWrapper.bundle.js')
const ww = new WorkerWrapper(self)

/* globals self */
ww.addEventListener('message:hello', function (evt) {
  console.log(`worker: message:hello / message ${evt.data.payload}`)
})

ww.addEventListener('message:hola', function (evt) {
  console.log(`worker: message:hola / message ${evt.data.payload}`)
  ww.setChannel('message:progress').postMessage('hello')
  ww.setChannel('message').postMessage('hello')
  ww.setChannel('messageerror').postMessage('hello')
})

ww.addEventListener('message', function (evt) {
  console.log(`worker: message / ${evt.data.payload}`)
})
