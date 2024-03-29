'use strict'

const Luno = require('../lib/luno')
const fs = require('fs')
const https = require('https')
const path = require('path')
const querystring = require('querystring')
const tap = require('tap')

const port = process.env.PORT || 8001
const luno = new Luno('keyId', 'keySecret', {
  hostname: 'localhost',
  port: port,
  ca: fs.readFileSync(path.join(__dirname, 'ssl', 'ca', 'root.pem'))
})
const options = {
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'server', 'test.key')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server', 'test.crt'))
}
const server = https.createServer(options).listen(port, 'localhost')

tap.afterEach(function () {
  server.removeAllListeners('request')
})

tap.teardown(function (done) {
  server.close(done)
})

tap.test('getTicker returns expected ticker', function (t) {
  const expectedTicker = {
    timestamp: 1366224386716,
    currency: 'ZAR',
    bid: '924.00',
    ask: '1050.00',
    last_trade: '950.00',
    rolling_24_hour_volume: '12.52'
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'GET')
    t.equal(req.url, '/api/1/ticker?pair=XBTZAR')
    res.end(JSON.stringify(expectedTicker))
  })

  luno.getTicker(function (err, ticker) {
    t.error(err)
    t.same(ticker, expectedTicker)
    t.end()
  })
})

tap.test('getAllTickers returns expected tickers', function (t) {
  const expectedTickers = {
    tickers: [
      {
        timestamp: 1405413955793,
        bid: '6801.00',
        ask: '6900.00',
        last_trade: '6900.00',
        rolling_24_hour_volume: '12.455579',
        pair: 'XBTZAR'
      },
      {
        timestamp: 1405413955337,
        bid: '5000.00',
        ask: '6968.00',
        last_trade: '6830.00',
        rolling_24_hour_volume: '0.00',
        pair: 'XBTNAD'
      }
    ]
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'GET')
    t.equal(req.url, '/api/1/tickers')
    res.end(JSON.stringify(expectedTickers))
  })

  luno.getAllTickers(function (err, tickers) {
    t.error(err)
    t.same(tickers, expectedTickers)
    t.end()
  })
})

tap.test('getOrderBook returns the expected order book', function (t) {
  const expectedOrderBook = {
    timestamp: 1366305398592,
    currency: 'ZAR',
    asks: [
      {price: '1180.00', volume: '0.10'},
      {price: '2000.00', volume: '0.10'}
    ],
    bids: [
      {price: '1100.00', volume: '0.10'},
      {price: '1000.00', volume: '0.10'},
      {price: '900.00', volume: '0.10'}
    ]
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'GET')
    t.equal(req.url, '/api/1/orderbook?pair=XBTZAR')
    res.end(JSON.stringify(expectedOrderBook))
  })

  luno.getOrderBook(function (err, orderBook) {
    t.error(err)
    t.same(orderBook, expectedOrderBook)
    t.end()
  })
})

tap.test('getTrades should return the expected trades', function (t) {
  const expectedTrades = {
    currency: 'ZAR',
    trades: [
      {timestamp: 1366052621774, price: '1000.00', volume: '0.10'},
      {timestamp: 1366052621770, price: '1020.50', volume: '1.20'}
    ]
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'GET')
    t.equal(req.url, '/api/1/trades?pair=XBTZAR')
    res.end(JSON.stringify(expectedTrades))
  })

  luno.getTrades(function (err, trades) {
    t.error(err)
    t.same(trades, expectedTrades)
    t.end()
  })
})

tap.test('getOrderList should return the expected order list', function (t) {
  const expectedOrderList = {
    orders: [
      {
        order_id: 'BXMC2CJ7HNB88U4',
        creation_timestamp: 1367849297609,
        expiration_timestamp: 1367935697609,
        type: 'ASK',
        state: 'PENDING',
        limit_price: '1000.00',
        limit_volume: '0.80',
        btc: '0.00',
        zar: '0.00',
        fee_btc: '0.00',
        fee_zar: '0.00'
      }
    ]
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'GET')
    t.equal(req.url, '/api/1/listorders?pair=XBTZAR')
    res.end(JSON.stringify(expectedOrderList))
  })

  luno.getOrderList(function (err, orderList) {
    t.error(err)
    t.same(orderList, expectedOrderList)
    t.end()
  })
})

