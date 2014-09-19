var urlencoded = require('body-parser').urlencoded
  , LRUCache = require('lru-cache')
  , crypto = require('crypto')
  , http = require('http')

module.exports = function (options, fn) {
  if (typeof options === 'string') options = { key: options }
  options = options || {}

  var key = options.key
    , log = options.log || console

  var tokenCache = new LRUCache({ max: options.tokenCacheSize || 1000 })

  var parseUrlencoded = urlencoded({ extended: false })

  function handler(req, res) {
    function respond(statusCode, body) {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(body))
    }

    if (req.method !== 'POST') {
      respond(405, { 'error': 'method not allowed' })
      return
    }

    parseUrlencoded(req, res, function (err) {
      if (err) {
        log.error({ err: err, message: 'failed to parse body' })
        respond(err.status || 400, { 'error': 'invalid body' })
        return
      }

      var body = req.body

      if (!body.signature || !body.timestamp || !body.token) {
        respond(400, { 'error': 'not a valid mailgun request' })
        return
      }

      var signature = crypto
        .createHmac('RSA-SHA256', key)
        .update(body.timestamp + body.token)
        .digest('hex')

      if (body.signature !== signature) {
        log.warn({ body: body, message: 'invalid signature' })
        respond(400, { 'error': 'validation error' })
        return
      }

      if (tokenCache.get(body.token)) {
        log.warn({ body: body, message: 'Possible reply attack. Token alread used' })
        respond(400, { 'error': 'validation error' })
        return
      }
      tokenCache.set(body.token, true)

      if (Math.floor(body.timestamp/900) !== Math.floor(Date.now()/1000/900)) {
        log.warn({ body: body, message: 'Timestamp to far from current time'})
        respond(400, { 'error': 'validation error' })
        return
      }

      fn(body, function (err) {
        if (err) {
          log.error({ body: body, err: err, message: 'error handling email' })
          respond(500, { 'error': 'internal error' })
        } else {
          respond(200, { 'ok': true })
        }
      })
    })
  }

  handler.listen = function () {
    var server = http.createServer(handler)
    server.listen.apply(server, arguments)
    return server
  }

  return handler
}
