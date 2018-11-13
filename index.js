/* globals Worker, WorkeritPubSub */

let worker = new Worker('worker.js')

const workerPubSub = new WorkeritPubSub(worker)

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

workerPubSub.postMessage(1)
workerPubSub.setChannel('message:hola').postMessage(2)
workerPubSub.setChannel('message:hello').postMessage(3)
