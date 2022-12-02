'use strict'

const Luno = require('../lib/luno')
const FakeRequest = require('./helpers/FakeRequest')
const https = require('https')
const sinon = require('sinon')
const tap = require('tap')

tap.test('Luno constructor', {autoend: true}, function (t) {
  t.test('should create a new instance', function (tt) {
    const luno = new Luno()
    tt.type(luno, 'Luno')
    tt.end()
  })

  tap.test('should create a new instance without the new keyword', function (tt) {
    const luno = Luno()
    tt.type(luno, 'Luno')
    tt.end()
  })

  tap.test('should have default options', function (tt) {
    const luno = new Luno()
    tt.equal(luno.hostname, 'api.luno.com')
    tt.equal(luno.port, 443)
    tt.equal(luno.pair, 'XBTZAR')
    tt.end()
  })

  tap.test('should accept options', function (tt) {
    const options = {
      hostname: 'localhost',
      port: 8000,
      pair: 'XBTUSD'
    }
    const luno = new Luno(options)
    tt.equal(luno.hostname, options.hostname)
    tt.equal(luno.port, options.port)
    tt.equal(luno.pair, options.pair)
    tt.end()
  })

  tap.test('should accept auth and options', function (tt) {
    const keyId = 'cnz2yjswbv3jd'
    const keySecret = '0hydMZDb9HRR3Qq-iqALwZtXLkbLR4fWxtDZvkB9h4I'
    const options = {
      hostname: 'localhost',
      port: 8000,
      pair: 'XBTUSD'
    }
    const luno = new Luno(keyId, keySecret, options)
    tt.equal(luno.hostname, options.hostname)
    tt.equal(luno.port, options.port)
    tt.equal(luno.pair, options.pair)
    tt.equal(luno.auth, keyId + ':' + keySecret)
    tt.end()
  })
})

tap.test('Internal', {autoend: true}, function (t) {
  const keyId = '12345'
  const keySecret = '0000000000000000'
  const path = '/api/1/test'

  const expectedOptions = {
    headers: {
      'Accept': 'application/json',
      'Accept-Charset': 'utf-8'
    },
    hostname: 'api.luno.com',
    path: path,
    port: 443,
    auth: keyId + ':' + keySecret
  }

  const luno = new Luno(keyId, keySecret)
  const request = sinon.stub(https, 'request')
  const stub = request.withArgs(sinon.match(expectedOptions))

  t.afterEach(function () {
    stub.reset()
  })

  t.teardown(function () {
    request.restore()
  })

  t.test('_request should return the expected result', function (tt) {
    const expectedResult = {success: true}
    stub.returns(new FakeRequest(expectedResult))
    luno._request('GET', path, null, function (err, result) {
      tt.error(err)
      tt.same(result, expectedResult)
      tt.end()
    })
  })

  t.test('_request should return an error if request emits an error', function (tt) {
    stub.returns(new FakeRequest(null, {fail: true}))
    luno._request('GET', path, null, function (err) {
      tt.type(err, 'Error')
      tt.end()
    })
  })

  t.test('_request should return an error if the response is not valid', function (tt) {
    stub.returns(new FakeRequest('invalid', {stringify: false}))
    luno._request('GET', path, null, function (err) {
      tt.type(err, 'Error')
      tt.end()
    })
  })

  t.test('_request should return an error if the response contains an error', function (tt) {
    stub.returns(new FakeRequest({error: true}))
    luno._request('GET', path, null, function (err) {
      tt.type(err, 'Error')
      tt.end()
    })
  })

  t.test('_request should return an error if the response is unauthorized', function (tt) {
    stub.returns(new FakeRequest(null, {statusCode: 401}))
    luno._request('GET', path, null, function (err) {
      tt.type(err, 'Error')
      tt.end()
    })
  })
})

