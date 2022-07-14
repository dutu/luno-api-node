# luno-api-node

A simple wrapper for the Luno API. The module supports promise and callbacks.

> This module is forked from https://github.com/bausmeier/node-luno. 
> Since the original repository seems not to be maintained anymore, starting with version v1.10.1 this fork has been detached from original repository, and it is now stand alone. Contributions are not pull-requested to original repository.

## Usage
Add luno as a dependency:

```bash
$ npm install --save luno-api-node
```


### Luno([keyId, keySecret][options])
To access the private Luno API methods you must supply your key id and key secret as the first two arguments. If you are only accessing the public API endpoints you can leave these two arguments out.

The optional `options` argument can be used to override the default options. The default options are equivalent to:

```js
{
  hostname: 'api.luno.com',
  port: 443,
  ca: undefined,
  pair: 'XBTZAR'
}
```

## Properties

### apiCallRate

Gives the current rate per minute of API calls. The property is read only.
It can be used by applications to limit the API call rate to prevent HTTP error code `429` (too many requests) responses from Luno server.
See Luno API documentation for applicable rate limitations: https://www.luno.com/en/developers/api#tag/Rate-Limiting

> API calls which result in error code `429` or `ErrTooManyRequests` are considered failed/unprocessed server request and are not added to the `apiCallRate` counter

Example:

```javascript
console.log(luno.apiCallRate)
```


## Methods
For details about the API endpoints see https://www.luno.com/en/developers/api.

### Callbacks
The arguments passed to the callback function for each method are:

1. An error or `null` if no error occurred.
1. An object containing the data returned by the Luno API.

The `callback` function is optional. If the `callback` is not provided, the methods return a promise. 

### getTicker([options][, callback])
GET https://api.luno.com/api/1/ticker/XBTZAR

Default options:

```javascript
{
  pair: luno.pair
}
```

Example:

```javascript
luno.getTicker(function(err, ticker) {});
```

### getAllTickers([callback])
GET https://api.luno.com/api/1/tickers

Example:

```javascript
luno.getAllTickers(function(err, tickers) {});
```

### getOrderBook([options][, callback])
GET https://api.luno.com/api/1/orderbook

Default options:

```javascript
{
  pair: luno.pair
}
```

Example:

```javascript
luno.getOrderBook(function(err, orderBook) {});
```

### getTrades([options][, callback])
GET https://api.luno.com/api/1/trades

Default options:

```javascript
{
  pair: luno.pair
}
```

Example:

```javascript
luno.getTrades(function(err, trades) {});
```

### getTradeList([options][, callback])
GET https://api.luno.com/api/1/listtrades

Default options:

```javascript
{
  pair: luno.pair
}
```

Example:

```javascript
luno.getTradeList({sort_desc: true, limit: 10}, function(err, tradeList) {});
```

### getOrderList([options][, callback])
GET https://api.luno.com/api/1/listorders

Default options:

```javascript
{
  pair: luno.pair,
  state: undefined
}
```

Example:

```javascript
luno.getOrderList({state: 'PENDING'}, function(err, orderList) {});
```

### getOrderListV2([options][, callback])
GET https://api.luno.com/api/exchange/2/listorders

Default options:

```javascript
{
  pair: luno.pair,
  state: undefined
}
```

Example:

```javascript
luno.getOrderListV2({ closed: true }, function(err, orderList) {});
```

### getOrderListV3(options[, callback])
GET https://api.luno.com/api/exchange/3/order

Example:

```javascript
luno.getOrderListV3({id: 'BXMC2CJ7HNB88U4' }, function(err, orderList) {});
```

### getBalance([asset][, callback])
GET https://api.luno.com/api/1/balance

Example:

```javascript
luno.getBalance('ZAR', function(err, balance) {});
```

### getFundingAddress(asset[, options][, callback])
GET https://api.luno.com/api/1/funding_address

Default options:

```javascript
{
  address: undefined
}
```

Example:

```javascript
luno.getFundingAddress('XBT', {address: 'B1tC0InExAMPL3fundIN6AdDreS5t0Use'}, function(err, fundingAddress) {});
```

### createFundingAddress(asset[, callback])
POST https://api.luno.com/api/1/funding_address

Example:

```javascript
luno.createFundingAddress('XBT', function(err, fundingAddress) {});
```

### getFeeInfo([options][, callback])
GET https://api.luno.com/api/1/fee_info

Default options:

```javascript
{
  pair: luno.pair
}
```

Example:

```javascript
luno.getFeeInfo({pair: 'XBTZAR'}, function(err, feeInfo) {});
```

### postBuyOrder(volume, price[, options][, callback])
POST https://api.luno.com/api/1/postorder

Example:

```javascript
luno.postBuyOrder(9999.99, 0.01, function(err, order) {});
```

### postSellOrder(volume, price[, options][, callback])
POST https://api.luno.com/api/1/postorder

Example:

```javascript
luno.postSellOrder(0.01, 9999.99, function(err, order) {});
```

### postMarketBuyOrder(volume[, options][, callback])
POST https://api.luno.com/api/1/marketorder

Example:

```javascript
luno.postMarketBuyOrder(0.01, function(err, order) {});
```

### postMarketSellOrder(volume[, options][, callback])
POST https://api.luno.com/api/1/marketorder

Example:

```javascript
luno.postMarketSellOrder(0.01, function(err, order) {});
```

### stopOrder(orderId[, callback])
POST https://api.luno.com/api/1/stoporder

Example:

```javascript
luno.stopOrder('BXMC2CJ7HNB88U4', function(err, result) {});
```

### getOrder(orderId[, callback])
GET https://api.luno.com/api/1/orders/{orderId}

Example:

```javascript
luno.getOrder('BXHW6PFRRXKFSB4', function(err, result) {});
```

### getOrderV2(orderId[, callback])
GET https://api.luno.com/api/exchange/2/orders/{orderId}

Example:

```javascript
luno.getOrder('BXHW6PFRRXKFSB4', function(err, result) {});
```

### getTransactions(asset[, options][, callback])
GET https://api.luno.com/api/1/transactions

Default options:
```javascript
{
  offset: 0,
  limit: 10
}
```

Example:

```javascript
luno.getTransactions('XBT', {offset: 5, limit: 20}, function(err, transactions) {});
```

### getWithdrawals([callback])
GET https://api.luno.com/api/1/withdrawals

Example:

```javascript
luno.getWithdrawals(function(err, withdrawals) {});
```

### getWithdrawal(withdrawalId[, callback])
GET https://api.luno.com/api/1/withdrawals/{withdrawalId}

Example:

```javascript
luno.getWithdrawal('1212', function(err, withdrawal) {});
```

### requestWithdrawal(type, amount[, callback])
POST https://api.luno.com/api/1/withdrawals

Example:

```javascript
luno.requestWithdrawal('ZAR_EFT', 1000, function(err, withdrawal) {});
```

### cancelWithdrawal(withdrawalId[, callback])
DELETE https://api.luno.com/api/1/withdrawals/{withdrawalId}

Example:

```javascript
luno.cancelWithdrawal('1212', function(err, withdrawal) {});
```

## Contributing

Open a pull request or create an issue and help me improve it.
