const Controller = require('./../../../lib/controller')
const aliPay = require('./../../utils/ali_pay_utils')

class PayController extends Controller { 
  async _init_(ctx) { }

  //app支付
  async appPay(ctx) {
    let opts = {
        subject: '测试商品',
        body: '测试商品描述',
        outTradeId: Date.now().toString(),
        timeout: '10m',
        amount: '10.00',
        goodsType: '0'
    }
    ctx.ret.data = aliPay.appPay(opts)
    return ctx.ret
  }

  //wap支付
  async wapPay(ctx) {
    let opts = {
      subject: '测试商品',
      body: '测试商品描述',
      outTradeId: Date.now().toString(),
      timeout: '10m',
      amount: '10.00',
      goodsType: '0'
    }
    ctx.ret.data = aliPay.wapPay(opts)
    return ctx.ret
  }
}

module.exports = PayController