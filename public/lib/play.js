define('play', async function (load) {
 const [cell] = await load`
  cell
 `
 return async function (navigate) {
  const { updateState } = navigate
  navigate.syncStateTo(async (state) => {
   const activeCell = await cell({ state, updateState })
   if (activeCell?.element) {
    document.body.innerHTML = ''
    document.body.appendChild(activeCell.element)
   }
  })
 }
})