tap.test('getOrderList should return the expected order list for the given state', function (t) {
  const expectedOrderList = {
    orders: [
      {
        order_id: 'BXMC2CJ7HNB88U4',
        creation_timestamp: 1367849297609,
        expiration_timestamp: 1367935697609,
        type: 'ASK',
        state: 'PENDING',
        limit_price: '1000.00',
        limit_volume: '0.80',
        btc: '0.00',
        zar: '0.00',
        fee_btc: '0.00',
        fee_zar: '0.00'
      }
    ]
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'GET')
    t.equal(req.url, '/api/1/listorders?pair=XBTZAR&state=PENDING')
    res.end(JSON.stringify(expectedOrderList))
  })

  const options = {
    state: 'PENDING'
  }
  luno.getOrderList(options, function (err, orderList) {
    t.error(err)
    t.same(orderList, expectedOrderList)
    t.end()
  })
})

tap.test('getTradeList should return the expected trade list', function (t) {
  const expectedTradeList = {
    trades: [
      {
        pair: 'XBTZAR',
        sequence: 7562242,
        order_id: 'BXCYRHZZJT9XZP9',
        type: 'ASK',
        timestamp: 1579472779614,
        price: '131671.00',
        volume: '0.079446',
        base: '0.079446',
        counter: '10460.734266',
        fee_base: '0.00',
        fee_counter: '0.00',
        is_buy: true
      },
      {
        pair: 'XBTZAR',
        sequence: 7562151,
        order_id: 'BXBVV69D2J4ZMDG',
        type: 'BID',
        timestamp: 1579472099102,
        price: '132021.00',
        volume: '0.124201',
        base: '0.124201',
        counter: '16397.140221',
        fee_base: '0.00',
        fee_counter: '0.00',
        is_buy: false
      }
    ]
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'GET')
    t.equal(req.url, '/api/1/listtrades?pair=XBTZAR')
    res.end(JSON.stringify(expectedTradeList))
  })

  luno.getTradeList(function (err, orderList) {
    t.error(err)
    t.same(orderList, expectedTradeList)
    t.end()
  })
})

tap.test('getOrderList should return the expected trade list with expected limit', function (t) {
  const expectedOrderList = {
    trades: [
      {
        pair: 'XBTZAR',
        sequence: 7562242,
        order_id: 'BXCYRHZZJT9XZP9',
        type: 'ASK',
        timestamp: 1579472779614,
        price: '131671.00',
        volume: '0.079446',
        base: '0.079446',
        counter: '10460.734266',
        fee_base: '0.00',
        fee_counter: '0.00',
        is_buy: true
      }
    ]
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'GET')
    t.equal(req.url, '/api/1/listtrades?pair=XBTZAR&limit=1')
    res.end(JSON.stringify(expectedOrderList))
  })

  const options = {
    limit: 1
  }
  luno.getTradeList(options, function (err, orderList) {
    t.error(err)
    t.same(orderList, expectedOrderList)
    t.end()
  })
})

tap.test('getFeeInfo should return the expected fee info', function (t) {
  const expectedFeeInfo = {
    maker_fee: '0.00',
    taker_fee: '0.01',
    thirty_day_volume: '0.016336'
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'GET')
    t.equal(req.url, '/api/1/fee_info?pair=XBTZAR')
    res.end(JSON.stringify(expectedFeeInfo))
  })

  luno.getFeeInfo(function (err, limits) {
    t.error(err)
    t.same(limits, expectedFeeInfo)
    t.end()
  })
})

tap.test('getFeeInfo should accept options', function (t) {
  const expectedFeeInfo = {
    maker_fee: '0.00',
    taker_fee: '0.01',
    thirty_day_volume: '0.016336'
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'GET')
    t.equal(req.url, '/api/1/fee_info?pair=XBTZAR')
    res.end(JSON.stringify(expectedFeeInfo))
  })

  luno.getFeeInfo({pair: 'XBTZAR'}, function (err, limits) {
    t.error(err)
    t.same(limits, expectedFeeInfo)
    t.end()
  })
})

