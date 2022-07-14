'use strict'

const https = require('https')
const path = require('path')
const querystring = require('querystring')
const config = require(path.join(__dirname, '..', 'package'))
const Debug = require('debug')

const debugReq = Debug('luno:req')
const debugRes = Debug('luno:res')

const defaultHeaders = {
  'Accept': 'application/json',
  'Accept-Charset': 'utf-8',
  'User-Agent': 'luno-api-node v' + config.version
}

function Luno (keyId, keySecret, options) {
  if (!(this instanceof Luno)) {
    return new Luno(keyId, keySecret, options)
  }

  if (typeof keyId === 'string') {
    this.auth = keyId + ':' + keySecret
  } else {
    options = keyId
  }

  options = options || {}
  this.hostname = options.hostname || 'api.luno.com'
  this.port = options.port || 443
  this.ca = options.ca
  this.pair = options.pair || 'XBTZAR'
  this._requestMts = []
  this._requestsRefresh = this._requestsRefresh.bind(this)
  this._timeoutId = null
}

Object.defineProperty(Luno.prototype, 'apiCallRate', {
  get: function () {
    return this._requestsRefresh()
  }
})

Luno.prototype._requestsRefresh = function () {
  const maxMts = Date.now() - 60000
  while (this._requestMts.length > 0 && this._requestMts[0] < maxMts) {
    this._requestMts.shift()
  }

  if (this._requestMts.length > 0) {
    this._timeoutId.refresh()
    this._timeoutId.unref()
  } else {
    clearTimeout(this._timeoutId)
    this._timeoutId = null
  }

  return this._requestMts.length
}

Luno.prototype._request = function (method, resourcePath, data, callback) {
  const headers = Object.assign({}, defaultHeaders)
  data = querystring.stringify(data)
  if (method === 'GET') {
    if (data) {
      resourcePath += '?' + data
    }
  } else if (method === 'POST') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    headers['Content-Length'] = Buffer.byteLength(data)
  }

  const options = {
    headers: headers,
    hostname: this.hostname,
    path: resourcePath,
    port: this.port,
    auth: this.auth,
    method: method,
  }

  if (this.ca) {
    options.ca = this.ca
    options.agent = new https.Agent(options)
  }

  const mts = Date.now()
  const requestMts = this._requestMts
  requestMts.push(mts)
  if (this._timeoutId === null) {
    this._timeoutId = setTimeout(this._requestsRefresh, 60000)
    this._timeoutId.unref()
  }

  const apiCallRate = this.apiCallRate
  const promise = new Promise(function (resolve, reject) {
    debugReq(options.method + ' ' + options.path)
    const req = https.request(options)
    req.on('response', function (res) {
      let response = ''

      res.setEncoding('utf8')

      res.on('data', function (data) {
        response += data
      })

      res.on('end', function () {
        debugRes(response)
        if (res.statusCode !== 200) {
          let lunoApiError
          try {
            response = JSON.parse(response)
            let errTooManyRequestsDetails = ''
            if (response.error_code.includes('429') || response.error_code.includes('ErrTooManyRequests')) {
              let i = requestMts.length - 1
              while (i >= 0) {
                if (requestMts[i] === mts) {
                  requestMts.splice(i, 1)
                  break
                }

                i -= 1
              }

              errTooManyRequestsDetails = ' (' + apiCallRate + ')'
            }

            lunoApiError = new Error('luno API error ' + response.error_code +': ' + errTooManyRequestsDetails + response.error)
            lunoApiError.error_code = response.error_code
          } catch (err) {
            lunoApiError = new Error('luno API error ' + res.statusCode + ': ' + response)
          }

          if (lunoApiError) {
            if (typeof callback === 'function') {
              return callback(lunoApiError)
            } else {
              return reject(lunoApiError)
            }
          }
        }

        try {
          response = JSON.parse(response)
        } catch (err) {
          if (typeof callback === 'function') {
            return callback(err)
          } else {
            return reject(err)
          }
        }

        if (response.error) {
          const err = new Error(response.error)
          if (typeof callback === 'function') {
            return callback(err)
          } else {
            return reject(err)
          }
        }

        if (typeof callback === 'function') {
          return callback(null, response)
        } else {
          return resolve(response)
        }

      })
    })

    req.on('error', function (err) {
      if (typeof callback === 'function') {
        return callback(err)
      } else {
        return reject(err)
      }
    })

    if (method === 'POST' && data) {
      req.write(data)
    }

    req.end()
  })

  if (typeof callback !== 'function') {
    return promise
  }
}

