const DEFAULT_PORT = 3000

function load([librariesString]) {
 const libraries = librariesString.trim()
  .split('\n')
  .map(x => x.trim())
 const result = {}
 for (const library of libraries) {
  result[library] = require(library)
 }
 return result
}

const modules = load`
 fs
 http
 path
 querystring
 ./lib/router.js
 ./lib/parseRequestBody.js
`

async function main() {
 const portEnv = parseInt(process.env.PORT, 10)
 const port =
  Number.isFinite(portEnv) && portEnv >= 1 && portEnv < 65536
   ? portEnv
   : DEFAULT_PORT

 const rootPath = modules.path.join(__dirname, '..', 'public')

 const httpServer = modules.http.createServer(async function (request, response) {
  try {
   const [requestPath, requestParamString] = request.url.split('?')
   const requestParams = modules.querystring.parse(requestParamString ?? '')
   console.log(request.method, requestPath, JSON.stringify(requestParams))
   const requestBody = await modules['./lib/parseRequestBody.js'](request)
   await modules['./lib/router.js']({
    modules,
    request,
    requestBody,
    requestParams,
    requestPath,
    response,
    rootPath
   })
  } catch (e) {
   console.error(e)
   response.statusCode = e.statusCode ?? 500
   response.setHeader('Content-Type', 'text/plain; charset=utf-8')
   response.end(e.message)
  }
 })

 httpServer.listen(port, 'localhost', function () {
  console.log(`Server listening on http://localhost:${port}`)
 })
}

main().catch(function (e) {
 console.error(e)
})