tap.test('postBuyOrder should post the correct fields and return an order id', function (t) {
  const expectedOrder = {order_id: 'BXMC2CJ7HNB88U4'}
  const volume = 9999.99
  const price = 0.0001

  server.on('request', function (req, res) {
    t.equal(req.method, 'POST')
    t.equal(req.url, '/api/1/postorder')
    t.equal(req.headers['content-type'], 'application/x-www-form-urlencoded')
    let body = ''
    req.on('data', function (data) {
      body += data
    })
    req.on('end', function () {
      body = querystring.parse(body)
      t.equal(body.type, 'BID')
      t.equal(body.volume, volume.toString())
      t.equal(body.price, price.toString())
      t.equal(body.pair, 'XBTZAR')
      res.end(JSON.stringify(expectedOrder))
    })
  })

  luno.postBuyOrder(volume, price, function (err, order) {
    t.error(err)
    t.same(order, expectedOrder)
    t.end()
  })
})

tap.test('postBuyOrder should accept options', function (t) {
  const expectedOrder = {order_id: 'BXMC2CJ7HNB88U4'}
  const volume = 9999.99
  const price = 0.0001

  server.on('request', function (req, res) {
    t.equal(req.method, 'POST')
    t.equal(req.url, '/api/1/postorder')
    t.equal(req.headers['content-type'], 'application/x-www-form-urlencoded')
    let body = ''
    req.on('data', function (data) {
      body += data
    })
    req.on('end', function () {
      body = querystring.parse(body)
      t.equal(body.type, 'BID')
      t.equal(body.volume, volume.toString())
      t.equal(body.price, price.toString())
      t.equal(body.pair, 'XBTZAR')
      res.end(JSON.stringify(expectedOrder))
    })
  })

  luno.postBuyOrder(volume, price, {post_only: true}, function (err, order) {
    t.error(err)
    t.same(order, expectedOrder)
    t.end()
  })
})

tap.test('postBuyOrder should return an error if the order would exceed order limits', function (t) {
  const expectedError = 'Order would exceed your order limits.'

  server.on('request', function (req, res) {
    t.equal(req.method, 'POST')
    t.equal(req.url, '/api/1/postorder')
    res.end(JSON.stringify({error: expectedError}))
  })

  luno.postBuyOrder(9999.99, 0.01, function (err) {
    t.equal(err.message, expectedError)
    t.end()
  })
})

tap.test('postMarketBuyOrder should post the correct fields and return an order id', function (t) {
  const expectedOrder = {order_id: 'BXMC2CJ7HNB88U4'}

  server.on('request', function (req, res) {
    t.equal(req.method, 'POST')
    t.equal(req.url, '/api/1/marketorder')
    let body = ''
    req.on('data', function (data) {
      body += data
    })
    req.on('end', function () {
      body = querystring.parse(body)
      t.equal(body.type, 'BUY')
      t.equal(body.counter_volume, '100.50')
      t.equal(body.pair, 'XBTZAR')
      res.end(JSON.stringify(expectedOrder))
    })
  })

  luno.postMarketBuyOrder('100.50', function (err, order) {
    t.error(err)
    t.same(order, expectedOrder)
    t.end()
  })
})

tap.test('postMarketBuyOrder should accept options', function (t) {
  const expectedOrder = {order_id: 'BXMC2CJ7HNB88U4'}

  server.on('request', function (req, res) {
    t.equal(req.method, 'POST')
    t.equal(req.url, '/api/1/marketorder')
    let body = ''
    req.on('data', function (data) {
      body += data
    })
    req.on('end', function () {
      body = querystring.parse(body)
      t.equal(body.type, 'BUY')
      t.equal(body.counter_volume, '100.50')
      t.equal(body.pair, 'XBTZAR')
      res.end(JSON.stringify(expectedOrder))
    })
  })

  luno.postMarketBuyOrder('100.50', {base_account_id: 12345}, function (err, order) {
    t.error(err)
    t.same(order, expectedOrder)
    t.end()
  })
})

