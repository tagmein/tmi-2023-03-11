const { replyWithFile } = require('../replyWithFile')

module.exports = async function ({ modules, requestPath, rootPath }) {
 if (requestPath === '/') {
  return replyWithFile(modules.path.join(rootPath, 'index.html'))
 }
 return replyWithFile(modules.path.join(rootPath, requestPath))
}
