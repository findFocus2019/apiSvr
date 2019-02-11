'use strict';
const path = require('path');
const AliPay = require('alipay-node-sdk');

/* 参数配置 */
const pay = {
  rsaPrivate: path.resolve('./../../pem/sandbox_private_key.pem'),
  rsaPublic: path.resolve('./../../pem/sandbox_public_key.pem'),
  gateway: `https://openapi.alipaydev.com/gateway.do`,
  appId: 2016092300581254,
  notifyUrl: '',
  sandbox: true,
  signType:'RSA2'
}


class AliPayUtils {
  constructor() { 
    this.aliPay = this._aliPay()
  }
  /**
   * 生成应用实例
   */
  _aliPay() {
    /**
     *
     * @param {Object} opts 
     * @param {String} opts.appId  支付宝的appId
     * @param {String} opts.notifyUrl  支付宝服务器主动通知商户服务器里指定的页面http/https路径
     * @param {String} opts.rsaPrivate  商户私钥pem文件路径
     * @param {String} opts.rsaPublic  支付宝公钥pem文件路径
     * @param {String} opts.signType   签名方式, 'RSA' or 'RSA2'
     * @param {Boolean} [opts.sandbox] 是否是沙盒环境
     * @constructor
     */
    return new AliPay(pay)
  }

  /**
 * 生成支付参数供客户端使用
 * @param {Object} opts 
 * @param {String} opts.subject              商品的标题/交易标题/订单标题/订单关键字等
 * @param {String} [opts.body]               对一笔交易的具体描述信息。如果是多种商品，请将商品描述字符串累加传给body
 * @param {String} opts.outTradeId           商户网站唯一订单号
 * @param {String} [opts.timeout]            设置未付款支付宝交易的超时时间，一旦超时，该笔交易就会自动被关闭。
                                              当用户进入支付宝收银台页面（不包括登录页面），会触发即刻创建支付宝交易，此时开始计时。
                                              取值范围：1m～15d。m-分钟，h-小时，d-天，1c-当天（1c-当天的情况下，无论交易何时创建，都在0点关闭）。
                                              该参数数值不接受小数点， 如 1.5h，可转换为 90m。
 * @param {String} opts.amount               订单总金额，单位为元，精确到小数点后两位，取值范围[0.01,100000000]
 * @param {String} [opts.sellerId]           收款支付宝用户ID。 如果该值为空，则默认为商户签约账号对应的支付宝用户ID
 * @param {String} opts.goodsType            商品主类型：0—虚拟类商品，1—实物类商品 注：虚拟类商品不支持使用花呗渠道
 * @param {String} [opts.passbackParams]     公用回传参数，如果请求时传递了该参数，则返回给商户时会回传该参数。支付宝会在异步通知时将该参数原样返回。本参数必须进行UrlEncode之后才可以发送给支付宝
 * @param {String} [opts.promoParams]        优惠参数(仅与支付宝协商后可用)
 * @param {String} [opts.extendParams]       业务扩展参数 https://doc.open.alipay.com/docs/doc.htm?spm=a219a.7629140.0.0.3oJPAi&treeId=193&articleId=105465&docType=1#kzcs
 * @param {String} [opts.enablePayChannels]  可用渠道，用户只能在指定渠道范围内支付。当有多个渠道时用“,”分隔。注：与disable_pay_channels互斥
 * @param {String} [opts.disablePayChannels] 禁用渠道，用户不可用指定渠道支付。当有多个渠道时用“,”分隔。 注：与enable_pay_channels互斥
 * @param {String} [opts.storeId]            商户门店编号
 */
  appPay(opts) {
    return this.aliPay.appPay(opts)
  }

  /**
   * 生成支付参数供web端使用
   * @param {Object} opts 
   * @param {String} opts.subject              商品的标题/交易标题/订单标题/订单关键字等
   * @param {String} [opts.body]               对一笔交易的具体描述信息。如果是多种商品，请将商品描述字符串累加传给body
   * @param {String} opts.outTradeId           商户网站唯一订单号
   * @param {String} [opts.timeout]            设置未付款支付宝交易的超时时间，一旦超时，该笔交易就会自动被关闭。
                                                当用户进入支付宝收银台页面（不包括登录页面），会触发即刻创建支付宝交易，此时开始计时。
                                                取值范围：1m～15d。m-分钟，h-小时，d-天，1c-当天（1c-当天的情况下，无论交易何时创建，都在0点关闭）。
                                                该参数数值不接受小数点， 如 1.5h，可转换为 90m。
  * @param {String} opts.amount               订单总金额，单位为元，精确到小数点后两位，取值范围[0.01,100000000]
  * @param {String} [opts.sellerId]           收款支付宝用户ID。 如果该值为空，则默认为商户签约账号对应的支付宝用户ID
  * @param {String} opts.goodsType            商品主类型：0—虚拟类商品，1—实物类商品 注：虚拟类商品不支持使用花呗渠道
  * @param {String} [opts.passbackParams]     公用回传参数，如果请求时传递了该参数，则返回给商户时会回传该参数。支付宝会在异步通知时将该参数原样返回。本参数必须进行UrlEncode之后才可以发送给支付宝
  * @param {String} [opts.promoParams]        优惠参数(仅与支付宝协商后可用)
  * @param {String} [opts.extendParams]       业务扩展参数 https://doc.open.alipay.com/docs/doc.htm?spm=a219a.7629140.0.0.3oJPAi&treeId=193&articleId=105465&docType=1#kzcs
  * @param {String} [opts.enablePayChannels]  可用渠道，用户只能在指定渠道范围内支付。当有多个渠道时用“,”分隔。注：与disable_pay_channels互斥
  * @param {String} [opts.disablePayChannels] 禁用渠道，用户不可用指定渠道支付。当有多个渠道时用“,”分隔。 注：与enable_pay_channels互斥
  * @param {String} [opts.storeId]            商户门店编号
  * @param {String} [opts.return_url]         客户端回调地址，HTTP/HTTPS开头字符串
  */
  wapPay(opts) {
    return this.aliPay.wapPay(opts);
  }
}

// let ali = new AliPayUtils()
// var params = ali.wapPay({
//   subject: '测试商品',
//   body: '测试商品描述',
//   outTradeId: Date.now().toString(),
//   timeout: '10m',
//   amount: '10.00',
//   goodsType: '0'
// });

// console.log(params);

module.exports = new AliPayUtils();