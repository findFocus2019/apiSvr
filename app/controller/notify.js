const express = require('express')
const router = express.Router()
const Controller = require('./../../lib/controller')
const CommonController = require('./../common/common_controller')
const uuid = require('uuid/v4')
const Utils = require('./../utils/index')
const Logger = require('./../../lib/log')('NOTIFY')

class PaymentLogic extends CommonController {

  /**
   * 确认支付
   */
  async orderPayConfirm(ctx) {

    ctx.uuid = ctx.uuid || uuid()
    ctx.ret = {
      code: 0,
      message: 'success'
    }

    Logger.info(ctx.uuid, 'orderPayConfirm() body', ctx.body)
    // let userId = ctx.body.user_id
    let paymentUuid = ctx.body.payment_uuid

    // ecard支付，余额支付必须使用密码
    // let password = ctx.body.password || ''

    let mallModel = new this.models.mall_model
    let orderModel = mallModel.orderModel()
    let paymentModel = mallModel.paymentModel()
    // let orderItemsModel = mallModel.orderItemModel()
    let userModel = new this.models.user_model

    let t = await mallModel.getTrans()

    try {

      let payment = await paymentModel.findOne({
        where: {
          uuid: paymentUuid
        }
      })
      Logger.info(ctx.uuid, 'orderPayConfirm() payment', payment)
      let userId = payment.user_id
      ctx.body.user_id = userId

      let userInfo = await userModel.getInfoByUserId(userId)


      Logger.info(ctx.uuid, 'orderPayConfirm() userInfo', userInfo)

      let payType = payment.pay_type
      let payMethod = payment.pay_method

      // if(payType != 3){
      //   throw new Error('支付方式错误')
      // }

      if (['wxpay', 'alipay'].indexOf(payMethod) < 0) {
        throw new Error('支付方式错误')
      }

      // 验证密码
      // if ([1, 2].indexOf(payType) > -1 && ['wxpay', 'alipay'].indexOf(payMethod) < 0) {
      //   // 使用e卡或者余额支付，不用在线支付补，要验证密码
      //   // let user = await userModel.getInfoByUserId(userId)
      //   let userTradePassword = userInfo.password_trade
      //   Logger.info(ctx.uuid, 'orderPayConfirm() userTradePassword', userTradePassword)
      //   if (!password) {
      //     throw new Error('请输入支付密码')
      //   }
      //   password = this.utils.crypto_utils.hmacMd5(password)
      //   if (!userTradePassword) {
      //     // throw new Error('请先设置支付密码')
      //     userInfo.password_trade = password
      //   }

      //   Logger.info(ctx.uuid, 'orderPayConfirm() password', password)
      //   Logger.info(ctx.uuid, 'orderPayConfirm() userInfo.password_trade', userInfo.password_trade)
      //   if (password != userInfo.password_trade) {
      //     throw new Error('请输入正确的支付密码')
      //   }

      //   // 测试 默认验证通过 , 状态改为已支付
      //   payment.status = 1
      // }



      // if (payment.balance) {

      // }

      if (payment.ecard) {
        let ecardId = payment.ecard_id
        let userEcard = await userModel.ecardModel().findByPk(ecardId)
        let amount = userEcard.amount - payment.ecard
        userEcard.amount = amount
        userEcard.status = amount ? 1 : 0
        let userEcardRet = await userEcard.save({
          transaction: t
        })
        Logger.info(ctx.uuid, 'orderPayConfirm() userEcardRet', userEcardRet)
        if (!userEcardRet) {
          throw new Error('更新用户e卡失败')
        }
      }

      let orderIds = payment.order_ids.substr(1, payment.order_ids.length - 2).split('-')
      Logger.info(ctx.uuid, 'orderPayConfirm() orderIds', orderIds)

      

      for (let index = 0; index < orderIds.length; index++) {
        const orderId = orderIds[index]
        let userSetVip = 0

        let order = await orderModel.findByPk(orderId)
        if (order.status != 0) {
          throw new Error('请不要重复支付')
        }
        Logger.info(ctx.uuid, 'orderPayConfirm() order', order.id)
        // let items = order.goods_items
        if (order.order_type != 0) {
          // 这里不计算返利，记录返利，7天后结算 TODO
          let rabateRet = await this._creareOrderItems(ctx, order, t)
          // let rabateRet = await this._rabate(ctx, items, t)
          Logger.info(ctx.uuid, 'orderPayConfirm() rabateRet', rabateRet)
          if (rabateRet.code != 0) {
            throw new Error(rabateRet.message)
          }
        } else {
          // vip充值订单，发放代金券，更新用户vip时间
          let userVipRet = await this._userVipDeal(ctx, order, t)
          if (userVipRet.code != 0) {
            throw new Error(userVipRet.message)
          } else {
            userSetVip = 1
          }
        }

        // 更新用户信息
        userInfo.balance = userInfo.balance - payment.balance
        userInfo.score = userInfo.score - payment.score

        // vip信息
        if (userSetVip == 1) {
          userInfo.vip = 1
          let now = parseInt(Date.now() / 1000)
          if (!userInfo.startline) {
            userInfo.startline = now
          }
          userInfo.deadline = this.utils.date_utils.monthPlus(parseInt(Date.now() / 1000), 1)
        }
        let userInfoRet = await userInfo.save({
          transaction: t
        })
        Logger.info(ctx.uuid, 'orderPayConfirm() userInfoRet', userInfoRet)
        if (!userInfoRet) {
          throw new Error('更新用户信息失败')
        }

        order.payment = {
          type: payType,
          method: payMethod
        }
        order.status = 1

        Logger.info(ctx.uuid, 'orderPayConfirm() order.payment', order.payment)
        let orderSaveRet = await order.save({
          transaction: t
        })

        Logger.info(ctx.uuid, 'orderPayConfirm() orderSaveRet', orderSaveRet)

        if (!orderSaveRet) {
          throw new Error('订单支付信息更新失败')
        }

        payment.status = 1
        payment.notify_info = ctx.notify_info
        let paymentRet = await payment.save({
          transaction: t
        })
        Logger.info(ctx.uuid, 'orderPayConfirm() paymentRet', paymentRet)
        if (!paymentRet) {
          throw new Error('支付信息更新失败')
        }

        // 更新商品sales
        let goodsUpdateRet = await this._paymentGoodsUpdate(ctx, order , t)
        if(goodsUpdateRet.code !== 0){
          throw new Error(goodsUpdateRet.message)
        }
      }

      // 记录交易信息type 3:商品购买
      let transactionData = {
        balance: payment.balance,
        amount: payment.amount,
        score: payment.score * 1000,
        status: 1,
        method: payMethod
      }
      let transactionRet = await userModel.transactionAdd(userId, 3, transactionData, t)
      if (!transactionRet) {
        throw new Error('记录交易数据失败')
      }

      t.commit()
    } catch (err) {
      console.log(err)
      t.rollback()
      return this._fail(ctx, err.message)
    }

    Logger.info(ctx.uuid, 'orderPayConfirm() ret', ctx.ret)
    return ctx.ret
  }
}

