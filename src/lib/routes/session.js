const { data } = require('../data')
const { redirect } = require('../redirect')
const { html } = require('../html')
const { json } = require('../json')

function randomKey(length = 20) {
 return Array(length)
  .fill()
  .map(x => Math.random().toString(36)[2]).join('')
}

function readSession(currentKey) {
 return async function (id) {
  return {
   id: id.substring(0, 10),
   data: await data.read(`session:${id}`),
   current: id === currentKey
  }
 }
}

module.exports = {
 async create({ request, requestBody }) {
  const lowercaseEmail = requestBody.email.trim().toLowerCase()
  const accountKey = `account:${lowercaseEmail}`
  const { password } = await data.read(accountKey)
  const newSessionData = {
   email: lowercaseEmail,
   timestamp: Date.now(),
   useragent: request.headers['user-agent']
  }
  if (!password && requestBody.register === 'register') {
   if (requestBody.password.length < 8) {
    return html(
     '<p>Password should be at least 8 characters</p>' +
     '<p><a class="button" onclick="history.go(-1)">Try again</a></p>'
    )
   }
   const newSessionKey = randomKey()
   await data.write(`session:${newSessionKey}`, newSessionData)
   await data.write(accountKey, {
    password: requestBody.password,
    sessions: [newSessionKey]
   })
   return html(
    `<form><p>Your account ${JSON.stringify(lowercaseEmail)} has been registered</p>
      <script>
       window.top.postMessage(${JSON.stringify({
     type: 'signin',
     key: newSessionKey,
     email: lowercaseEmail,
     name: lowercaseEmail
    })}, '*')
      </script>
      <p><a target="_top" class="button" href="/#">Continue</a></p></form>
     `
   )
  }
  if (password === requestBody.password) {
   const existingAccount = await data.read(accountKey)
   const newSessionKey = randomKey()
   await data.write(`session:${newSessionKey}`, newSessionData)
   await data.write(accountKey, {
    ...existingAccount,
    sessions: [
     newSessionKey,
     ...(existingAccount.sessions ?? [])
    ]
   })
   return html(
    `<form><p>You are now signed in as ${JSON.stringify(lowercaseEmail)}</p>
     <script>
      window.top.postMessage(${JSON.stringify({
     type: 'signin',
     key: newSessionKey,
     email: lowercaseEmail,
     name: lowercaseEmail
    })}, '*')
     </script>
     <p><a target="_top" class="button" href="/#">Continue</a></p></form>
    `)
  }
  return redirect('/#common/session/invalid')
 },
 async end({ request, requestBody }) {
  const { 'x-tagmein-key': key } = request.headers
  const session = await data.read(`session:${key}`)
  if (!session?.email) {
   return json({ error: 'unauthorized' })
  }
  const account = await data.read(`account:${session.email}`)
  if (!account.sessions?.length) {
   return json({ error: 'unauthorized' })
  }
  const { id } = requestBody
  const sessionKeyToRemove = account.sessions.find(x => x.startsWith(id))
  if (!sessionKeyToRemove) {
   return json({ error: 'unauthorized' })
  }
  await data.remove(`session:${sessionKeyToRemove}`)
  await data.write(`account:${session.email}`, {
   ...account,
   sessions: account.sessions.filter(x => x !== sessionKeyToRemove)
  })
  return json({ completed: true })
 },
 async list({ request }) {
  const { 'x-tagmein-key': key } = request.headers
  const session = await data.read(`session:${key}`)
  if (!session?.email) {
   return json({ error: 'unauthorized' })
  }
  const account = await data.read(`account:${session.email}`)
  if (!account.sessions?.length) {
   return json({ error: 'unauthorized' })
  }
  return json(await Promise.all(account.sessions.map(readSession(key))))
 }
}
