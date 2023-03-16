define('tagmein', async function (load) {
 async function get(path) {
  const response = await fetch(path)
  return response.json()
 }
 return {
  read(path) {
   return get(`/data?path=${encodeURIComponent(path)}`)
  }
 }
})
