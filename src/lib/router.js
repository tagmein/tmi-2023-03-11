function loadRoutes([routesString]) {
 const routes = routesString.trim()
  .split('\n')
  .map(x => x.trim())
 const result = {}
 for (const route of routes) {
  result[route] = require(`./routes/${route}.js`)
 }
 return result
}

const routes = loadRoutes`
 channel
 data
 default
 session
`

const routeMap = {
 'GET /data': routes.data.read,
 'POST /data/file/new': routes.data.newFile,
 'POST /data/file/write': routes.data.writeFile,
 'POST /data/folder/new': routes.data.newFolder,
 'GET /channel': routes.channel.get,
 'GET /channel/list': routes.channel.list,
 'GET /session/list': routes.session.list,
 'POST /session/create': routes.session.create,
 'POST /session/end': routes.session.end,
 'POST /channel/create': routes.channel.create,
 'POST /channel/collect': routes.channel.collect,
 'POST /channel/uncollect': routes.channel.uncollect,
 'POST /channel/edit': routes.channel.edit
}

module.exports = async function ({
 modules,
 request,
 requestBody,
 requestParams,
 requestPath,
 response,
 rootPath,
}) {
 const handler = routeMap[`${request.method} ${requestPath}`] ?? routes.default
 const {
  statusCode = 200,
  contentType = 'text/plain; charset=utf-8',
  content = '',
  headers = [],
 } = await handler({
  modules,
  request,
  requestBody,
  requestParams,
  requestPath,
  rootPath,
 }) ?? {
   statusCode: 500,
   content: 'Server error',
  }
 response.statusCode = statusCode
 response.setHeader('Content-Type', contentType)
 for (const [k, v] of headers) {
  response.setHeader(k, v)
 }
 response.write(content)
 response.end()
}