Luno.prototype.getTicker = function (options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const defaults = {
    pair: this.pair,
  }

  return this._request('GET', '/api/1/ticker', Object.assign(defaults, options), callback)
}

Luno.prototype.getAllTickers = function (callback) {
  return this._request('GET', '/api/1/tickers', null, callback)
}

Luno.prototype.getOrderBook = function (options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const defaults = {
    pair: this.pair,
  }

  return this._request('GET', '/api/1/orderbook', Object.assign(defaults, options), callback)
}

Luno.prototype.getTrades = function (options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const defaults = {
    pair: this.pair,
  }

  return this._request('GET', '/api/1/trades', Object.assign(defaults, options), callback)
}

Luno.prototype.getOrderList = function (options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const defaults = {
    pair: this.pair,
  }

  return this._request('GET', '/api/1/listorders', Object.assign(defaults, options), callback)
}

Luno.prototype.getOrderListV2 = function (options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const defaults = {
    pair: this.pair,
  }

  return this._request('GET', '/api/exchange/2/listorders', Object.assign(defaults, options), callback)
}

Luno.prototype.getTradeList = function (options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const defaults = {
    pair: this.pair,
  }

  return this._request('GET', '/api/1/listtrades', Object.assign(defaults, options), callback)
}

Luno.prototype.getFeeInfo = function (options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const defaults = {
    pair: this.pair,
  }

  return this._request('GET', '/api/1/fee_info', Object.assign(defaults, options), callback)
}

Luno.prototype.stopOrder = function (orderId, callback) {
  const body = {
    order_id: orderId,
  }

  return this._request('POST', '/api/1/stoporder', body, callback)
}

Luno.prototype.postBuyOrder = function (volume, price, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const body = {
    type: 'BID',
    volume: volume,
    price: price,
    pair: this.pair,
  }

  return this._request('POST', '/api/1/postorder', Object.assign(body, options), callback)
}

Luno.prototype.postMarketBuyOrder = function (volume, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const body = {
    type: 'BUY',
    counter_volume: volume,
    pair: this.pair,
  }

  return this._request('POST', '/api/1/marketorder', Object.assign(body, options), callback)
}

Luno.prototype.postSellOrder = function (volume, price, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const body = {
    type: 'ASK',
    volume: volume,
    price: price,
    pair: this.pair,
  }

  return this._request('POST', '/api/1/postorder', Object.assign(body, options), callback)
}

Luno.prototype.postMarketSellOrder = function (volume, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const body = {
    type: 'SELL',
    base_volume: volume,
    pair: this.pair,
  }

  return this._request('POST', '/api/1/marketorder', Object.assign(body, options), callback)
}

Luno.prototype.getOrder = function (id, callback) {
  return this._request('GET', '/api/1/orders/' + id, null, callback)
}

Luno.prototype.getOrderV2 = function (id, callback) {
  return this._request('GET', '/api/exchange/2/orders/' + id, null, callback)
}

Luno.prototype.getOrderV3 = function (options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  return this._request('GET', '/api/exchange/3/order', options, callback)
}

Luno.prototype.getBalance = function (asset, callback) {
  if (typeof asset === 'function') {
    callback = asset
    asset = null
  }

  return this._request('GET', '/api/1/balance', asset ? {asset: asset} : null, callback)
}

Luno.prototype.getFundingAddress = function (asset, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const defaults = {
    asset: asset,
  }

  return this._request('GET', '/api/1/funding_address', Object.assign(defaults, options), callback)
}

Luno.prototype.createFundingAddress = function (asset, callback) {
  return this._request('POST', '/api/1/funding_address', {asset: asset}, callback)
}

Luno.prototype.getTransactions = function (asset, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const defaults = {
    asset: asset,
    offset: 0,
    limit: 10,
  }

  return this._request('GET', '/api/1/transactions', Object.assign(defaults, options), callback)
}

Luno.prototype.getWithdrawals = function (callback) {
  return this._request('GET', '/api/1/withdrawals/', null, callback)
}

Luno.prototype.getWithdrawal = function (id, callback) {
  return this._request('GET', '/api/1/withdrawals/' + id, null, callback)
}

Luno.prototype.requestWithdrawal = function (type, amount, callback) {
  const options = {
    type: type,
    amount: amount,
  }

  return this._request('POST', '/api/1/withdrawals/', options, callback)
}

Luno.prototype.cancelWithdrawal = function (id, callback) {
  return this._request('DELETE', '/api/1/withdrawals/' + id, null, callback)
}

module.exports = Luno