tap.test('postSellOrder should post the correct fields and return an order id', function (t) {
  const expectedOrder = {order_id: 'BXMC2CJ7HNB88U4'}
  const volume = 0.001
  const price = 9999.99

  server.on('request', function (req, res) {
    t.equal(req.method, 'POST')
    t.equal(req.url, '/api/1/postorder')
    t.equal(req.headers['content-type'], 'application/x-www-form-urlencoded')
    let body = ''
    req.on('data', function (data) {
      body += data
    })
    req.on('end', function () {
      body = querystring.parse(body)
      t.equal(body.type, 'ASK')
      t.equal(body.volume, volume.toString())
      t.equal(body.price, price.toString())
      t.equal(body.pair, 'XBTZAR')
      res.end(JSON.stringify(expectedOrder))
    })
  })

  luno.postSellOrder(volume, price, function (err, order) {
    t.error(err)
    t.same(order, expectedOrder)
    t.end()
  })
})

tap.test('postSellOrder should accept options', function (t) {
  const expectedOrder = {order_id: 'BXMC2CJ7HNB88U4'}
  const volume = 0.001
  const price = 9999.99

  server.on('request', function (req, res) {
    t.equal(req.method, 'POST')
    t.equal(req.url, '/api/1/postorder')
    t.equal(req.headers['content-type'], 'application/x-www-form-urlencoded')
    let body = ''
    req.on('data', function (data) {
      body += data
    })
    req.on('end', function () {
      body = querystring.parse(body)
      t.equal(body.type, 'ASK')
      t.equal(body.volume, volume.toString())
      t.equal(body.price, price.toString())
      t.equal(body.pair, 'XBTZAR')
      res.end(JSON.stringify(expectedOrder))
    })
  })

  luno.postSellOrder(volume, price, {post_only: true}, function (err, order) {
    t.error(err)
    t.same(order, expectedOrder)
    t.end()
  })
})

tap.test('postMarketSellOrder should post the correct fields and return an order id', function (t) {
  const expectedOrder = {order_id: 'BXMC2CJ7HNB88U4'}

  server.on('request', function (req, res) {
    t.equal(req.method, 'POST')
    t.equal(req.url, '/api/1/marketorder')
    let body = ''
    req.on('data', function (data) {
      body += data
    })
    req.on('end', function () {
      body = querystring.parse(body)
      t.equal(body.type, 'SELL')
      t.equal(body.base_volume, '100.50')
      t.equal(body.pair, 'XBTZAR')
      res.end(JSON.stringify(expectedOrder))
    })
  })

  luno.postMarketSellOrder('100.50', function (err, order) {
    t.error(err)
    t.same(order, expectedOrder)
    t.end()
  })
})

tap.test('postMarketSellOrder should accept options', function (t) {
  const expectedOrder = {order_id: 'BXMC2CJ7HNB88U4'}

  server.on('request', function (req, res) {
    t.equal(req.method, 'POST')
    t.equal(req.url, '/api/1/marketorder')
    let body = ''
    req.on('data', function (data) {
      body += data
    })
    req.on('end', function () {
      body = querystring.parse(body)
      t.equal(body.type, 'SELL')
      t.equal(body.base_volume, '100.50')
      t.equal(body.pair, 'XBTZAR')
      res.end(JSON.stringify(expectedOrder))
    })
  })

  luno.postMarketSellOrder('100.50', {base_account_id: 12345}, function (err, order) {
    t.error(err)
    t.same(order, expectedOrder)
    t.end()
  })
})

tap.test('stopOrder should post the order id and return success', function (t) {
  const expectedResult = {success: true}
  const orderId = 'BXMC2CJ7HNB88U4'

  server.on('request', function (req, res) {
    t.equal(req.method, 'POST')
    t.equal(req.url, '/api/1/stoporder')
    t.equal(req.headers['content-type'], 'application/x-www-form-urlencoded')
    let body = ''
    req.on('data', function (data) {
      body += data
    })
    req.on('end', function () {
      body = querystring.parse(body)
      t.equal(body.order_id, orderId)
      res.end(JSON.stringify(expectedResult))
    })
  })

  luno.stopOrder(orderId, function (err, result) {
    t.error(err)
    t.same(result, expectedResult)
    t.end()
  })
})

