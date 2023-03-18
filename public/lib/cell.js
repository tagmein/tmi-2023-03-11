function newElement(className, tagName = 'div') {
 const element = document.createElement(tagName)
 if (className) {
  element.classList.add(className)
 }
 return element
}

define('cell', async function (load) {
 const [style, TagMeIn] = await load`
  style
  tagmein
 `
 const classes = {
  container: style('container')`
   & {
    bottom: 0;
    display: flex;
    flex-direction: column;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
   }
  `,
  error: style('error')`
   & {
    background-color: #c9a9a9;
    color: #794949;
    flex-grow: 1;
    padding: 10px;
   }
  `,
  account: style('account')`
   & {
    background-color: #e9e0a9;
    border-bottom: 1px solid #c9c9c9;
    display: flex;
    flex-direction: row;
    height: 47px;
    overflow-x: auto;
    flex-shrink: 0;
    overflow-y: hidden;
    white-space: nowrap;
   }
  `,
  contentToolbar: style('content-toolbar')`
   & {
    background-color: #d9d9d9;
    border-bottom: 1px solid #c9c9c9;
    display: flex;
    flex-direction: row;
    height: 47px;
    overflow-x: auto;
    flex-shrink: 0;
    overflow-y: hidden;
    white-space: nowrap;
   }
   
   & button {
    line-height: 1;
    height: 30px;
    padding: 6px;
    margin: 8px 0 0 8px;
   }
  `,
  toolbar: style('toolbar')`
   & {
    background-color: #d9d9d9;
    border-bottom: 1px solid #c9c9c9;
    display: flex;
    flex-direction: row;
    height: 47px;
    overflow-x: auto;
    flex-shrink: 0;
    overflow-y: hidden;
    white-space: nowrap;
   }

   & a + a:before {
    content: '/';
    display: block;
    left: -3px;
    position: absolute;
    top: 10px;
   }
  `,
  channelSelect: style('channel-select')`
   & {
    background-color: #ffffff;
    border-radius: 0;
    border: none;
    border-bottom: 1px solid #c9c9c9;
    display: block;
    height: 47px;
    margin: 0;
    padding: 10px 6px;
    width: 100%;
   }
   
   & option {
    padding: 10px;
   }
  `,
  link: style('link')`
   & {
    cursor: pointer;
    display: inline-block;
    padding: 10px;
    position: relative;
    text-decoration: none;
   }
   
   &[data-type="directory"]:before {
    content: "📁";
    display: inline-block;
    margin-right: 5px;
   }
  
   &[data-type="file"]:before {
    content: "📄";
    display: inline-block;
    margin-right: 5px;
   }
   
   &:hover {
    background-color: #f0f0f0;
    color: #004979;
   }
   
   &.selected {
    background-color: #ffffff;
    color: inherit;
   }
  `,
  message: style('message')`
   & {
    color: #797979;
    display: inline-block;
    margin: 0;
    padding: 10px;
    position: relative;
   }
  `,
  source: style('source')`
   & {
    border: none;
    box-sizing: border-box;
    font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 10px;
    position: absolute;
    resize: none;
    width: 100%;
   }
  `,
  spacer: style('spacer')`
   & {
    flex-grow: 1;
   }
  `,
  content: style('content')`
   & {
    flex-grow: 1;
    overflow: hidden;
    position: relative;
   }
   
   & > div, & > iframe {
    border: none;
    height: 100%;
    left: 0;
    overflow: auto;
    position: absolute;
    top: 0;
    width: 100%;
   }
  `
 }

 function populateAccount(account) {
  const name = localStorage.getItem('name')
  const email = localStorage.getItem('email')
  const message = newElement(classes.message, 'p')
  const spacer = newElement(classes.spacer)
  const signInOut = newElement(classes.link, 'a')
  signInOut.setAttribute('href', email
   ? `/#common/session/end`
   : '/#common/session/create'
  )
  signInOut.innerText = email
   ? 'Sign out'
   : 'Sign in'
  message.innerText = email
   ? `You are logged in as ${email} "${name}"`
   : 'You are browsing as a guest'
  account.appendChild(message)
  account.appendChild(spacer)
  account.appendChild(signInOut)
 }

 function populateToolbar(toolbar, state) {
  const segments = state.split('/')
   .filter(x => x.length > 0)
   .map(decodeURIComponent)
  const channel = segments.shift()
  let path = []
  const homeLink = newElement(classes.link, 'a')
  homeLink.setAttribute('href', `/#${channel}`)
  homeLink.innerText = 'Tag Me In'
  toolbar.appendChild(homeLink)
  for (const segment of segments) {
   const link = newElement(classes.link, 'a')
   path.push(segment)
   link.innerText = decodeURIComponent(segment)
   link.setAttribute('href', `/#${channel}/${path.join('/')}`)
   toolbar.appendChild(link)
  }
 }

 function populateChannelSelect(channelSelect, channel, channels) {
  const channelEntries = Object.entries(channels)
  channelSelect.innerHTML = ''
  for (const [channelId, channelDetail] of channelEntries) {
   const optionElement = document.createElement('option')
   optionElement.setAttribute('value', channelId)
   optionElement.innerText = `${channelDetail.name} - ${channelId === 'common'
    ? '(system)'
    : channelDetail.owner
    }`
   if (channelId === channel) {
    optionElement.setAttribute('selected', 'selected')
   }
   channelSelect.appendChild(optionElement)
  }
 }

 async function handleFrameMessage(event) {
  // console.log('event', event)
  const { type } = event.data
  switch (type) {
   case 'signin':
    for (const variable of ['key', 'email', 'name']) {
     localStorage.setItem(variable, event.data[variable])
    }
    break
   case 'signout':
    for (const variable of ['key', 'email', 'name']) {
     localStorage.removeItem(variable)
    }
    break
   case 'session': {
    const key = localStorage.getItem('key')
    event.source.postMessage({
     type: 'session',
     session: key
      ? { id: key.substring(0, 10) }
      : null
    }, '*')
   }
    break

   case 'fetch':
    const { url, data, fetchId } = event.data
    const key = localStorage.getItem('key')
    try {
     if (data) {
      const body = JSON.stringify(data)
      const response = await fetch(url, {
       body,
       headers: {
        'Content-Type': 'application/json',
        'Content-Length': body.length,
        'X-TagMeIn-Key': key
       },
       method: 'POST'
      })
      const result = await response.text()
      const isJSON = result.startsWith('[') || result.startsWith('{')
      event.source.postMessage({
       type: 'response',
       result: isJSON ? JSON.parse(result) : result,
       fetchId
      }, '*')
     }
     else {
      const response = await fetch(url, {
       headers: {
        'X-TagMeIn-Key': key
       }
      })
      const result = await response.json()
      event.source.postMessage({ type: 'response', result, fetchId }, '*')
     }
    }
    catch (error) {
     event.source.postMessage({
      type: 'response',
      error: error?.message ?? 'unknown error',
      fetchId
     }, '*')
    }
    break
  }
 }

 window.addEventListener('message', handleFrameMessage, false)

 return async function ({ state, updateState }) {
  const segments = state.split('/')
   .filter(x => x.length > 0)
   .map(decodeURIComponent)
  const channel = segments.shift()
  if (channel !== 'common' && channel?.length !== 40) {
   updateState(`common${state.length > 0 ? '/' : ''}${state}`)
   return
  }

  const channelRoot = channel === 'common'
   ? '/common'
   : `/data/${channel}`

  const currentChannelDetails = channel === 'common'
   ? {
    data: { name: 'Common' },
    isOwner: false,
    isCollected: true
   }
   : await TagMeIn.channelInfo(channel)

  const element = newElement(classes.container)
  const account = newElement(classes.account)
  const toolbar = newElement(classes.toolbar)
  const contentToolbar = newElement(classes.contentToolbar)
  const contents = newElement(classes.content)
  const channelSelect = newElement(classes.channelSelect, 'select')
  channelSelect.setAttribute('title', 'Channel to display')
  element.appendChild(account)
  element.appendChild(toolbar)
  element.appendChild(channelSelect)
  element.appendChild(contentToolbar)
  element.appendChild(contents)
  populateToolbar(toolbar, state)
  populateAccount(account)
  let lastResults
  function populateToggle(containerElement, states, onChange) {
   const key = states.join('-')
   const lastToggleState = localStorage.getItem(key) ?? states[0]
   const stateLinks = {}
   function setTo(newState) {
    return function () {
     localStorage.setItem(key, newState)
     onChange?.(newState)
     for (const [k, v] of Object.entries(stateLinks)) {
      if (k === newState) {
       v.classList.add('selected')
      }
      else {
       v.classList.remove('selected')
      }
     }
    }
   }
   for (const state of states) {
    const stateLink = newElement(classes.link, 'a')
    stateLinks[state] = stateLink
    if (lastToggleState === state) {
     stateLink.classList.add('selected')
    }
    stateLink.innerText = state
    containerElement.appendChild(stateLink)
    stateLink.addEventListener('click', setTo(state))
   }
   onChange?.(lastToggleState)
  }
  async function changeChannel() {
   updateState([channelSelect.value, ...segments].join('/'))
  }
  async function renderSelectedResult() {
   contentToolbar.innerHTML = ''
   const response = await fetch([channelRoot, ...segments].join('/'))
   const htmlContent = await response.text()
   if (htmlContent.startsWith('[')) {
    const list = JSON.parse(htmlContent)
    const listContainer = document.createElement('div')
    for (const item of list) {
     const link = newElement(classes.link, 'a')
     link.setAttribute(
      'href',
      `/#${state}${state.length > 0 ? '/' : ''}${item.name}`
     )
     link.innerText = item.name
     link.setAttribute('data-type', item.type)
     listContainer.appendChild(link)
    }
    contents.innerHTML = ''
    contents.appendChild(listContainer)
    populateToggle(contentToolbar, ['View'])
    if (currentChannelDetails.isOwner) {
     const newFolderButton = document.createElement('button')
     newFolderButton.innerText = '+ folder'
     const newFileButton = document.createElement('button')
     newFileButton.innerText = '+ file'
     contentToolbar.appendChild(newFolderButton)
     contentToolbar.appendChild(newFileButton)
     newFileButton.addEventListener('click', async function () {
      const newFileName = prompt('File name')
      if (!newFileName) {
       return
      }
      const newPath = [channel, ...segments, newFileName].join('/')
      const operationResult = await TagMeIn.newFile(newPath)
      if (!operationResult?.completed) {
       alert('Something went wrong')
       return
      }
      updateState(newPath)
     })
     newFolderButton.addEventListener('click', async function () {
      const newFolderName = prompt('Folder name')
      if (!newFolderName) {
       return
      }
      const newPath = [channel, ...segments, newFolderName].join('/')
      const operationResult = await TagMeIn.newFolder(newPath)
      if (!operationResult?.completed) {
       alert('Something went wrong')
       return
      }
      updateState(newPath)
     })
    }
    else if (!currentChannelDetails.error && !currentChannelDetails.isCollected) {
     const followButton = document.createElement('button')
     followButton.innerText = 'Collect'
     contentToolbar.appendChild(followButton)
     followButton.addEventListener('click', async function () {
      const operationResult = await TagMeIn.collectChannel(channel)
      if (!operationResult?.completed) {
       alert('Something went wrong')
       return
      }
      alert('Channel collected')
      contentToolbar.removeChild(followButton)
     })
    }
   }
   else {
    let lastSavedContent = htmlContent
    let currentContent = htmlContent
    const saveButton = document.createElement('button')
    saveButton.innerText = 'Save changes'
    const deleteButton = document.createElement('button')
    deleteButton.innerText = 'Delete'
    deleteButton.addEventListener('click', async function () {
     if (!confirm('Are you sure you want to delete this file?')) {
      return
     }
     deleteButton.setAttribute('disabled', 'disabled')
     deleteButton.innerText = 'Deleting...'
     try {
      await TagMeIn.deleteFile([channel, ...segments].join('/'), currentContent)
      lastSavedContent = currentContent
     }
     catch (e) {
      alert('Error: did not delete')
      deleteButton.removeAttribute('disabled')
     }
     deleteButton.innerText = 'Delete'
     updateState([channel, ...segments.slice(0, segments.length - 1)].join('/'))
    })
    saveButton.addEventListener('click', async function () {
     saveButton.setAttribute('disabled', 'disabled')
     saveButton.innerText = 'Saving...'
     try {
      await TagMeIn.writeFile([channel, ...segments].join('/'), currentContent)
      lastSavedContent = currentContent
     }
     catch (e) {
      alert('Error: did not save changes')
      saveButton.removeAttribute('disabled')
     }
     saveButton.innerText = 'Save changes'
    })
    saveButton.setAttribute('disabled', 'disabled')
    populateToggle(contentToolbar, ['Run', 'Edit'], mode => {
     contents.innerHTML = ''
     if (mode === 'Run') {
      const sandbox = ['downloads', 'forms', 'scripts', 'top-navigation']
       .map((x) => `allow-${x}`)
       .join(' ')
      const iframe = document.createElement('iframe')
      iframe.setAttribute('referrerpolicy', 'no-referrer')
      iframe.setAttribute('credentialless', true)
      iframe.setAttribute('sandbox', sandbox)
      iframe.setAttribute(
       'srcdoc',
       currentContent ?? 'not found'
      )
      contents.appendChild(iframe)
     }
     else if (mode === 'Edit') {
      const source = newElement(classes.source, 'textarea')
      source.value = currentContent
      source.addEventListener('keyup', function () {
       currentContent = source.value
       if (currentContent === lastSavedContent) {
        saveButton.setAttribute('disabled', 'disabled')
       }
       else {
        saveButton.removeAttribute('disabled')
       }
      })
      contents.appendChild(source)
     }
    })
    if (currentChannelDetails.isOwner) {
     contentToolbar.appendChild(saveButton)
     contentToolbar.appendChild(deleteButton)
    }
   }
  }
  channelSelect.addEventListener('change', changeChannel)
  async function run() {
   const data = await TagMeIn.read(segments.join('/'), channel)
   if (Object.keys(data?.results ?? {}).length > 0) {
    lastResults = data.results
    populateChannelSelect(channelSelect, channel, lastResults)
    renderSelectedResult()
   }
   else {
    channelSelect.innerHTML = '<option disabled selected>no results</option>'
   }
  }
  try {
   await run()
  } catch (e) {
   const error = newElement(classes.error)
   error.innerText = e?.message ?? e ?? 'Unknown error'
   element.innerHTML = ''
   element.appendChild(error)
  }
  return { element }
 }
})
