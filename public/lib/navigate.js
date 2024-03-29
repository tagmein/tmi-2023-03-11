define('navigate', async function () {
 const flushDelay = 100
 let flushTimer
 function readState() {
  return window.location.hash.substring(1)
 }
 let state = readState()
 function flush() {
  window.location.hash = state
  flushTimer = undefined
 }
 const syncStateToListeners = []
 const navigate = {
  syncStateTo(fn) {
   syncStateToListeners.push(fn)
   fn(state)
  },
  updateState(newState) {
   state = newState
   syncStateToListeners.map(fn => fn(state))
   if (flushTimer === undefined) {
    flushTimer = setTimeout(flush, flushDelay)
   }
  },
 }
 window.addEventListener(
  'hashchange',
  function () {
   state = readState()
   syncStateToListeners.map(fn => fn(state))
  }
 )
 return navigate
})
