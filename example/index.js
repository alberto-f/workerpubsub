/* globals Worker, WorkerWrapper */

const workerPubSub = new WorkerWrapper(new Worker('worker.js'))

/*
 * Get all public messages sent
 */
workerPubSub.addEventListener('message', (evt) => {
  console.log('Main: message')
})

/*
 * Get public messages sent to specific channel
 */
workerPubSub.addEventListener('message:progress', (evt) => {
  console.log('Main:  message:progress')
})

workerPubSub.addEventListener('messageerror', function (e) {
  console.log('Main: message:error - ' + e.data.payload)
})

workerPubSub.postMessage(1)
workerPubSub.setChannel('message:hola').postMessage(2)
workerPubSub.setChannel('message:hello').postMessage(3)