tap.test('stopOrder should return an error if the order is unknown or non-pending', function (t) {
  const expectedError = 'Cannot stop unknown or non-pending order'

  server.on('request', function (req, res) {
    t.equal(req.method, 'POST')
    t.equal(req.url, '/api/1/stoporder')
    res.end(JSON.stringify({error: expectedError}))
  })

  luno.stopOrder('BXMC2CJ7HNB88U4', function (err) {
    t.equal(err.message, expectedError)
    t.end()
  })
})

tap.test('getOrder should return the order', function (t) {
  const expectedOrder = {
    order_id: 'BXHW6PFRRXKFSB4',
    creation_timestamp: 1402866878367,
    expiration_timestamp: 0,
    type: 'ASK',
    state: 'PENDING',
    limit_price: '6500.00',
    limit_volume: '0.05',
    base: '0.03',
    counter: '195.02',
    fee_base: '0.000',
    fee_counter: '0.00',
    trades: [
      {
        price: '6501.00',
        timestamp: 1402866878467,
        volume: '0.02'
      },
      {
        price: '6500.00',
        timestamp: 1402866878567,
        volume: '0.01'
      }
    ]
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'GET')
    t.equal(req.url, '/api/1/orders/BXHW6PFRRXKFSB4')
    res.end(JSON.stringify(expectedOrder))
  })

  luno.getOrder('BXHW6PFRRXKFSB4', function (err, order) {
    t.error(err)
    t.same(order, expectedOrder)
    t.end()
  })
})

tap.test('getBalance should return all balances when no asset parameter is provided', function (t) {
  const expectedBalances = {
    balance: [
      {
        account_id: '1224342323',
        asset: 'XBT',
        balance: '1.012423',
        reserved: '0.01',
        unconfirmed: '0.421'
      }, {
        account_id: '2997473',
        asset: 'ZAR',
        balance: '1000.00',
        reserved: '0.00',
        unconfirmed: '0.00'
      }
    ]
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'GET')
    t.equal(req.url, '/api/1/balance')
    res.end(JSON.stringify(expectedBalances))
  })

  luno.getBalance(function (err, balances) {
    t.error(err)
    t.same(balances, expectedBalances)
    t.end()
  })
})

tap.test('getBalance should return the balance for the specified asset', function (t) {
  const expectedBalances = {
    balance: [
      {
        asset: 'ZAR',
        balance: '1000.00',
        reserved: '800.00'
      }
    ]
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'GET')
    t.equal(req.url, '/api/1/balance?assets=ZAR')
    res.end(JSON.stringify(expectedBalances))
  })

  luno.getBalance('ZAR', function (err, balances) {
    t.error(err)
    t.same(balances, expectedBalances)
    t.end()
  })
})

tap.test('getFundingAddress should return the funding address', function (t) {
  const expectedFundingAddress = {
    asset: 'XBT',
    address: 'B1tC0InExAMPL3fundIN6AdDreS5t0Use',
    total_received: '1.234567',
    total_unconfirmed: '0.00'
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'GET')
    t.equal(req.url, '/api/1/funding_address?asset=XBT')
    res.end(JSON.stringify(expectedFundingAddress))
  })

  luno.getFundingAddress('XBT', function (err, fundingAddress) {
    t.error(err)
    t.same(fundingAddress, expectedFundingAddress)
    t.end()
  })
})

tap.test('getFundingAddress should return the funding address specified', function (t) {
  const expectedFundingAddress = {
    asset: 'XBT',
    address: 'B1tC0InExAMPL3fundIN6AdDreS5t0Use',
    total_received: '1.234567',
    total_unconfirmed: '0.00'
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'GET')
    t.equal(req.url, '/api/1/funding_address?asset=XBT&address=B1tC0InExAMPL3fundIN6AdDreS5t0Use')
    res.end(JSON.stringify(expectedFundingAddress))
  })

  const options = {
    address: 'B1tC0InExAMPL3fundIN6AdDreS5t0Use'
  }
  luno.getFundingAddress('XBT', options, function (err, fundingAddress) {
    t.error(err)
    t.same(fundingAddress, expectedFundingAddress)
    t.end()
  })
})

