const HttpUtil = require('./http_util')
const uuidv4 = require('uuid/v4')
const crypto = require('crypto')
const xml2js = require('xml2js')
const config = require('./../../config').wxpay
const {domain} = require('./../../config')

const API_URL = 'https://api.mch.weixin.qq.com'

// const SERVICE_BUSIBESS_INFO = {
//   app_id : config.app_id,
//   mch_id : config.mch_id,
//   key : config.key
// }

// h5支付 scene_info
/**
 1，IOS移动应用
{"h5_info": //h5支付固定传"h5_info" 
    {"type": "",  //场景类型
     "app_name": "",  //应用名
     "bundle_id": ""  //bundle_id
     }
}

 2，安卓移动应用
{"h5_info": //h5支付固定传"h5_info" 
    {"type": "",  //场景类型
     "app_name": "",  //应用名
     "package_name": ""  //包名
     }
}

3，WAP网站应用
{"h5_info": //h5支付固定传"h5_info" 
   {"type": "Wap",  //场景类型
    "wap_url": "",//WAP网站URL地址
    "wap_name": ""  //WAP 网站名
    }
}

 */

/**
 * 
 trade_type :
  JSAPI ： 公众号
  NATIVE : 原生(扫码)
  MWEB : h5
  APP: app
 */

class WxPay {

  constructor(){

    this.app_id = config.app_id
    this.mch_id = config.mch_id
    this.key = config.key
      
    this.notify_url = domain + config.notify_url
    // this.h5_url = config.h5_url

    // this.trade_type = opt.trade_type || 'JSAPI' // JSAPI，NATIVE，APP
  }

  async unifiedOrder(body , out_trade_no , total_fee , ip ,  payment_type = 'APP' , openid = '', attach = ''){
    
    let unifiedOrderObj = {
      appid : this.app_id,
      mch_id : this.mch_id,
      device_info : 'WEB',
      nonce_str : this._getNonceStr(),
      sign_type : 'MD5',
      body : body,
      // detail : obj.detail,
      attach : attach || '',
      out_trade_no : out_trade_no,
      fee_type : 'CNY',
      total_fee : parseInt(total_fee),
      spbill_create_ip : ip,
      notify_url : this.notify_url,
      trade_type  : payment_type || 'APP', // trade_type为JSAPI时必须传openid
      // openid : openid
    }

    if(openid){
      unifiedOrderObj.openid = openid
    }

    let signStr = this._sign(unifiedOrderObj)
    unifiedOrderObj.sign = signStr

    // return unifiedOrderObj

    let unifiedOrderUrl = API_URL + '/pay/unifiedorder'
    let response = await HttpUtil.post(unifiedOrderUrl , unifiedOrderObj , 'xml')

    let result = await this._xmlToObj(response)

    let ret = {code: 0 , message: ''}
    if(result.return_code == 'SUCCESS' && result.return_code == 'SUCCESS'){
      ret.code = 1
      ret.message = result.return_msg
    }else {
      ret.data = result
    }

    return ret
  }

  appPayInfo(prepayId){

    let appPayObj = {
      appid: this.app_id,
      partnerid: this.mch_id,
      prepayid: prepayId,
      package: 'Sign=WXPay',
      noncestr: this._getNonceStr(),
      timestamp: parseInt(Date.now() / 1000)
    }

    let signStr = this._sign(appPayObj)
    appPayObj.sign = signStr

    return appPayObj
  }

  _sign(signObj){

    let sortStr = this._keySortStr(signObj , this.key)
    // console.log('========================' , sortStr)
    let hash = crypto.createHash('md5')
    hash.update(sortStr)
    let signStr = hash.digest('hex')

    return signStr.toUpperCase()
  }

  // 随机生成nonce_str
  _getNonceStr(){
    return uuidv4().replace(/-/g,'')
  }

  // 对象按照key排序转化成字符串
  _keySortStr(obj, key = '') {
    let sdic = Object.keys(obj).sort()
    let strArr = []
    for (let k in sdic) {
      if (obj[sdic[k]]) {
        strArr.push(sdic[k] + '=' + obj[sdic[k]])
      }
    }
    if (key) {
      strArr.push('key=' + key)
    }
    return strArr.join('&')
  }

  _xmlToObj(xml){
    var parseString = xml2js.parseString
    return new Promise((resolve , reject) => {
      parseString(xml, { explicitArray: false } , (err, result) => {
        if(err) {
          reject(err)
        }
        resolve(result.xml)
      })
    })
   
  }

}

module.exports = new WxPay()