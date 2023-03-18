const { data } = require('../data')
const { json } = require('../json')

function randomKey(length = 40) {
 return Array(length)
  .fill()
  .map(x => Math.random().toString(36)[2]).join('')
}

module.exports = {
 async create({ modules, request, requestBody, rootPath }) {
  const { 'x-tagmein-key': key } = request.headers
  const session = await data.read(`session:${key}`)
  if (!session?.email) {
   return json({ error: 'unauthorized' })
  }
  const accountChannels = await data.read(`account.channels:${session.email}`)
  const { name } = requestBody
  const newChannelId = randomKey(40)
  await new Promise(
   resolve => modules.fs.mkdir(
    modules.path.join(rootPath, 'data', newChannelId),
    resolve
   )
  )
  const newChannelData = {
   name,
   owner: session.email,
   timestamp: Date.now()
  }
  await data.write(`channel:${newChannelId}`, newChannelData)
  await data.write(
   `account.channels:${session.email}`, {
   ...accountChannels,
   [newChannelId]: newChannelData
  }
  )
  return json(
   {
    message: `<form>
     <p>Your channel ${JSON.stringify(name)} has been created</p>
     <p><a target="_top" class="button" href="/#${newChannelId}">Visit channel</a></p>
    </form>
  `})
 },
 async collect({ request, requestBody }) {
  const { 'x-tagmein-key': key } = request.headers
  const session = await data.read(`session:${key}`)
  if (!session?.email) {
   return json({ error: 'unauthorized' })
  }
  const accountChannels = await data.read(`account.channels:${session.email}`)
  const { id } = requestBody
  if (id in accountChannels) {
   return json({ error: 'already collected' })
  }
  const channelData = await data.read(`channel:${id}`)
  await data.write(
   `account.channels:${session.email}`, {
   ...accountChannels,
   [id]: channelData
  })
  return json({ completed: true })
 },
 async uncollect({ request, requestBody }) {
  const { 'x-tagmein-key': key } = request.headers
  const session = await data.read(`session:${key}`)
  if (!session?.email) {
   return json({ error: 'unauthorized' })
  }
  const accountChannels = await data.read(`account.channels:${session.email}`)
  const { id } = requestBody
  if (!(id in accountChannels)) {
   return json({ error: 'not collected' })
  }
  delete accountChannels[id]
  await data.write(
   `account.channels:${session.email}`,
   accountChannels
  )
  return json({ completed: true })
 },
 async get({ request, requestParams }) {
  const { id } = requestParams
  if (id.length !== 40) {
   return json({ error: 'invalid channel id' })
  }
  const { 'x-tagmein-key': key } = request.headers
  const session = await data.read(`session:${key}`)
  if (!session?.email) {
   return json({ error: 'unauthorized' })
  }
  const accountChannels = await data.read(`account.channels:${session.email}`)
  const channelData = await data.read(`channel:${id}`)
  return json({
   data: channelData,
   isOwner: channelData.owner === session.email,
   isCollected: id in accountChannels
  })
 },
 async list({ request }) {
  const { 'x-tagmein-key': key } = request.headers
  const session = await data.read(`session:${key}`)
  if (!session?.email) {
   return json({ error: 'unauthorized' })
  }
  const accountChannels = await data.read(`account.channels:${session.email}`)
  return json(accountChannels)
 }
}
