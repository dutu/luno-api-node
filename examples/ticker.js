'use strict'

var Luno = require('../lib/luno')

var luno = new Luno()

luno.getTicker(function (err, ticker) {
  if (err) {
    throw err
  }
  console.dir(ticker)
})
