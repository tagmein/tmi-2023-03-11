module.exports = {
 redirect(to) {
  const content = `<script>top.location.replace(decodeURIComponent(${JSON.stringify(encodeURIComponent(to))
   }))</script><p>please wait, redirecting to ${to}</p>`
  return {
   statusCode: 200,
   headers: [
    ['Content-Length', content.length],
    ['Content-Type', 'text/html']
   ],
   content
  }
 },
}
