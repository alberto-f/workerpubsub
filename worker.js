
/* globals self */
self.on('message:hello', function (evt) {
  console.log(`worker: message:hello / message ${evt.data.payload}`)
})

self.on('message:hola', function (evt) {
  console.log(`worker: message:hola / message ${evt.data.payload}`)
  self.setChannel('message:progress').postMessage('hello')
})

self.addEventListener('message', function (evt) {
  console.log(`worker: message / ${evt.data.payload}`)
})