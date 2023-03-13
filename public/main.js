const modules = {}
const moduleLoadPromises = {}
const moduleLoadResolvers = {}
const moduleLoadRejecters = {}

let unique = 0

async function load([scripts]) {
 return Promise.all(
  scripts
   .trim()
   .split('\n')
   .map(x => x.trim())
   .map(async function (script) {
    if (script in modules) {
     return modules[script]
    }
    if (script in moduleLoadPromises) {
     return moduleLoadPromises[script]
    }
    moduleLoadPromises[script] = new Promise(
     function (resolve, reject) {
      moduleLoadResolvers[script] = resolve
      moduleLoadRejecters[script] = reject
      const scriptTag = document.createElement('script')
      scriptTag.setAttribute(
       'src',
       `./lib/${script}.js`
      )
      scriptTag.addEventListener(
       'error',
       function (e) {
        reject(
         `Loading failed for "./lib/${script}.js": ${e?.message ?? e ?? 'unknown'}`
        )
       }
      )
      document.head.appendChild(scriptTag)
     }
    )
    return moduleLoadPromises[script]
   })
 )
}

async function define(name, implementation) {
 const initializedModule = await implementation(load)
 modules[name] = initializedModule
 moduleLoadResolvers[name](initializedModule)
}

window.addEventListener(
 'DOMContentLoaded',
 async function () {
  const [navigate, play] = await load`
  navigate
  play
 `
  play(navigate).catch(function (e) {
   console.error(e)
   alert('An error occurred')
  })
 }
)
