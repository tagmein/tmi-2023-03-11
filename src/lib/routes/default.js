const { replyWithFile } = require('../replyWithFile')

module.exports = async function ({ modules, requestPath, rootPath }) {
 if (requestPath === '/') {
  return replyWithFile(modules.path.join(rootPath, 'index.html'))
 }
 if (requestPath.startsWith('/data') && requestPath.length < 45) {
  return {
   statusCode: 404
  }
 }
 return replyWithFile(modules.path.join(rootPath, decodeURIComponent(requestPath)))
}
