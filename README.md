[![HitCount](http://hits.dwyl.io/alberto-f/workerpubsub.svg)](http://hits.dwyl.io/alberto-f/workerpubsub)
# WorkerPubSub

Main and Web Worker thread communication through a pubsub implementation.

WorkerPubSub wraps Worker instance and exposes the following methods:
addEventListener
removeEventListener
setChannel
postMessage
terminate


### Usage (WIP)

**index.html**
```
<body>
	<script type="text/javascript" src="./WorkerWrapper.bundle.js"></script>
	<script type="text/javascript" src="./main.js"></script>
</body>
```

**main.js**
```
const workerPubSub = new WorkerWrapper(new Worker('worker.js'))

/*
 * Get all messages
 */
workerPubSub.addEventListener('message', (evt) => {
  console.log('Main: message')
})

/*
 * Get messages sent to specific channel
 */
workerPubSub.addEventListener('message:progress', (evt) => {
  console.log('Main:  message:progress')
})

/*
 * Sent message to default channel (default channel is 'message')
 */
workerPubSub.postMessage(1)

/*
 * Sent message to message:hola channel
 */
workerPubSub.setChannel('message:hola').postMessage(2)
```

**worker.js**
```
importScripts('WorkerWrapper.bundle.js')
const ww = new WorkerWrapper(self)

// Listen messages sent to message:hola channel
ww.addEventListener('message:hola', function (evt) {
  console.log(`worker: message:hola / message ${evt.data.payload}`)
  ww.setChannel('message:progress').postMessage('hello')
  ww.setChannel('message').postMessage('hello')
  ww.setChannel('messageerror').postMessage('hello')
})

// Listen messages sent to message channel
ww.addEventListener('message', function (evt) {
  console.log(`worker: message / ${evt.data.payload}`)
})
```


## Example

Check the `/example` folder. Start the example by executin the following commands:

```
npm install
npm start
```


## Authors

* **Alberto Fernandez Reyes** - [alberto-f](https://github.com/alberto-f)


## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