const paymentLogic = new PaymentLogic()

router.post('/wxpay', async (req, res) => {
  let obj = req.body

  if (typeof obj == 'string') {
    obj = await Utils.wxpay_utils._xmlToObj(obj)
  }

  obj = JSON.parse(`{"appid":"wx41b753c9ce99ea27","bank_type":"CFT","cash_fee":"1","device_info":"WEB","fee_type":"CNY","is_subscribe":"N","mch_id":"1522398771","nonce_str":"461c9d1fe90d478f9c861e914d7c15f2","openid":"ogH1I6MhvZMTSstmgl4s35Y_5pXY","out_trade_no":"ef9f9b6ff2d94b97876d87664d1ffbc6","result_code":"SUCCESS","return_code":"SUCCESS","sign":"D6F85B914BBCB00DC0F74CCBC3888557","time_end":"20190225173357","total_fee":"1","trade_type":"APP","transaction_id":"4200000246201902259259092793"}`)

  Logger.info('/wxpay obj', obj)
  let resultCode = obj.return_code
  let outTradeNo = obj.out_trade_no
  if (resultCode == 'SUCCESS') {
    let ret = await paymentLogic.orderPayConfirm({
      uuid: obj.outTradeNo,
      body: {
        payment_uuid: outTradeNo
      },
      notify_info: req.body
    })
    Logger.info(outTradeNo, '/wxpay ret', ret)

    if (ret.code == 0) {
      // res.send('succuess')
      res.send(`<xml>
<return_code><![CDATA[SUCCESS]]></return_code>
  <return_msg><![CDATA[OK]]></return_msg>
</xml>`)
    } else {
      return res.send(`<return_code><![CDATA[FAIL]]></return_code>
  <return_msg><![CDATA[fail]]></return_msg>
</xml>`)
    }
  } else {
    Logger.info('/wxpay resultCode', resultCode)
  }
})

router.post('/alipay', async (req, res) => {
  let obj = req.body
  Logger.info('/alipay obj', obj)
  let outTradeNo = obj.out_trade_no
  let tradeStatus = obj.trade_status

  // let verify = Utils.alipay_utils._verify(obj)
  // Logger.info('verfiy:', verify)
  // if(!verify){
  //   return res.send('fail:sign fail')
  // }

  if (tradeStatus == 'TRADE_SUCCESS') {

    let ret = await paymentLogic.orderPayConfirm({
      uuid: obj.outTradeNo,
      body: {
        payment_uuid: outTradeNo
      },
      notify_info: req.body
    })
    Logger.info(outTradeNo, '/alipay ret', ret)

    if (ret.code == 0) {
      res.send('succuess')
    } else {
      return res.send('fail')
    }
  } else {
    Logger.info('/alipay tradeStatus', tradeStatus)
    return res.send('success')
  }
})

module.exports = router