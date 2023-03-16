const { data } = require('../data')
const { redirect } = require('../redirect')
const { html } = require('../html')

function randomKey(length = 20) {
 return Array(length)
  .fill()
  .map(x => Math.random().toString(36)[2]).join('')
}

module.exports = {
 async create({ modules, requestBody, requestParams, rootPath }) {
  const lowercaseEmail = requestBody.email.trim().toLowerCase()
  const accountKey = `account:${lowercaseEmail}`
  const { password } = await data.read(accountKey)
  if (!password && requestBody.register === 'register') {
   if (requestBody.password.length < 8) {
    return html(
     '<p>Password should be at least 8 characters</p>' +
     '<p><a class="button" onclick="history.go(-1)">Try again</a></p>'
    )
   }
   const newSessionKey = randomKey()
   await data.write(`session:${newSessionKey}`, { email: lowercaseEmail })
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
   await data.write(`session:${newSessionKey}`, { email: lowercaseEmail })
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
  return redirect('/#session/invalid')
 }
}