tap.test('createFundingAddress should return a new funding address', function (t) {
  const expectedFundingAddress = {
    asset: 'XBT',
    address: 'B1tC0InExAMPL3fundIN6AdDreS5t0Use',
    total_received: '0.00',
    total_unconfirmed: '0.00'
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'POST')
    t.equal(req.url, '/api/1/funding_address')
    let body = ''
    req.on('data', function (data) {
      body += data
    })
    req.on('end', function () {
      body = querystring.parse(body)
      t.equal(body.asset, 'XBT')
      res.end(JSON.stringify(expectedFundingAddress))
    })
  })

  luno.createFundingAddress('XBT', function (err, fundingAddress) {
    t.error(err)
    t.same(fundingAddress, expectedFundingAddress)
    t.end()
  })
})

tap.test('getWithdrawals should return the withdrawals', function (t) {
  const expectedWithdrawls = {
    withdrawals: [
      {
        status: 'PENDING',
        id: '2221'
      },
      {
        status: 'COMPLETED',
        id: '1121'
      }
    ]
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'GET')
    t.equal(req.url, '/api/1/withdrawals/')
    res.end(JSON.stringify(expectedWithdrawls))
  })

  luno.getWithdrawals(function (err, withdrawals) {
    t.error(err)
    t.same(withdrawals, expectedWithdrawls)
    t.end()
  })
})

tap.test('getWithdrawal should return the withdrawal', function (t) {
  const expectedWithdrawal = {
    status: 'COMPLETED',
    id: '1212'
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'GET')
    t.equal(req.url, '/api/1/withdrawals/1212')
    res.end(JSON.stringify(expectedWithdrawal))
  })

  luno.getWithdrawal('1212', function (err, withdrawal) {
    t.error(err)
    t.same(withdrawal, expectedWithdrawal)
    t.end()
  })
})

tap.test('requestWithdrawal should post the correct fields and return a new withdrawal', function (t) {
  const expectedWithdrawal = {
    status: 'PENDING',
    id: '1212'
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'POST')
    t.equal(req.url, '/api/1/withdrawals/')
    let body = ''
    req.on('data', function (data) {
      body += data
    })
    req.on('end', function () {
      body = querystring.parse(body)
      t.equal(body.type, 'ZAR_EFT')
      t.equal(body.amount, '1000')
      res.end(JSON.stringify(expectedWithdrawal))
    })
  })

  luno.requestWithdrawal('ZAR_EFT', 1000, function (err, withdrawal) {
    t.error(err)
    t.same(withdrawal, expectedWithdrawal)
    t.end()
  })
})

tap.test('cancelWithdrawal should delete the specified withdrawal', function (t) {
  const expectedWithdrawal = {
    status: 'CANCELLED',
    id: '1212'
  }

  server.on('request', function (req, res) {
    t.equal(req.method, 'DELETE')
    t.equal(req.url, '/api/1/withdrawals/1212')
    res.end(JSON.stringify(expectedWithdrawal))
  })

  luno.cancelWithdrawal('1212', function (err, withdrawal) {
    t.error(err)
    t.same(withdrawal, expectedWithdrawal)
    t.end()
  })
})

tap.test('apiCallRate should return expected number of API calls', function (t) {
  const apiCalls = 32
  const expectedRate = luno.apiCallRate + apiCalls
  for (let i = 0; i < apiCalls; i += 1) {
    luno.getTicker(function (err, ticker) {
    })
  }
  t.equal(luno.apiCallRate, expectedRate)
  t.end()
})

tap.test('apiCallRate should refresh after one minute ', function (t) {
  t.equal(luno.apiCallRate > 0, true)
  setTimeout(function () {
    t.equal(luno._requestMts.length, 0)
    t.end()
  }, 60000)
})

tap.test('apiCallRate should refresh when called ', function (t) {
  const expectedRate = 32

  for (let i = 0; i < expectedRate; i += 1) {
    luno.getTicker(function (err, ticker) {
    })
  }

  setTimeout(function () {
    for (let i = 0; i < expectedRate; i += 1) {
      luno.getTicker(function (err, ticker) {
      })
    }
    t.equal(luno.apiCallRate, 2 * expectedRate)
  }, 300)

  setTimeout(function () {
    t.equal(luno.apiCallRate, expectedRate)
  }, 60000)

  setTimeout(function () {
    t.equal(luno.apiCallRate, 0)
    t.end()
  }, 61000)
})
