var http = require('http')
  , mailgun = require('./')

http.createServer(mailgun({ key: 'key-123' }, function (mail, cb) {
  console.log(mail)
  cb()
})).listen(8080)
