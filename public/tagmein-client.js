const w = window || globalThis

const fetchPromises = new Map
let sessionPromise

let uniqueFetchId = 0

function handleFrameMessage(event) {
 if (event.data.type === 'response') {
  const { error, fetchId, result } = event.data
  if (error) {
   fetchPromises.get(fetchId).reject(error)
  }
  else {
   fetchPromises.get(fetchId).resolve(result)
  }
  fetchPromises.delete(fetchId)
 }
 else if (event.data.type === 'session') {
  sessionPromise.resolve(event.data.session)
 }
}

window.addEventListener('message', handleFrameMessage)

function tagMeInFetch(url, data) {
 const fetchId = uniqueFetchId++
 return new Promise((resolve, reject) => {
  fetchPromises.set(fetchId, { resolve, reject })
  window.top.postMessage({
   type: 'fetch',
   fetchId,
   url,
   data
  }, '*')
 })
}

const TagMeIn = w.TagMeIn = {
 get(url) {
  return tagMeInFetch(url)
 },
 post(url, data) {
  return tagMeInFetch(url, data)
 },
 async getSession() {
  return new Promise((resolve, reject) => {
   sessionPromise = { resolve, reject }
   window.top.postMessage({
    type: 'session'
   }, '*')
  })
 }
}