tap.test('External', {autoend: true}, function (t) {
  const luno = new Luno()
  const callback = function () {}
  let mock

  t.beforeEach(function () {
    mock = sinon.mock(luno)
  })

  t.afterEach(function () {
    mock.restore()
  })

  t.test('getTicker should call _request with the correct parameters', function (tt) {
    mock.expects('_request').once().withArgs('GET', '/api/1/ticker', {pair: 'XBTZAR'}, callback)
    luno.getTicker(callback)
    mock.verify()
    tt.end()
  })

  t.test('getTicker should accept a pair option', function (tt) {
    mock.expects('_request').once().withArgs('GET', '/api/1/ticker', {pair: 'XBTMYR'}, callback)
    luno.getTicker({pair: 'XBTMYR'}, callback)
    mock.verify()
    tt.end()
  })

  t.test('getAllTickers should call _request with the correct parameters', function (tt) {
    mock.expects('_request').once().withArgs('GET', '/api/1/tickers', null, callback)
    luno.getAllTickers(callback)
    mock.verify()
    tt.end()
  })

  t.test('getOrderBook should call _request with the correct parameters', function (tt) {
    mock.expects('_request').once().withArgs('GET', '/api/1/orderbook', {pair: 'XBTZAR'}, callback)
    luno.getOrderBook(callback)
    mock.verify()
    tt.end()
  })

  t.test('getOrderBook should accept a pair option', function (tt) {
    mock.expects('_request').once().withArgs('GET', '/api/1/orderbook', {pair: 'XBTMYR'}, callback)
    luno.getOrderBook({pair: 'XBTMYR'}, callback)
    mock.verify()
    tt.end()
  })

  t.test('getTrades should call _request with the correct parameters', function (tt) {
    mock.expects('_request').once().withArgs('GET', '/api/1/trades', {pair: 'XBTZAR'}, callback)
    luno.getTrades(callback)
    mock.verify()
    tt.end()
  })

  t.test('getTrades should accept a pair option', function (tt) {
    mock.expects('_request').once().withArgs('GET', '/api/1/trades', {pair: 'XBTMYR'}, callback)
    luno.getTrades({pair: 'XBTMYR'}, callback)
    mock.verify()
    tt.end()
  })

  t.test('getOrderList should call _request with the correct parameters', function (tt) {
    mock.expects('_request').once().withArgs('GET', '/api/1/listorders', {pair: 'XBTZAR'}, callback)
    luno.getOrderList(callback)
    mock.verify()
    tt.end()
  })

  t.test('getOrderList should accept a pair option', function (tt) {
    mock.expects('_request').once().withArgs('GET', '/api/1/listorders', {pair: 'XBTMYR'}, callback)
    luno.getOrderList({pair: 'XBTMYR'}, callback)
    mock.verify()
    tt.end()
  })

  t.test('postBuyOrder should call _request with the correct parameters', function (tt) {
    const parameters = {
      type: 'BID',
      volume: 9999.99,
      price: 0.001,
      pair: 'XBTZAR'
    }
    mock.expects('_request').once().withArgs('POST', '/api/1/postorder', parameters, callback)
    luno.postBuyOrder(parameters.volume, parameters.price, callback)
    mock.verify()
    tt.end()
  })

  t.test('postMarketBuyOrder should call _request with the correct parameters', function (tt) {
    const parameters = {
      type: 'BUY',
      counter_volume: 9999.99,
      pair: 'XBTZAR'
    }
    mock.expects('_request').once().withArgs('POST', '/api/1/marketorder', parameters, callback)
    luno.postMarketBuyOrder(parameters.counter_volume, callback)
    mock.verify()
    tt.end()
  })

  t.test('postSellOrder should call _request with the correct parameters', function (tt) {
    const parameters = {
      type: 'ASK',
      volume: 0.001,
      price: 9999.99,
      pair: 'XBTZAR'
    }
    mock.expects('_request').once().withArgs('POST', '/api/1/postorder', parameters, callback)
    luno.postSellOrder(parameters.volume, parameters.price, callback)
    mock.verify()
    tt.end()
  })

  t.test('postMarketSellOrder should call _request with the correct parameters', function (tt) {
    const parameters = {
      type: 'SELL',
      base_volume: 9999.99,
      pair: 'XBTZAR'
    }
    mock.expects('_request').once().withArgs('POST', '/api/1/marketorder', parameters, callback)
    luno.postMarketSellOrder(parameters.base_volume, callback)
    mock.verify()
    tt.end()
  })

  t.test('stopOrder should call _request with the correct parameters', function (tt) {
    const body = {order_id: 'BXMC2CJ7HNB88U4'}
    mock.expects('_request').once().withArgs('POST', '/api/1/stoporder', body, callback)
    luno.stopOrder(body.order_id, callback)
    mock.verify()
    tt.end()
  })

  t.test('getBalance should call _request with the correct parameters', function (tt) {
    mock.expects('_request').once().withArgs('GET', '/api/1/balance', null, callback)
    luno.getBalance(callback)
    mock.verify()
    tt.end()
  })

  t.test('getBalance should accept an asset argument and call _request with the correct parameters', function (tt) {
    mock.expects('_request').once().withArgs('GET', '/api/1/balance', { assets: ['ZAR'] }, callback)
    luno.getBalance('ZAR', callback)
    mock.verify()
    tt.end()
  })

  t.test('should call _request with the correct parameters', function (tt) {
    mock.expects('_request').once().withArgs('GET', '/api/1/funding_address', { asset: 'XBT' }, callback)
    luno.getFundingAddress('XBT', callback)
    mock.verify()
    tt.end()
  })
})
