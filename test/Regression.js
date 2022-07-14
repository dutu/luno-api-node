'use strict'

const Luno = require('../lib/luno')
const https = require('https')
const fs = require('fs')
const path = require('path')
const tap = require('tap')

tap.test('GET after POST', (t) => {
  const options = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'server', 'test.key')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server', 'test.crt'))
  }
  const server = https.createServer(options).listen(process.env.PORT || 0, 'localhost', function () {
    const address = server.address()
    const luno = new Luno('keyId', 'keySecret', {
      hostname: 'localhost',
      port: address.port,
      ca: fs.readFileSync(path.join(__dirname, 'ssl', 'ca', 'root.pem'))
    })

    t.afterEach(function () {
      server.removeAllListeners('request')
    })

    t.teardown(function (done) {
      server.close(done)
    })

    t.test('should not send content type or content length headers', function (t) {
      server.once('request', function (req, res) {
        req.resume()
        req.on('end', function () {
          res.end(JSON.stringify({}))
        })
      })

      luno.postBuyOrder(9999.99, 0.0001, function (err, order) {
        t.error(err)

        server.once('request', function (req, res) {
          t.notOk(req.headers['content-type'])
          t.notOk(req.headers['content-length'])
          res.end(JSON.stringify({}))
        })

        luno.getTicker(function (err, ticker) {
          t.error(err)
          t.end()
        })
      })
    })

    t.end()
  })
})
