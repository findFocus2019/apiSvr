const moment = require('moment')
const crypto = require('crypto')
const request = require('request')
const superagent = require('superagent')
const getWayUrl = 'https://openapi.alipay.com/gateway.do' // 正式环境
const getWayUrlTest = 'https://openapi.alipaydev.com/gateway.do' //
// const getWayUrl = 'https://openapi.alipaydev.com/gateway.do' // 测试环境
const config = require('./../../config').alipay
// const serviceUserOpt = config.service_user

const PRODUCT_CODE = {
  WAP: 'QUICK_WAP_WAY',
  PC: 'FAST_INSTANT_TRADE_PAY'
}

const METHOD = {
  WAP: 'alipay.trade.wap.pay',
  PC: 'alipay.trade.page.pay',
  CODE: 'alipay.trade.precreate',
  TO_ACCOUNT_TRANSFET: 'alipay.fund.trans.toaccount.transfer',
  APP_PAY: 'alipay.trade.app.pay'
}

class AlipayUtils {

  constructor() {
    this.appId = config.appId
    this.getWayUrl = config.dev ? getWayUrlTest : getWayUrl
    this.rsaPrivateKey = '-----BEGIN RSA PRIVATE KEY-----\n' + config.rsaPrivateKey + '\n-----END RSA PRIVATE KEY-----'
    this.alipayPubKey = '-----BEGIN PUBLIC KEY-----\n' + config.alipayPubKey + '\n-----END PUBLIC KEY-----'

    console.log('================', config.dev, this.getWayUrl, )
  }

  // 切换特约商户
  // changeSpecial() {
  //   this.appId = serviceUserOpt.app_id
  //   this.getWayUrl = serviceUserOpt.is_test ? getWayUrlTest : getWayUrl
  //   this.rsaPrivateKey = '-----BEGIN RSA PRIVATE KEY-----\n' + serviceUserOpt.rsa_private_key + '\n-----END RSA PRIVATE KEY-----'
  //   this.alipayPubKey = '-----BEGIN PUBLIC KEY-----\n' + serviceUserOpt.alipay_public_key + '\n-----END PUBLIC KEY-----'

  //   this.sys_service_provider_id = serviceUserOpt.sys_service_provider_id //返佣

  // }

  /**
   * 转账给支付宝账户
   * @param {*} out_biz_no 
   * @param {*} payee_account 
   * @param {*} amount 
   * @param {*} payee_type 
   */
  async toAccountTransfer(out_biz_no, payee_account, amount, payee_type = 'ALIPAY_LOGONID') {

    let method = METHOD.TO_ACCOUNT_TRANSFET
    let requestObj = this._getRequestObj(method)

    let bizContent = {}
    bizContent.out_biz_no = out_biz_no
    bizContent.payee_type = payee_type
    bizContent.payee_account = payee_account
    bizContent.amount = amount

    requestObj.biz_content = JSON.stringify(bizContent)
    let sign = this._sign(requestObj, this.rsaPrivateKey)
    requestObj.sign = sign

    let action = this._buildRquestUrl(requestObj)

    let resultRequest = await this._requestGet(action)
    let response = resultRequest.alipay_fund_trans_toaccount_transfer_response

    return this._getResult(response)

  }

  /**
   * app支付
   */
  async appPay(out_trade_no, total_amount, body, subject) {
    let method = METHOD.APP_PAY
    let requestObj = this._getRequestObj(method)

    let bizContent = {}
    bizContent.out_trade_no = out_trade_no
    bizContent.total_amount = total_amount
    bizContent.body = body
    bizContent.subject = subject

    requestObj.biz_content = JSON.stringify(bizContent)
    let sign = this._sign(requestObj, this.rsaPrivateKey)
    requestObj.sign = sign

    // let action = this._buildRquestUrl(requestObj)
    let action = this._buildRquestParams(requestObj)
    console.log(action)
    return action
    // console.log('appPay action =================' , action)
    // let resultRequest = await this._requestGet(action)
    // let params= this._buildRquestParams(requestObj)
    // let resultRequest = await this._requestPost(this.getWayUrl, params)
    // console.log('appPay resultRequest =================' , resultRequest)
    // let response = resultRequest.alipay_trade_app_pay_response
    return this._getResult(response)
  }

  _getResult(response) {
    let ret = {}
    if (response.code == '10000') {
      ret.code = 0
      ret.message = response.msg
      ret.data = response
      return ret
    } else {
      ret.code = response.code
      ret.message = response.msg + ',' + response.submsg
      ret.data = response
      return ret
    }
  }

  _getRequestObj(method, return_url = '', notify_url = '') {
    let requestObj = {}
    requestObj.app_id = this.appId
    requestObj.method = method
    requestObj.format = 'json'
    // 
    requestObj.charset = 'utf-8'
    requestObj.sign_type = 'RSA2'
    requestObj.timestamp = this._dateFormat(null, 'YYYY-MM-DD HH:mm:ss')
    // 
    requestObj.version = '1.0'

    if (return_url) requestObj.return_url = return_url
    if (notify_url) requestObj.notify_url = notify_url
    return requestObj
  }

