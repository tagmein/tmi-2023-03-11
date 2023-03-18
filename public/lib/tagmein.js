define('tagmein', async function (load) {
 async function get(path) {
  const key = localStorage.getItem('key')
  const response = await fetch(path, {
   headers: {
    'X-TagMeIn-Key': key
   }
  })
  return response.json()
 }
 async function post(path, data) {
  const key = localStorage.getItem('key')
  const body = JSON.stringify(data)
  const response = await fetch(path, {
   body,
   method: 'POST',
   headers: {
    'Content-Length': body.length,
    'Content-Type': 'application/json',
    'X-TagMeIn-Key': key
   }
  })
  return response.json()
 }
 return {
  channelInfo(channelId) {
   return get(`/channel?id=${channelId}`)
  },
  read(path, channel) {
   const channelPart = channel ? `&channel=${channel}` : ''
   return get(`/data?path=${encodeURIComponent(path)}${channelPart}`)
  },
  newFile(path) {
   return post('/data/file/new', { path })
  },
  newFolder(path) {
   return post('/data/folder/new', { path })
  },
  writeFile(path, content) {
   return post('/data/file/write', { path, content })
  },
  collectChannel(id) {
   return post('/channel/collect', { id })
  },
 }
})
