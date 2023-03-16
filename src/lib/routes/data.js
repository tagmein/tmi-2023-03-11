module.exports = {
 async read({ modules, requestParams, rootPath }) {
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
  const knownRoots = ['common']
  const results = (
   await Promise.all(
    knownRoots.map(
     async (root) => {
      return {
       root,
       exists: await fileExists(
        modules.path.join(rootPath, root, requestParams.path)
       )
      }
     }
    )
   )
  )
   .filter(x => x.exists).map(x => x.root)
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
 async write({ modules, requestPath, requestParams, rootPath }) { },
}