  async pagePay(subject, body, order_no, total_amount, payment_type, notify_url, return_url = '') {
    let method = METHOD[payment_type.toUpperCase()]
    let product_code = PRODUCT_CODE[payment_type.toUpperCase()]

    let requestObj = {}
    requestObj.app_id = this.appId
    requestObj.method = method
    requestObj.format = 'json'
    requestObj.return_url = return_url
    requestObj.charset = 'utf-8'
    requestObj.sign_type = 'RSA2'
    requestObj.timestamp = this._dateFormat(null, 'YYYY-MM-DD HH:mm:ss')
    requestObj.notify_url = notify_url
    requestObj.version = '1.0'

    let bizContent = {}
    bizContent.subject = subject
    bizContent.body = body
    bizContent.out_trade_no = order_no
    bizContent.total_amount = total_amount
    bizContent.product_code = product_code
    // bizContent.notify_url = notify_url

    requestObj.biz_content = JSON.stringify(bizContent)
    let sign = this._sign(requestObj, this.rsaPrivateKey)
    requestObj.sign = sign

    // console.log(sign)
    let action = this._buildRquestUrl(requestObj)
    // console.log(action)
    // let resultRequest = await this._requestGet(action)
    return action
    // return resultRequest
  }

  // 扫码支付
  async codePay(subject, body, order_no, total_amount, notify_url, app_auth_token = '') {
    let method = METHOD.CODE

    let requestObj = {}
    if (app_auth_token) {
      requestObj.app_auth_token = app_auth_token
      this.changeSpecial()
    }

    requestObj.app_id = this.appId
    requestObj.method = method
    requestObj.format = 'json'
    requestObj.charset = 'utf-8'
    requestObj.sign_type = 'RSA2'
    requestObj.timestamp = this._dateFormat(null, 'YYYY-MM-DD HH:mm:ss')
    requestObj.notify_url = notify_url
    requestObj.version = '1.0'

    let bizContent = {}
    bizContent.subject = subject
    bizContent.body = body
    bizContent.out_trade_no = order_no
    bizContent.total_amount = total_amount

    // 返佣
    if (app_auth_token && this.sys_service_provider_id) {
      bizContent.extend_params = {
        sys_service_provider_id: this.sys_service_provider_id
      }
    }

    requestObj.biz_content = JSON.stringify(bizContent)
    let sign = this._sign(requestObj, this.rsaPrivateKey)
    requestObj.sign = sign

    // console.log(sign)
    let action = this._buildRquestUrl(requestObj)
    // console.log('===================',action)
    let resultRequest = await this._requestGet(action)

    return resultRequest
  }

  _dateFormat(timestamp, format) {
    format = format || 'YYYY-MM-DD HH:mm'
    let date = null
    if (!timestamp) {
      date = new Date()
    } else {
      date = new Date(timestamp * 1000)
    }
    //logger.debug(date);
    return moment(date).format(format)
  }

  // 签名
  _sign(signObj, key) {

    let sortStr = this._keySortStr(signObj)
    // console.log('sort str ==================' , sortStr)
    let sign = crypto.createSign('RSA-SHA256')
    sign.update(sortStr)

    return sign.sign(key, 'base64')

  }

  _verify(signObj, signature = '') {
    let sign = signature || signObj.sign
    // console.log('sign======================' , sign)
    delete signObj.sign
    delete signObj.sign_type
    let signStr = this._keySortStr(signObj)
    // console.log('sginStr===========' , signStr)
    let verify = crypto.createVerify('RSA-SHA256')
    verify.update(signStr)
    return verify.verify(this.alipayPubKey, sign, 'base64')

  }

  // 对象按照key排序转化成字符串
  _keySortStr(obj) {
    let sdic = Object.keys(obj).sort()
    let strArr = []
    for (let k in sdic) {
      if (obj[sdic[k]]) {
        strArr.push(sdic[k] + '=' + obj[sdic[k]])
      }
    }
    return strArr.join('&')
  }

  _buildRquestUrl(params) {
    let paramsArr = []
    for (let key in params) {
      let paramsValue = encodeURIComponent(params[key])
      paramsArr.push(key + '=' + paramsValue)
    }
    let paramsStr = paramsArr.join('&')
    let url = this.getWayUrl + '?' + paramsStr
    return url
  }

  _buildRquestParams(params){
    let paramsArr = []
    for (let key in params) {
      let paramsValue = encodeURIComponent(params[key])
      paramsArr.push(key + '=' + paramsValue)
    }
    let paramsStr = paramsArr.join('&')
    return paramsStr
  }

  async _requestPost(action, data) {
    console.log(data)
    let ret = await superagent.post(action).send(data).type('json')
    // let contentType = 'application/json'
    // let body = data

    // return new Promise((resolve, reject) => {
    //   request({
    //     url: action,
    //     method: 'POST',
    //     json: true,
    //     headers: {
    //       'content-type': contentType,
    //     },
    //     body: body
    //   }, function (error, response, body) {
    //     // console.log(response)
    //     if (error) {
    //       reject(response)
    //     }
    //     if (!error && response.statusCode == 200) {
    //       if (typeof body == 'string') {
    //         body = JSON.parse(body)
    //       }

    //       resolve(body)
    //     }
    //   })
    // })
  }

  _requestGet(action) {
    return new Promise((resolve, reject) => {
      request(action, (error, response, body) => {
        // console.log(response.statusCode)
        if (error) {
          // console.error(error)
          reject(error)
        }

        if (!error && response.statusCode == 200) {

          if (typeof body == 'string') {
            body = JSON.parse(body)
          }

          resolve(body)
        }
      })
    })
  }
}

module.exports = new AlipayUtils