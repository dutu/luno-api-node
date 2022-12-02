'use strict'

const https = require('https')
const path = require('path')
const querystring = require('querystring')
const config = require(path.join(__dirname, '..', 'package'))
const Debug = require('debug')

const debugReq = Debug('luno:req')
const debugRes = Debug('luno:res')

const defaults = function (defaultParams, options, callback) {
  let params = Object.assign({}, defaultParams)
  let cb = callback
  if (typeof options === 'function') {
    cb = options
  } else {
    Object.assign(params, options)
  }

  return [params, cb]
}

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
  } else if (method === 'POST' || method === 'PUT') {
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
    debugReq(options.method + ' ' + resourcePath + '?' + data)
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

    if ((method === 'POST' || method === 'PUT') && data) {
      req.write(data)
    }

    req.end()
  })

  if (typeof callback !== 'function') {
    return promise
  }
}

Luno.prototype.createAccount = function (currency, name, callback) {
  let params = { currency, name }
  return this._request('POST', '/api/1/accounts', params , callback)
}

Luno.prototype.updateAccountName = function (id, name, callback) {
  let params = { name }
  return this._request('PUT', `/api/1/accounts/${id}`, params, callback)
}

Luno.prototype.listAccountPendingTransactions = function (id, callback) {
  return this._request('GET', `/api/1/accounts/${id}/pending`, null, callback)
}

Luno.prototype.listAccountTransactions = function (id, min_row, max_row, callback) {
  let params = { min_row, max_row }
  return this._request('GET', `/api/1/accounts/${id}/transactions`, params, callback)
}

Luno.prototype.listAccountBalances = function (assets = [], callback) {
  let params = assets.length > 0 ? { assets } : null
  return this._request('GET', `/api/1/balance`, params, callback)
}

Luno.prototype.getMove = function (options, callback) {
  return this._request('GET', `/api/1/move`, options, callback)
}

Luno.prototype.move = function (amount, debit_account_id, credit_account_id, options, callback) {
  let [params, cb] = defaults({
    amount,
    debit_account_id,
    credit_account_id,
  }, options, callback)

  return this._request('POST', `/api/1/move`, params, cb)
}

Luno.prototype.listMoves = function (options, callback) {
  return this._request('GET', `/api/1/move/list_moves`, options, callback)
}

Luno.prototype.getTicker = function (options, callback) {
  let [params, cb] = defaults({
    pair: this.pair,
  }, options, callback)

  return this._request('GET', '/api/1/ticker', params, cb)
}

Luno.prototype.getAllTickers = function (callback) {
  return this._request('GET', '/api/1/tickers', null, callback)
}

Luno.prototype.getOrderBook = function (options, callback) {
  let [params, cb] = defaults({
    pair: this.pair,
  }, options, callback)

  return this._request('GET', '/api/1/orderbook', params, cb)
}

Luno.prototype.getTrades = function (options, callback) {
  let [params, cb] = defaults({
    pair: this.pair,
  }, options, callback)

  return this._request('GET', '/api/1/trades', params, cb)
}

Luno.prototype.getOrderList = function (options, callback) {
  let [params, cb] = defaults({
    pair: this.pair,
  }, options, callback)

  return this._request('GET', '/api/1/listorders', params, cb)
}

Luno.prototype.getOrderListV2 = function (options, callback) {
  let [params, cb] = defaults({
    pair: this.pair,
  }, options, callback)

  return this._request('GET', '/api/exchange/2/listorders', params, cb)
}

Luno.prototype.getTradeList = function (options, callback) {
  let [params, cb] = defaults({
    pair: this.pair,
  }, options, callback)

  return this._request('GET', '/api/1/listtrades', params, cb)
}

Luno.prototype.getFeeInfo = function (options, callback) {
  let [params, cb] = defaults({
    pair: this.pair,
  }, options, callback)

  return this._request('GET', '/api/1/fee_info', params, cb)
}

Luno.prototype.stopOrder = function (orderId, callback) {
  const params = {
    order_id: orderId,
  }

  return this._request('POST', '/api/1/stoporder', params, callback)
}

Luno.prototype.postLimitOrder = function (type, volume, price, options, callback) {
  let [params, cb] = defaults({
    type,
    volume: volume,
    price: price,
    pair: this.pair,
  }, options, callback)

  return this._request('POST', '/api/1/postorder', params, cb)
}

Luno.prototype.postBuyOrder = function (volume, price, options, callback) {
  return this.postLimitOrder('BID', volume, price, options, callback)
}

Luno.prototype.postSellOrder = function (volume, price, options, callback) {
  return this.postLimitOrder('ASK', volume, price, options, callback)
}

Luno.prototype.postMarketOrder = function (type, volume, options, callback) {
  let [params, cb] = defaults({
    type,
    pair: this.pair,
  }, options, callback)

  if (type === 'SELL') {
    params.base_volume = volume
  }

  if (type === 'BUY') {
    params.counter_volume = volume
  }

  return this._request('POST', '/api/1/marketorder', params, cb)
}

Luno.prototype.postMarketBuyOrder = function (volume, options, callback) {
  return this.postMarketOrder('BUY', volume, options, callback)
}

Luno.prototype.postMarketSellOrder = function (volume, options, callback) {
  return this.postMarketOrder('SELL', volume, options, callback)
}

Luno.prototype.getOrder = function (id, callback) {
  return this._request('GET', `/api/1/orders/${id}`, null, callback)
}

Luno.prototype.getOrderV2 = function (id, callback) {
  return this._request('GET', `/api/exchange/2/orders/${id}`, null, callback)
}

Luno.prototype.getOrderV3 = function (options, callback) {
  let [params, cb] = defaults({}, options, callback)

  return this._request('GET', '/api/exchange/3/order', params, cb)
}

Luno.prototype.getBalance = function (asset, callback) {
  let params = null
  let cb = callback
  if (typeof asset === 'string') {
    params = { assets: [asset] }
  }

  if (Array.isArray(asset)) {
    params = { assets: asset }
  }

  if (typeof asset === 'function') {
    cb = asset
  }

  return this._request('GET', `/api/1/balance`, params, cb)
}

Luno.prototype.getFundingAddress = function (asset, options, callback) {
  let [params, cb] = defaults({
    asset,
  }, options, callback)

  return this._request('GET', '/api/1/funding_address', params, cb)
}

Luno.prototype.createFundingAddress = function (asset, callback) {
  return this._request('POST', '/api/1/funding_address', { asset }, callback)
}

Luno.prototype.getWithdrawals = function (callback) {
  return this._request('GET', '/api/1/withdrawals/', null, callback)
}

Luno.prototype.getWithdrawal = function (id, callback) {
  return this._request('GET', `/api/1/withdrawals/${id}`, null, callback)
}

Luno.prototype.requestWithdrawal = function (type, amount, callback) {
  const params = {
    type,
    amount,
  }

  return this._request('POST', '/api/1/withdrawals/', params, callback)
}

Luno.prototype.cancelWithdrawal = function (id, callback) {
  return this._request('DELETE', `/api/1/withdrawals/${id}`, null, callback)
}

module.exports = Luno
