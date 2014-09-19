# mailgun-listen

Verifies the signature and responds with correct status code on success.

## Express Example

```js
var express = require('express')
  , mailgun = require('mailgun-listen')

var app = express()

app.post('/', mailgun({ key: 'key-123' }, function (mail, done) {
  console.log(mail)
  done()
}))

app.listen(8080)
```

## Standalone Example

```js
var mailgun = require('mailgun-listen')

mailgun({ key: 'key-123' }, function (mail, done) {
  console.log(mail)
  done()
}).listen(8080)
```


## Install

    npm install mailgun-listen

## License

MIT
