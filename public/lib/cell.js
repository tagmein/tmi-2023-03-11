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
    overflow-y: hidden;
    white-space: nowrap;
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
  status: style('status')`
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
    content: "\\1F5BF";
    display: inline-block;
    margin-right: 3px;
   }
  
   &[data-type="file"]:before {
    content: "\\1F5B9";
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
   ? `/#session/end`
   : '/#session/create'
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
  const segments = state.split('/').filter(x => x.length > 0)
  let path = []
  const homeLink = newElement(classes.link, 'a')
  homeLink.setAttribute('href', '/#')
  homeLink.innerText = 'Tag Me In'
  toolbar.appendChild(homeLink)
  for (const segment of segments) {
   const link = newElement(classes.link, 'a')
   path.push(segment)
   link.innerText = decodeURIComponent(segment)
   link.setAttribute('href', `/#${path.join('/')}`)
   toolbar.appendChild(link)
  }
 }

 let lastSelectedRoot = localStorage.getItem('root') ?? ''

 function populateStatus(status, roots) {
  status.innerHTML = ''
  for (const root of roots) {
   if (!lastSelectedRoot?.length) {
    lastSelectedRoot = root
    localStorage.setItem('root', lastSelectedRoot)
   }
   const optionElement = document.createElement('option')
   optionElement.innerText = root
   if (root === lastSelectedRoot) {
    optionElement.setAttribute('selected', 'selected')
   }
   status.appendChild(optionElement)
  }
 }

 function handleFrameMessage(event) {
  console.log('event', event.data)
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
  }
 }

 window.addEventListener('message', handleFrameMessage, false)

 return async function ({ state, updateState }) {
  const element = newElement(classes.container)
  const account = newElement(classes.account)
  const toolbar = newElement(classes.toolbar)
  const contentToolbar = newElement(classes.contentToolbar)
  const contents = newElement(classes.content)
  const status = newElement(classes.status, 'select')
  status.setAttribute('title', 'Channel to display')
  element.appendChild(toolbar)
  element.appendChild(account)
  element.appendChild(status)
  element.appendChild(contentToolbar)
  element.appendChild(contents)
  status.innerHTML = '<option disabled selected>loading...</option>'
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
  async function renderSelectedResult() {
   contentToolbar.innerHTML = ''
   if (status.value !== lastSelectedRoot) {
    lastSelectedRoot = status.value
    localStorage.setItem('root', lastSelectedRoot)
   }
   const root = lastSelectedRoot === 'common'
    ? '/common'
    : `/data/${lastSelectedRoot}`
   const response = await fetch(`${root}/${state}`)
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
   }
   else {
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
       htmlContent ?? 'not found'
      )
      contents.appendChild(iframe)
     }
     else if (mode === 'Edit') {
      const source = newElement(classes.source, 'textarea')
      source.value = htmlContent
      contents.appendChild(source)
     }
    })
   }
  }
  status.addEventListener('change', renderSelectedResult)
  async function run() {
   const data = await TagMeIn.read(state)
   if (data?.results?.length > 0) {
    lastResults = data.results
    populateStatus(status, lastResults)
    renderSelectedResult()
   }
   else {
    status.innerHTML = '<option disabled selected>no results</option>'
   }
  }
  run()
   .then()
   .catch(e => {
    const error = newElement(classes.error)
    error.innerText = e?.message ?? e ?? 'Unknown error'
    element.innerHTML = ''
    element.appendChild(error)
   })
  return { element }
 }
})
