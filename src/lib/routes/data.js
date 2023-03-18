const { data } = require('../data')
const { json } = require('../json')

function decodePath(path) {
 return path.split('/').map(decodeURIComponent)
}

module.exports = {
 async read({ request, modules, requestParams, rootPath }) {
  const { fs } = modules
  async function readFile(path) {
   return new Promise((resolve) => {
    fs.readFile(path, 'utf-8', function (error, content) {
     if (error) {
      resolve(null)
     }
     else {
      resolve(content)
     }
    })
   })
  }
  async function fileExists(path) {
   return new Promise((resolve) => {
    fs.exists(path, function (exists) {
     resolve(exists)
    })
   })
  }
  const sessionChannels = await (async function () {
   const { 'x-tagmein-key': key } = request.headers
   if (!key) {
    return []
   }
   const session = await data.read(`session:${key}`)
   if (!session?.email) {
    return []
   }
   return data.read(`account.channels:${session.email}`)
  })()
  const knownRoots = ['common', ...Object.keys(sessionChannels)]
  if (requestParams.channel && requestParams.channel !== 'common') {
   const channelDetails = await data.read(`channel:${requestParams.channel}`)
   if ('name' in channelDetails) {
    sessionChannels[requestParams.channel] = channelDetails
    knownRoots.push(requestParams.channel)
   }
  }
  const presentRoots = (
   await Promise.all(
    knownRoots.map(
     async (root) => {
      return {
       root,
       exists: await fileExists(
        modules.path.join(
         rootPath,
         ...(root === 'common' ? [root] : ['data', root]),
         ...(requestParams.path?.length > 0 ? decodePath(requestParams.path) : [])
        )
       )
      }
     }
    )
   )
  )
   .filter(x => x.exists).map(x => x.root)
  const results = Object.fromEntries(
   presentRoots.map(
    root => [
     root,
     root === 'common' ? { name: 'Common' } : sessionChannels[root]
    ]
   )
  )
  const content = JSON.stringify({ results })
  return {
   statusCode: 200,
   headers: [
    ['Access-Control-Allow-Origin', '*'],
    ['Content-Length', content.length],
    ['Content-Type', 'application/json'],
   ],
   content
  }
 },
 async deleteFile({ modules, request, requestBody, rootPath }) {
  const { 'x-tagmein-key': key } = request.headers
  const session = await data.read(`session:${key}`)
  if (!session?.email) {
   return json({ error: 'unauthorized' })
  }
  const [channel, ...segments] = decodePath(requestBody.path)
  const channelData = await data.read(`channel:${channel}`)
  if (channelData.owner !== session.email) {
   return json({ error: 'unauthorized' })
  }
  try {
   await new Promise((resolve, reject) => {
    modules.fs.unlink(
     modules.path.join(
      rootPath,
      'data',
      channel,
      ...segments
     ),
     function (error) {
      if (error) {
       reject(error)
      } else {
       resolve()
      }
     }
    )
   })
  } catch (e) {
   return json({ error: e.message })
  }
  return json({ completed: true })
 },
 async newFile({ modules, request, requestBody, rootPath }) {
  const { 'x-tagmein-key': key } = request.headers
  const session = await data.read(`session:${key}`)
  if (!session?.email) {
   return json({ error: 'unauthorized' })
  }
  const [channel, ...segments] = decodePath(requestBody.path)
  const channelData = await data.read(`channel:${channel}`)
  if (channelData.owner !== session.email) {
   return json({ error: 'unauthorized' })
  }
  try {
   await new Promise((resolve, reject) => {
    modules.fs.writeFile(
     modules.path.join(
      rootPath,
      'data',
      channel,
      ...segments
     ),
     '',
     { flag: 'a+' },
     function (error) {
      if (error) {
       reject(error)
      } else {
       resolve()
      }
     }
    )
   })
  } catch (e) {
   return json({ error: e.message })
  }
  return json({ completed: true })
 },
 async writeFile({ modules, request, requestBody, rootPath }) {
  const { 'x-tagmein-key': key } = request.headers
  const session = await data.read(`session:${key}`)
  if (!session?.email) {
   return json({ error: 'unauthorized' })
  }
  const [channel, ...segments] = decodePath(requestBody.path)
  const channelData = await data.read(`channel:${channel}`)
  if (channelData.owner !== session.email) {
   return json({ error: 'unauthorized' })
  }
  try {
   await new Promise((resolve, reject) => {
    modules.fs.writeFile(
     modules.path.join(
      rootPath,
      'data',
      channel,
      ...segments
     ),
     requestBody.content,
     { flag: 'w' },
     function (error) {
      if (error) {
       reject(error)
      } else {
       resolve()
      }
     }
    )
   })
  } catch (e) {
   return json({ error: e.message })
  }
  return json({ completed: true })
 },
 async newFolder({ modules, request, requestBody, rootPath }) {
  const { 'x-tagmein-key': key } = request.headers
  const session = await data.read(`session:${key}`)
  if (!session?.email) {
   return json({ error: 'unauthorized' })
  }
  const [channel, ...segments] = decodePath(requestBody.path)
  const channelData = await data.read(`channel:${channel}`)
  if (channelData.owner !== session.email) {
   return json({ error: 'unauthorized' })
  }
  try {
   await new Promise((resolve, reject) => modules.fs.mkdir(
    modules.path.join(
     rootPath,
     'data',
     channel,
     ...segments
    ),
    { recursive: true },
    function (error) {
     if (error) {
      reject(error)
     }
     else {
      resolve()
     }
    }))
  } catch (e) {
   return json({ error: e.message })
  }
  return json({ completed: true })
 },
}
