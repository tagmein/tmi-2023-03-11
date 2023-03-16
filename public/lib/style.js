define('style', async function (load) {
 let unique = 0
 return function (name) {
  return function ([source]) {
   const className = `${name}_${unique++}`
   const definition = source.replace(/&/g, `.${className}`)
   const styleElement = document.createElement('style')
   styleElement.innerHTML = definition
   document.head.appendChild(styleElement)
   return className
  }
 }
})
