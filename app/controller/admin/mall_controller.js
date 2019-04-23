const fs = require('fs')
const util = require('util')
const path = require('path')
const {
  Parser
} = require('json2csv')
const Op = require('sequelize').Op
const jdUtils = require('../../utils/jd_utils')
const aliOssUtils = require('../../utils/ali_oss_utils')
const dateUtiles = require('../../utils/date_utils')
const Controller = require('./../../../lib/controller')
const AppMallController = require('../app/mall_controller')




class MallController extends Controller {

  async categoryList(ctx) {
    this.logger.info(ctx.uuid, 'categoryList()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)

    let where = {}
    where.type = this.config.categoryType.GOODS
    where.jd_num = 0
    where.status = {
      [Op.gte]: 0
    }
    let mallModel = new this.models.mall_model
    let rows = await mallModel.categoryModel().findAll({
      where: where,
      order: [
        ['sort', 'asc'],
        ['create_time', 'desc']
      ],
      attributes: {
        exclude: ['update_time']
      }
    })

    this.logger.info(ctx.uuid, 'categoryList()', 'rows', rows)
    ctx.ret.data = {
      rows: rows
    }
    return ctx.ret
  }

  async categoryInfo(ctx) {
    this.logger.info(ctx.uuid, 'info()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)
    let mallModel = new this.models.mall_model
    let id = ctx.body.id
    let info = await mallModel.categoryModel().findByPk(id)

    ctx.ret.data = {
      info: info
    }
    this.logger.info(ctx.uuid, 'info()', 'ret', ctx.ret)
    return ctx.ret
  }

  async categoryUpdate(ctx) {
    this.logger.info(ctx.uuid, 'categoryUpdate()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)
    let mallModel = new this.models.mall_model

    let data = ctx.body
    let mall
    if (data.id) {
      mall = await mallModel.categoryModel().findByPk(data.id)
      await mall.update(data)
    } else {
      data.type = this.config.categoryType.GOODS
      mall = await mallModel.categoryModel().create(data)
    }

    ctx.ret.data = {
      info: mall
    }
    this.logger.info(ctx.uuid, 'categoryUpdate()', 'ret', ctx.ret)
    return ctx.ret

  }

  async goodsList(ctx) {
    this.logger.info(ctx.uuid, 'goodsList()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10
    let offset = (page - 1) * limit
    let search = ctx.body.search
    let type = ctx.body.type || ''



    let where = {}
    if (search) {
      where.title = {
        [Op.like]: '%' + search + '%'
      }
    }
    if (type) {
      where.type = type
    }

    // 添加商户
    let mchId = ctx.session.mch_id || 0
    if (mchId) {
      where.mch_id = mchId
    }

    let mallModel = new this.models.mall_model
    let queryRet = await mallModel.goodsModel().findAndCountAll({
      where: where,
      offset: offset,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ],
      attributes: {
        exclude: ['update_time', 'content']
      }
    })

    ctx.ret.data = queryRet
    return ctx.ret
  }

  async goodsInfo(ctx) {
    this.logger.info(ctx.uuid, 'goodsInfo()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)
    let mallModel = new this.models.mall_model
    let id = ctx.body.id
    let info = await mallModel.goodsModel().findByPk(id)

    ctx.ret.data = {
      info: info
    }
    this.logger.info(ctx.uuid, 'goodsInfo()', 'ret', ctx.ret)
    return ctx.ret
  }

  async goodsUpdate(ctx) {
    this.logger.info(ctx.uuid, 'goodsUpdate()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)
    delete ctx.body.update_time
    let mallModel = new this.models.mall_model

    let data = ctx.body

    // 添加商户
    let mchId = ctx.session.mch_id || 0
    this.logger.info(ctx.uuid, 'goodsUpdate()', 'mchId', mchId)
    if (mchId) {
      data.mch_id = mchId
      if (!data.id) {
        data.status = 0
      }
    }

    this.logger.info(ctx.uuid, 'goodsUpdate()', 'data', data)

    let goods
    if (data.id) {
      goods = await mallModel.goodsModel().findByPk(data.id)
      await goods.update(data)
    } else {
      goods = await mallModel.goodsModel().create(data)
    }

    ctx.ret.data = {
      info: goods
    }
    this.logger.info(ctx.uuid, 'goodsUpdate()', 'ret', ctx.ret)
    return ctx.ret
  }

  async orderList(ctx) {
    this.logger.info(ctx.uuid, 'orderList()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10
    let offset = (page - 1) * limit
    let search = ctx.body.search
    let userId = ctx.body.user_id || 0
    let status = ctx.body.status || ''
    let type = ctx.body.type || ''
    let orderIds = ctx.body.order_ids || ''

    let where = {}
    if (search) {
      where.order_no = {
        [Op.like]: '%' + search + '%'
      }
    }
    if (userId) {
      where.user_id = userId
    }
    if (status !== '') {
      where.status = status
    }
    if (type !== '') {
      where.order_type = type
    }

    if (orderIds) {
      where.id = {
        [Op.in]: orderIds.substr(1, orderIds.length - 2).split('-')
      }
    }

    let mallModel = new this.models.mall_model
    let orderModel = mallModel.orderModel()
    let userInfoModel = (new this.models.user_model).infoModel()
    orderModel.belongsTo(userInfoModel, {
      targetKey: 'user_id',
      foreignKey: 'user_id'
    })

    let queryRet = await orderModel.findAndCountAll({
      where: where,
      offset: offset,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ],
      attributes: {
        exclude: ['update_time']
      },
      include: [{
        model: userInfoModel,
        attributes: ['id', 'nickname', 'mobile']
      }]
    })

    ctx.ret.data = queryRet
    this.logger.info(ctx.uuid, 'orderList()', 'ret', ctx.ret)
    return ctx.ret
  }

  /**
   * 获取订单详情
   * @param {Object} ctx 
   */
  async orderInfo(ctx) {
    this.logger.info(ctx.uuid, 'orderInfo()', 'body', ctx.body)

    let orderId = ctx.body.id
    let dbOptions = {
      where: {
        id: orderId
      }
    }

    let mallModel = new this.models.mall_model()
    let orderItemsModel = mallModel.orderItemModel()

    let orderInfo = await mallModel.orderModel().findOne(dbOptions)
    if (orderInfo === null) { // 没有找到
      ctx.ret.data = {}
    }

    let items = await orderItemsModel.findAll({
      where: {
        order_id: orderId
      }
    })

    orderInfo.dataValues.items = items

    if (orderInfo.order_type == 2) {
      let jdOrderId = orderInfo.jd_order_id
      let jdData = await jdUtils.orderTrack(jdOrderId)
      let jdDataObj = JSON.parse(jdData)

      orderInfo.dataValues.jdData = jdDataObj
    } else {
      orderInfo.dataValues.jdData = null
    }

    ctx.ret.data = orderInfo
    return ctx.ret
  }

  async paymentList(ctx) {
    this.logger.info(ctx.uuid, 'paymentList()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10
    let offset = (page - 1) * limit
    let search = ctx.body.search || ''
    let userId = ctx.body.user_id || 0
    // let status = ctx.body.status || ''

    let mallModel = new this.models.mall_model
    let paymentModel = mallModel.paymentModel()
    let orderModel = mallModel.orderModel()
    let userInfoModel = (new this.models.user_model).infoModel()

    let where = {}
    where.status = 1
    if (search) {
      // where.title = {
      //   [Op.like]: '%' + search + '%'
      // }
      let order = await orderModel.findOne({
        where: {
          order_no: search
        }
      })
      this.logger.info(ctx.uuid, 'paymentList()', 'order', order)
      if (!order) {
        ctx.ret.data = {
          rows: [],
          count: 0
        }
        return ctx.ret
      }
      let orderId = order.id
      where.order_ids = {
        [Op.like]: '%-' + orderId + '-%'
      }
    }
    if (userId) {
      where.user_id = userId
    }

    paymentModel.belongsTo(userInfoModel, {
      targetKey: 'user_id',
      foreignKey: 'user_id'
    })

    let queryRet = await paymentModel.findAndCountAll({
      where: where,
      offset: offset,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ],
      attributes: {
        exclude: ['update_time']
      },
      include: [{
        model: userInfoModel,
        attributes: ['id', 'nickname', 'mobile']
      }]
    })


    for (let index = 0; index < queryRet.rows.length; index++) {
      const item = queryRet.rows[index]
      let orderIds = item.order_ids.substr(1, item.order_ids.length - 2).split('-')
      let orders = await orderModel.findAll({
        where: {
          id: {
            [Op.in]: orderIds
          }
        }
      })

      item.dataValues.orders = orders
      if (item.pay_method == 'wxpay') {
        console.log(item.dataValues)
        let wxpayInfo = JSON.parse(item.info)
        if (wxpayInfo.partnerid == this.config.miniApp.mch_id) {
          item.dataValues.wxpay_type = 2
        } else if (wxpayInfo.partnerid == this.config.wxpay.mch_id) {
          item.dataValues.wxpay_type = 1
        }
      } else {
        item.dataValues.wxpay_type = 0
      }

      let priceCost = 0
      orders.forEach(order => {
        let goodsItems = order.goods_items
        goodsItems.forEach(goods => {
          priceCost += (goods.price_cost * goods.num)
        })
      })

      item.dataValues.price_cost = parseFloat(priceCost).toFixed(2)
      // 计算成本
      queryRet.rows[index] = item
    }

    ctx.ret.data = queryRet
    this.logger.info(ctx.uuid, 'paymentList()', 'ret', ctx.ret)
    return ctx.ret
  }

  async transOutDeal(ctx) {
    this.logger.info(ctx.uuid, 'transOutDeal()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)
    let transactionId = ctx.body.id

    let userModel = new this.models.user_model
    let t = await userModel.getTrans()

    try {
      let transaction = await userModel.transactionModel().findByPk(transactionId)
      this.logger.info(ctx.uuid, 'transOutDeal()', 'aliRtransactionet', transaction)
      if (!transaction || transaction.status == 1) {
        throw new Error('无效数据')
      }
      let userId = transaction.user_id
      let method = transaction.method
      let balance = -1 * transaction.balance

      let userInfo = await userModel.getInfoByUserId(userId)
      if (method == 'wxpay') {
        throw new Error('未启用微信支付')
      } else if (method == 'alipay') {
        // 支付宝
        let alipayAccount = userInfo.alipay
        this.logger.info(ctx.uuid, 'transOutDeal()', 'alipayAccount', alipayAccount)
        let alipayUtils = this.utils.alipay_utils
        let tradeNo = this.utils.uuid_utils.v4()
        let aliRet = await alipayUtils.toAccountTransfer(tradeNo, alipayAccount, balance)
        this.logger.info(ctx.uuid, 'transOutDeal()', 'aliRet', aliRet)
        if (aliRet.code != 0) {
          throw new Error(aliRet.message)
        }

      }

      transaction.status = 1
      let saveRet = await transaction.save({
        transaction: t
      })
      if (!saveRet) {
        throw new Error('数据更新失败')
      }

      t.commit()
    } catch (err) {
      t.rollback()
      return this._fail(ctx, err.message)
    }

    return ctx.ret
  }

  /**
   * 发货
   * @param {Object} ctx 
   */
  async dispatchGoods(ctx) {
    this.logger.info('dispatchGoods: ', ctx.body)

    let orderId = ctx.body.orderId
    let expressCompany = ctx.body.company
    let expressNo = ctx.body.expressNo

    let mallModel = new this.models.mall_model()
    let orderModel = mallModel.orderModel()
    let goodsModel = mallModel.goodsModel()

    let order = await orderModel.findByPk(orderId)
    if (order === null) { // 没有找到订单
      ctx.ret.data = {
        code: -1,
        error: '没有找到此订单'
      }
      return
    }
    if (order.status !== 1) { // 不是支付完成的状态
      ctx.ret.data = {
        code: -2,
        error: '订单不是“支付完成”状态'
      }
      return
    }
    this.logger.info('dispatchGoods order: ', order)

    let jdOrderId = ''

    if (order.order_type === 2) { // 是京东订单
      let sku = []
      let orderPriceSnap = []

      // order.goods_items.forEach(async (item) => {
      //   let goods = await goodsModel.findByPk(item.id)
      //   // this.logger.info('dispatchGoods goods: ', goods)
      //   item.uuid = goods.uuid
      //   sku.push({
      //     num: 1,
      //     skuId: item.uuid,
      //     bNeedAnnex: false,
      //     bNeedGift: true,
      //     // price: item.price_sell,
      //     // yanbao: [{skuId: item.uuid}]
      //   })

      //   orderPriceSnap.push({
      //     skuId: item.uuid,
      //     price: item.price_cost
      //   })
      // })

      for (let item of order.goods_items) {
        let goods = await goodsModel.findByPk(item.id)
        // this.logger.info('dispatchGoods goods: ', goods)
        item.uuid = goods.uuid
        sku.push({
          num: 1,
          skuId: item.uuid,
          bNeedAnnex: false,
          bNeedGift: true,
          // price: item.price_sell,
          // yanbao: [{skuId: item.uuid}]
        })

        orderPriceSnap.push({
          skuId: item.uuid,
          price: goods.price_market
        })
      }

      this.logger.info('submitorderparams: orderPriceSnap', orderPriceSnap)

      let submitOrderParams = {
        thirdOrder: order.order_no,
        sku: JSON.stringify(sku),
        name: order.address.name,
        province: order.address.province,
        city: order.address.city,
        county: order.address.county,
        town: order.address.town,
        address: order.address.address + order.address.info,
        mobile: order.address.mobile,
        email: 'wang.wy@jurenchina.net', //要加
        // invoiceState: 1,
        invoiceContent: 100,
        paymentType: 4,
        isUseBalance: 1,
        submitState: 0,
        doOrderPriceMode: 1,
        orderPriceSnap: JSON.stringify(orderPriceSnap),
        invoicePhone: order.address.mobile
      }

      this.logger.info('submitorderparams: ', submitOrderParams)
      let submitOrderResult = await AppMallController.submitOrder(submitOrderParams)
      this.logger.info('submitOrderResult: ', submitOrderResult)
      //错误情况
      if (!submitOrderResult.success) {
        return ctx.ret = {
          code: submitOrderResult.resultCode,
          message: submitOrderResult.resultMessage
        }
      }

      jdOrderId = submitOrderResult.result.jdOrderId
    }

    // 拿到京东订单后，去确认支付
    if (jdOrderId) {
      let doPayResult = await AppMallController.confirmOrder(jdOrderId)
      if (!doPayResult.success) {
        return ctx.ret = {
          code: -4,
          message: '京东确认订单失败'
        }
      }
    }

    orderModel.update({
      express: {
        company: expressCompany,
        express_no: expressNo
      },
      express_time: parseInt(Date.now() / 1000),
      status: 2,
      jd_order_id: jdOrderId
    }, {
      where: {
        id: orderId
      }
    }).then(result => {
      this.logger.info('dispatchGoods update result: ', result)
      ctx.ret = {
        code: 0
      }

      return ctx.ret
    }).catch(error => {
      this.logger.error('dispatchGoods error: ', error)
      ctx.ret = {
        code: -3,
        error: '更新失败'
      }

      return ctx.ret
    })
  }

  async orderAfters(ctx) {
    this.logger.info(ctx.uuid, 'orderAfters()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10
    let offset = (page - 1) * limit
    let search = ctx.body.search
    let userId = ctx.body.user_id || 0
    let status = ctx.body.status || ''
    // let status = ctx.body.status || ''

    let where = {}
    if (status !== '') {
      where.status = status
    }
    if (search) {
      // where.title = {
      //   [Op.like]: '%' + search + '%'
      // }
    }
    if (userId) {
      where.user_id = userId
    }

    let mallModel = new this.models.mall_model
    let orderAfterModel = mallModel.orderAfterModel()
    let orderModel = mallModel.orderModel()
    let paymentModel = mallModel.paymentModel()
    let userInfoModel = (new this.models.user_model).infoModel()
    orderAfterModel.belongsTo(userInfoModel, {
      targetKey: 'user_id',
      foreignKey: 'user_id'
    })

    let queryRet = await orderAfterModel.findAndCountAll({
      where: where,
      offset: offset,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ],
      attributes: {
        exclude: ['update_time', 'info']
      },
      include: [{
        model: userInfoModel,
        attributes: ['id', 'nickname', 'mobile']
      }]
    })


    for (let index = 0; index < queryRet.rows.length; index++) {
      let row = queryRet.rows[index]
      let order = await orderModel.findByPk(row.order_id)
      this.logger.info(ctx.uuid, 'orderAfters()', 'order', order)
      let payment = await paymentModel.findOne({
        where: {
          order_ids: {
            [Op.like]: '%-' + order.id + '-%'
          },
          status: 1
        }
      })
      this.logger.info(ctx.uuid, 'orderAfters()', 'payment', payment)
      // let goodsItems = order.goods_items
      // let goodsIds = row.goods_ids.toString()
      // this.logger.info(ctx.uuid, 'orderAfters()', 'row.goods_ids', row.goods_ids)
      // let afterGoodsIds = goodsIds.substr(1,goodsIds.length - 2).split('-')
      // this.logger.info(ctx.uuid, 'orderAfters()', 'afterGoodsIds', afterGoodsIds)
      // let items = []
      // let total = 0
      // let score = 0
      // goodsItems.forEach(item => {
      //   if(afterGoodsIds.indexOf(item.id.toString()) > -1){
      //     items.push(item)
      //     let itemTotal = order.vip ? (item.price_vip) : item.price_sell
      //     this.logger.info(ctx.uuid, 'orderAfters()', 'itemTotal', itemTotal)
      //     total += itemTotal
      //     if(order.score_use){
      //       let itemScore = order.vip ? item.price_score_vip : item.price_score_sell
      //       this.logger.info(ctx.uuid, 'orderAfters()', 'itemScore', itemScore)
      //       total += itemScore
      //       score += itemScore
      //     }
      //   }

      // })

      // this.logger.info(ctx.uuid, 'orderAfters()', 'items', items)
      // row.dataValues.total = total
      // row.dataValues.score = score
      row.dataValues.order = order
      row.dataValues.payment = payment
      // row.dataValues.items = items

    }

    ctx.ret.data = queryRet
    this.logger.info(ctx.uuid, 'orderAfters()', 'ret', ctx.ret)
    return ctx.ret
  }

  async orderAftetDetail(ctx) {
    this.logger.info(ctx.uuid, 'orderAftetDetail()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)
    let id = ctx.body.id

    let mallModel = new this.models.mall_model
    let orderAfterModel = mallModel.orderAfterModel()
    let orderModel = mallModel.orderModel()
    let paymentModel = mallModel.paymentModel()
    let userModel = (new this.models.user_model)
    // let userInfoModel = (new this.models.user_model).infoModel()

    let row = await orderAfterModel.findByPk(id)

    let userInfo = await userModel.getInfoByUserId(row.user_id)

    row.dataValues.user = userInfo

    let order = await orderModel.findByPk(row.order_id)
    this.logger.info(ctx.uuid, 'orderAftetDetail()', 'order', order)
    let payment = await paymentModel.findOne({
      where: {
        order_ids: {
          [Op.like]: '%-' + order.id + '-%'
        },
        status: 1
      }
    })
    this.logger.info(ctx.uuid, 'orderAftetDetail()', 'payment', payment)
    // let goodsItems = order.goods_items
    // let goodsIds = row.goods_ids.toString()
    // this.logger.info(ctx.uuid, 'orderAftetDetail()', 'row.goods_ids', row.goods_ids)
    // let afterGoodsIds = goodsIds.substr(1,goodsIds.length - 2).split('-')
    // this.logger.info(ctx.uuid, 'orderAftetDetail()', 'afterGoodsIds', afterGoodsIds)
    // let items = []
    // let total = 0
    // let score = 0

    // goodsItems.forEach(item => {
    //   if(afterGoodsIds.indexOf(item.id.toString()) > -1){

    //     let itemTotal = order.vip ? (item.price_vip) : item.price_sell
    //     this.logger.info(ctx.uuid, 'orderAftetDetail()', 'itemTotal', itemTotal)
    //     total += itemTotal
    //     let priceBuy = itemTotal
    //     if(order.score_use){
    //       let itemScore = order.vip ? item.price_score_vip : item.price_score_sell
    //       this.logger.info(ctx.uuid, 'orderAftetDetail()', 'itemScore', itemScore)
    //       total += itemScore
    //       score += itemScore
    //       priceBuy += itemScore
    //     }

    //     item.price_buy = priceBuy
    //     items.push(item)
    //   }

    // })

    // this.logger.info(ctx.uuid, 'orderAftetDetail()', 'items', items)
    // row.dataValues.total = total
    // row.dataValues.score = score
    row.dataValues.order = order
    row.dataValues.payment = payment
    // row.dataValues.items = items

    ctx.ret.data = row
    return ctx.ret
  }

  // 删除订单，退款
  async orderCancelDeal(ctx) {
    this.logger.info(ctx.uuid, 'orderCancelDeal()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)

    let orderId = ctx.body.id

    let mallModel = new this.models.mall_model
    let userModel = new this.models.user_model
    let orderModel = mallModel.orderModel()
    let paymentModel = mallModel.paymentModel()
    let orderItemModel = mallModel.orderItemModel()

    let t = await mallModel.getTrans()

    try {
      let order = await orderModel.findByPk(orderId)
      if (!order || order.status != 1) {
        throw new Error('订单错误')
      }

      let userId = order.user_id

      order.status = -2
      let orderUpdateRet = await order.save({
        transaction: t
      })
      if (!orderUpdateRet) {
        throw new Error('更新订单信息失败')
      }

      let goodsIds = order.goods_ids
      let goodsIdsArr = goodsIds.substr(1, goodsIds.length - 2).split('-')
      this.logger.info(ctx.uuid, 'orderCancelDeal()', 'goodsIdsArr', goodsIdsArr)

      for (let index = 0; index < goodsIdsArr.length; index++) {
        let goodsId = goodsIdsArr[index]
        let orderItem = await orderItemModel.findOne({
          where: {
            order_id: orderId,
            goods_id: goodsId
          }
        })
        this.logger.info(ctx.uuid, 'orderCancelDeal()', 'orderItem', orderItem)
        orderItem.status = -1
        let orderItemRet = await orderItem.save({
          transaction: t
        })

        if (!orderItemRet) {
          throw new Error('更新订单商品条目信息失败')
        }
      }

      let payment = await paymentModel.findOne({
        where: {
          order_ids: {
            [Op.like]: '%-' + order.id + '-%'
          },
          status: 1
        }
      })
      this.logger.info(ctx.uuid, 'orderCancelDeal()', 'payment', payment)
      if (!payment) {
        throw new Error('未查找到付款信息')
      }

      // 需要处理的refund
      let refund = {
        amount: 0,
        balance: 0,
        ecard: 0,
        score: 0
      }
      // 支付处理过的退款总和
      let paymentRefund = payment.refund || {}
      this.logger.info(ctx.uuid, 'orderCancelDeal()', 'paymentRefund', paymentRefund)
      let paymentAmount = parseFloat(payment.amount - (paymentRefund.amount || 0)).toFixed(2)
      let paymentBalance = parseFloat(payment.balance - (paymentRefund.balance || 0)).toFixed(2)
      let paymentEcard = parseFloat(payment.ecard - (paymentRefund.ecard || 0)).toFixed(2)


      let total = order.vip ? order.total_vip : order.total
      let score = order.score_use ? 0 : (order.vip ? order.score_vip : order.score)
      total = total + score
      let scoreNum = score * this.config.scoreExchangeNum

      refund.score = scoreNum
      if (total > paymentAmount) {
        refund.amount = paymentAmount
        paymentRefund.amount = (paymentRefund.amount || 0) + paymentAmount
        total = total - paymentAmount
      } else {
        refund.amount = total
        paymentRefund.amount = (paymentRefund.amount || 0) + total
        total = 0
      }

      if (total > paymentBalance) {
        refund.balance = paymentBalance
        paymentRefund.balance = (paymentRefund.balance || 0) + paymentBalance
        total = total - paymentBalance
      } else {
        refund.balance = total
        paymentRefund.balance = (paymentRefund.balance || 0) + total
        total = 0
      }

      if (total > paymentEcard) {
        refund.ecard = paymentEcard
        paymentRefund.ecard = (paymentRefund.ecard || 0) + paymentEcard
        total = total - paymentEcard
      } else {
        refund.ecard = total
        paymentRefund.ecard = (paymentRefund.ecard || 0) + total
        total = 0
      }

      total = parseFloat(total).toFixed(2)
      paymentRefund.amount = parseFloat(paymentRefund.amount).toFixed(2)
      paymentRefund.balance = parseFloat(paymentRefund.balance).toFixed(2)
      paymentRefund.ecard = parseFloat(paymentRefund.ecard).toFixed(2)

      this.logger.info(ctx.uuid, 'orderCancelDeal()', 'refund', refund)
      this.logger.info(ctx.uuid, 'orderCancelDeal()', 'paymentRefund', paymentRefund)

      payment.refund = paymentRefund
      let paymentRet = payment.save({
        transaction: t
      })
      if (!paymentRet) {
        throw new Error('更新账单支付信息失败')
      }

      // 处理退款
      let userInfo = await userModel.getInfoByUserId(userId)


      userInfo.balance = parseFloat(userInfo.balance + parseFloat(refund.balance)).toFixed(2)
      userInfo.score = userInfo.score + refund.score

      let userInfoRet = await userInfo.save({
        transaction: t
      })
      if (!userInfoRet) {
        throw new Error('更新用户信息失败')
      }

      if (refund.ecard && payment.ecard_id) {
        let ecardId = payment.ecard_id
        let userEcardModel = userModel.ecardModel()
        let ecard = await userEcardModel.findByPk(ecardId)
        if (!ecard) {
          throw new Error('未找到对应退款代金券')
        }

        ecard.amount = parseFloat(ecard.amount + parseFloat(refund.ecard)).toFixed(2)
        ecard.status = 1
        let ecardRet = await ecard.save({
          transaction: t
        })
        if (!ecardRet) {
          throw new Error('代金券信息更新失败')
        }
      }

      if (refund.amount) {
        if (!userInfo.alipay) {
          throw new Error('用户未设置支付宝，请提醒用户设置')
        }

        // 支付宝退款
        let alipayAccount = userInfo.alipay
        this.logger.info(ctx.uuid, 'orderCancelDeal()', 'alipayAccount', alipayAccount)
        let alipayUtils = this.utils.alipay_utils
        let tradeNo = this.utils.uuid_utils.v4()
        let amount = parseFloat(1 * refund.amount).toFixed(2)

        if (parseFloat(amount) > 0) {
          let aliRet = await alipayUtils.toAccountTransfer(tradeNo, alipayAccount, amount)
          this.logger.info(ctx.uuid, 'transactionUpdate()', 'aliRet', aliRet)
          if (aliRet.code != 0) {
            return this._fail(ctx, aliRet.message)
          }
        } else {
          this.logger.info(ctx.uuid, 'transactionUpdate()', '无需退在线支付')
        }

      }

      t.commit()
    } catch (err) {
      ctx.ret.code = 1
      ctx.ret.message = err.message
      t.rollback()
    }

    return ctx.ret
  }
  /* 
   * type : 1:退货 2:换货
   */
  async orderAfterDeal(ctx) {
    this.logger.info(ctx.uuid, 'orderAfterDeal()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)

    let orderAfterId = ctx.body.id
    let type = ctx.body.type || 0

    let mallModel = new this.models.mall_model
    let userModel = new this.models.user_model
    let orderModel = mallModel.orderModel()
    let paymentModel = mallModel.paymentModel()
    let orderItemModel = mallModel.orderItemModel()
    let orderAfterModel = mallModel.orderAfterModel()

    let t = await mallModel.getTrans()

    try {

      let orderAfter = await orderAfterModel.findByPk(orderAfterId)
      this.logger.info(ctx.uuid, 'orderAfterDeal()', 'orderAfter', orderAfter)

      let userId = orderAfter.user_id

      let orderId = orderAfter.order_id
      let goodsIds = orderAfter.goods_ids
      let amount = 0

      orderAfter.status = 1
      orderAfter.category = (type == 1) ? '退款' : '退货';
      orderAfter.remark = ctx.body.remark
      let orderAfterRet = await orderAfter.save({
        transaction: t
      })
      if (!orderAfterRet) {
        throw new Error('更新售后信息失败')
      }

      if (type == 1) {

        // 退款
        let goodsIdsArr = goodsIds.substr(1, goodsIds.length - 2).split('-')

        for (let index = 0; index < goodsIdsArr.length; index++) {
          let goodsId = goodsIdsArr[index]
          let orderItem = await orderItemModel.findOne({
            where: {
              order_id: orderId,
              goods_id: goodsId
            }
          })
          this.logger.info(ctx.uuid, 'orderAfterDeal()', 'orderItem', orderItem)
          orderItem.status = -1
          let orderItemRet = await orderItem.save({
            transaction: t
          })

          if (!orderItemRet) {
            throw new Error('更新订单商品条目信息失败')
          }
        }

        let order = await orderModel.findByPk(orderId)
        this.logger.info(ctx.uuid, 'orderAfterDeal()', 'order', order)
        if (order.goods_ids == orderAfter.goods_ids) {
          order.status = -1
          let orderUpdateRet = await order.save({
            transaction: t
          })
          if (!orderUpdateRet) {
            throw new Error('更新订单信息失败')
          }
        }

        let payment = await paymentModel.findOne({
          where: {
            order_ids: {
              [Op.like]: '%-' + order.id + '-%'
            },
            status: 1
          }
        })
        this.logger.info(ctx.uuid, 'orderAfterDeal()', 'payment', payment)
        if (!payment) {
          throw new Error('未查找到付款信息')
        }

        // 需要处理的refund
        let refund = {
          amount: 0,
          balance: 0,
          ecard: 0,
          score: 0
        }
        // 支付处理过的退款总和
        let paymentRefund = payment.refund || {}
        this.logger.info(ctx.uuid, 'orderAfterDeal()', 'paymentRefund', paymentRefund)
        let paymentAmount = parseFloat(payment.amount - (paymentRefund.amount || 0)).toFixed(2)
        let paymentBalance = parseFloat(payment.balance - (paymentRefund.balance || 0)).toFixed(2)
        let paymentEcard = parseFloat(payment.ecard - (paymentRefund.ecard || 0)).toFixed(2)

        let total = orderAfter.total
        let score = orderAfter.score

        refund.score = score
        if (total > paymentAmount) {
          refund.amount = paymentAmount
          paymentRefund.amount = (paymentRefund.amount || 0) + paymentAmount
          total = total - paymentAmount
        } else {
          refund.amount = total
          paymentRefund.amount = (paymentRefund.amount || 0) + total
          total = 0
        }

        if (total > paymentBalance) {
          refund.balance = paymentBalance
          paymentRefund.balance = (paymentRefund.balance || 0) + paymentBalance
          total = total - paymentBalance
        } else {
          refund.balance = total
          paymentRefund.balance = (paymentRefund.balance || 0) + total
          total = 0
        }

        if (total > paymentEcard) {
          refund.ecard = paymentEcard
          paymentRefund.ecard = (paymentRefund.ecard || 0) + paymentEcard
          total = total - paymentEcard
        } else {
          refund.ecard = total
          paymentRefund.ecard = (paymentRefund.ecard || 0) + total
          total = 0
        }

        total = parseFloat(total).toFixed(2)
        paymentRefund.amount = parseFloat(paymentRefund.amount).toFixed(2)
        paymentRefund.balance = parseFloat(paymentRefund.balance).toFixed(2)
        paymentRefund.ecard = parseFloat(paymentRefund.ecard).toFixed(2)

        this.logger.info(ctx.uuid, 'orderAfterDeal()', 'refund', refund)
        this.logger.info(ctx.uuid, 'orderAfterDeal()', 'paymentRefund', paymentRefund)

        payment.refund = paymentRefund
        let paymentRet = payment.save({
          transaction: t
        })
        if (!paymentRet) {
          throw new Error('更新账单支付信息失败')
        }

        // 处理退款
        let userInfo = await userModel.getInfoByUserId(userId)
        this.logger.info(ctx.uuid, 'orderAfterDeal()', 'userInfo', userInfo)


        userInfo.balance = parseFloat(userInfo.balance + parseFloat(refund.balance)).toFixed(2)
        userInfo.score = userInfo.score + refund.score
        this.logger.info(ctx.uuid, 'orderAfterDeal()', 'userInfo.balance', userInfo.balance)
        this.logger.info(ctx.uuid, 'orderAfterDeal()', 'userInfo.score', userInfo.score)

        let userInfoRet = await userInfo.save({
          transaction: t
        })
        if (!userInfoRet) {
          throw new Error('更新用户信息失败')
        }

        if (refund.ecard && payment.ecard_id) {
          let ecardId = payment.ecard_id

          this.logger.info(ctx.uuid, 'transactionUpdate()', 'ecardId', ecardId)
          let userEcardModel = userModel.ecardModel()
          let ecard = await userEcardModel.findByPk(ecardId)
          this.logger.info(ctx.uuid, 'transactionUpdate()', 'ecard', ecard)
          if (!ecard) {
            throw new Error('未找到对应退款代金券')
          }

          ecard.amount = parseFloat(ecard.amount + parseFloat(refund.ecard)).toFixed(2)
          ecard.status = 1
          let ecardRet = await ecard.save({
            transaction: t
          })
          this.logger.info(ctx.uuid, 'transactionUpdate()', 'ecardRet', ecardRet)
          if (!ecardRet) {
            throw new Error('代金券信息更新失败')
          }
        }

        if (refund.amount) {
          if (!userInfo.alipay) {
            throw new Error('用户未设置支付宝，请提醒用户设置')
          }

          // 支付宝退款
          let alipayAccount = userInfo.alipay
          this.logger.info(ctx.uuid, 'orderAfterDeal()', 'alipayAccount', alipayAccount)
          let alipayUtils = this.utils.alipay_utils
          let tradeNo = this.utils.uuid_utils.v4()
          amount = parseFloat(1 * refund.amount).toFixed(2)
          // if (this.config.DEBUG) {
          //   amount = 0.1
          // }
          if (parseFloat(amount) > 0) {
            let aliRet = await alipayUtils.toAccountTransfer(tradeNo, alipayAccount, amount)
            this.logger.info(ctx.uuid, 'transactionUpdate()', 'aliRet', aliRet)
            if (aliRet.code != 0) {
              // return this._fail(ctx, aliRet.message)
              throw new Error(aliRet.message)
            }
          } else {
            this.logger.info(ctx.uuid, 'transactionUpdate()', '无需退在线支付')
          }

        }

      }

      t.commit()
    } catch (err) {
      ctx.ret.code = 1
      ctx.ret.message = err.message
      t.rollback()
    }

    return ctx.ret
  }

  /**
   * 交易后的商品评价列表
   * @param {Object} ctx 
   */
  async orderCommentList(ctx) {
    this.logger.info('orderCommentList: ', ctx.body)
    let {
      page = 1, limit = 10, search = ''
    } = ctx.body

    let mallModel = new this.models.mall_model()
    let commentModel = mallModel.orderItemModel()

    let ret = await commentModel.findAndCountAll({
      where: {
        order_status: 9
      },
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ],
    })

    if (ret === null) { // 没找到
      return ctx.ret.data = {
        rows: [],
        count: 0
      }
    }

    ctx.ret.data = ret

    return ctx.ret
  }

  async orderExport(ctx) {
    let dateFormat = 'YYYYMMDD'
    let startTime = dateUtiles.getTimestamp(ctx.body.startDate) || 0
    let endTime = dateUtiles.getTimestamp(ctx.body.endDate) || 0
    let mallModel = new this.models.mall_model
    let orderModel = mallModel.orderModel()
    let startDate = startTime > 0 ? dateUtiles.dateFormat(startTime, dateFormat) : '开始'
    let endDate = endTime > 0 ? dateUtiles.dateFormat(endTime, dateFormat) : '至今'
    let {
      count,
      rows
    } = await orderModel.findAndCountAll({
      where: {
        status: {
          [Op.gt]: -1
        },
        create_time: {
          [Op.gte]: startTime > 0 ? startTime : 0,
          [Op.lte]: endTime > 0 ? endTime + 24 * 3600 - 1 : parseInt(Date.now() / 1000)
        }
      },
      order: [
        ['create_time', 'desc']
      ]
    })
    //csv数据
    let csvList = []
    //字段
    let fields = [
      '日期',
      '订单号', '京东订单号', '使用的积分金额',
      '商品ID', '购买商品', '数量', '订单状态',
      '订单类型', '总价', '收件人', '收件人电话', '收件人地址',
      '支付方式'
    ]
    for (let item in rows) {
      let goodNamesList = [],
        goodIdsList = [],
        goodNums = []
      for (let index in rows[item].goods_items) {
        goodIdsList.push(rows[item].goods_items[index].id)
        goodNamesList.push(rows[item].goods_items[index].title)
        goodNums.push(rows[item].goods_items[index].num)
      }

      let score = 0
      if (!rows[item].score_use) {
        if (rows[item].vip) {
          score = rows[item].score_vip
        } else {
          score = rows[item].score
        }
      }

      let payment = ''
      let paymentData = rows[item].payment
      console.log(paymentData)
      let paymentTypes = ['', '代金券', '账户余额', '在线支付']
      let paymentMethods = {
        ecard: '代金券',
        balance: '账户余额',
        alipay: '支付宝',
        wxpay: '微信支付'
      }
      if (paymentData.type) {

        if (paymentData.type == 1 || paymentData.type == 2) {
          payment += paymentTypes[paymentData.type]
          if (paymentData.method == 'alipay' || paymentData.method == 'wxpay') {
            payment += ('+' + paymentMethods[paymentData.method])
          }
        } else if (paymentData.type == 3) {
          payment += paymentMethods[paymentData.method]
        }
      }
      console.log('payment', payment)
      let dateUtils = this.utils.date_utils
      let record = {
        '日期': dateUtils.dateFormat(rows[item].create_time),
        '订单号': rows[item].order_no,
        '京东订单号': rows[item].jd_order_id,
        '使用的积分数量': score,
        '商品ID': goodIdsList.join(','),
        '购买商品': goodNamesList.join(','),
        '数量': goodNums.join(','),
        '订单状态': this._getOrderStatus(rows[item].status),
        '订单类型': this._getOrderType(rows[item].order_type),
        '总价': this._getOrderTotal(rows[item]),
        '收件人': rows[item].address ? rows[item].address.name : '',
        '收件人电话': rows[item].address ? rows[item].address.mobile : '',
        '收件人地址': rows[item].address ? rows[item].address.address + rows[item].address.info : '',
        '支付方式': payment
      }
      csvList.push(record)
    }
    try {
      const parser = new Parser({
        fields
      })
      let csv = parser.parse(csvList)
      let filePath = __dirname + '/../../../backup/'
      let fileName = `${startDate}-${endDate}.csv`
      await util.promisify(fs.writeFile)(path.join(filePath, fileName), csv)
      let uploadResult = await aliOssUtils.uploadFile(filePath + fileName)
      ctx.ret.uploadResult = uploadResult
      if (!uploadResult.url) {
        ctx.ret.code = -1
        ctx.ret.message = '导出文件失败'
      } else {
        ctx.ret.code = 0
        ctx.ret.message = '上传成功'
        ctx.ret.data = {
          url: uploadResult.url
        }
      }
      return ctx.ret
    } catch (err) {
      console.log(err)
      ctx.ret.code = -1
      ctx.ret.message = '导出文件失败'
      return ctx.ret
    }

  }

  async paymentExport(ctx) {
    let dateFormat = 'YYYYMMDD'
    let startTime = dateUtiles.getTimestamp(ctx.body.startDate) || 0
    let endTime = dateUtiles.getTimestamp(ctx.body.endDate) || 0
    let startDate = startTime > 0 ? dateUtiles.dateFormat(startTime, dateFormat) : '开始'
    let endDate = endTime > 0 ? dateUtiles.dateFormat(endTime, dateFormat) : '至今'

    let mallModel = new this.models.mall_model
    let paymentModel = mallModel.paymentModel()
    let orderModel = mallModel.orderModel()
    let userInfoModel = (new this.models.user_model).infoModel()
    paymentModel.belongsTo(userInfoModel, {
      targetKey: 'user_id',
      foreignKey: 'user_id'
    })

    let {
      count,
      rows
    } = await paymentModel.findAndCountAll({
      where: {
        status: 1,
        create_time: {
          [Op.gte]: startTime > 0 ? startTime : 0,
          [Op.lte]: endTime > 0 ? endTime : parseInt(Date.now() / 1000)
        }
      },
      order: [
        ['create_time', 'desc']
      ],
      include: [{
        model: userInfoModel,
        attributes: ['id', 'nickname', 'mobile']
      }]
    })
    //csv数据
    let csvList = []
    //字段
    let fields = [
      'ID', '用户信息', '手机号码', '支付方式', '账单总金额', '在线支付金额', '代金券使用', '余额使用', '积分使用', '支付时间', '总成本', '订单号', '微信支付商户号'
    ]
    let payTypes = ['', '代金券', '账户余额', '在线支付']
    let payMethods = {
      ecard: '代金券',
      balance: '账户余额',
      wxpay: '微信支付',
      alipay: '支付宝'
    }
    for (let i in rows) {
      let dateUtils = this.utils.date_utils
      let item = rows[i]
      let payment = ''
      payment += payTypes[item.pay_type]
      if (item.pay_method == 'alipay' || item.pay_method == 'wxpay') {
        payment += (',' + payMethods[item.pay_method])
      }
      let record = {
        'ID': item.id,
        '用户信息': item.user_info.nickname,
        '手机号码': item.user_info.mobile,
        '支付方式': payment,
        '账单总金额': parseFloat(item.amount + item.balance + item.ecard).toFixed(2),
        '在线支付金额': parseFloat(item.amount).toFixed(2),
        '代金券使用': parseFloat(item.ecard).toFixed(2),
        '余额使用': parseFloat(item.balance).toFixed(2),
        '积分使用': item.score,
        '支付时间': dateUtils.dateFormat(item.create_time)
      }

      let orderIds = item.order_ids.substr(1, item.order_ids.length - 2).split('-')
      let orders = await orderModel.findAll({
        where: {
          id: {
            [Op.in]: orderIds
          }
        }
      })
      let orderNos = []
      let priceCost = 0
      orders.forEach(order => {
        orderNos.push(order.order_no)
        let goodsItems = order.goods_items
        goodsItems.forEach(goods => {
          priceCost += (goods.price_cost * goods.num)
        })
      })

      record['总成本'] = parseFloat(priceCost).toFixed(2)
      record['订单号'] = orderNos.join(',')

      if (item.pay_method == 'wxpay') {
        // console.log(item.dataValues)
        let wxpayInfo = JSON.parse(item.info) || {}
        record['微信支付商户号'] = wxpayInfo.partnerid || ''

      } else {
        record['微信支付商户号'] = ''
      }

      csvList.push(record)
    }
    try {
      const parser = new Parser({
        fields
      })
      let csv = parser.parse(csvList)
      let filePath = __dirname + '/../../../backup/'
      let fileName = `${startDate}-${endDate}-payment.csv`
      await util.promisify(fs.writeFile)(path.join(filePath, fileName), csv)
      let uploadResult = await aliOssUtils.uploadFile(filePath + fileName)
      ctx.ret.uploadResult = uploadResult
      if (!uploadResult.url) {
        ctx.ret.code = -1
        ctx.ret.message = '导出文件失败'
      } else {
        ctx.ret.code = 0
        ctx.ret.message = '上传成功'
        ctx.ret.data = {
          url: uploadResult.url
        }
      }
      return ctx.ret
    } catch (err) {
      console.log(err)
      ctx.ret.code = -1
      ctx.ret.message = '导出文件失败'
      return ctx.ret
    }
  }

  _getOrderStatus(status) {
    switch (status) {
      case 0:
        return '订单已拍（待支付）'
      case 1:
        return '支付完成'
      case 2:
        return '已发货'
      case 9:
        return '已收货'
      default:
        return 'Unknown'
    }
  }
  _getOrderType(orderType) {
    switch (orderType) {
      case 1:
        return '自营'
      case 2:
        return '京东'
      default:
        return 'Unknown'
    }
  }
  _getOrderTotal(row) {
    let returnTotal = 0
    //会员
    if (row.vip == 1) {
      if (row.score_use == 1) {
        returnTotal = row.total_vip
      } else {
        returnTotal = row.total_vip + row.score_vip
      }
    } else {
      //非会员
      if (row.score_use == 1) {
        returnTotal = row.total
      } else {
        returnTotal = row.total + row.score
      }
    }
    return parseFloat(returnTotal).toFixed(2)
  }


}

module.exports = MallController