const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op

class MallController extends Controller {

  async categoryList(ctx) {
    this.logger.info(ctx.uuid, 'categoryList()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)

    let where = {}
    where.type = this.config.categoryType.GOODS
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
    this.logger.info(ctx.uuid, 'info()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)
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
    this.logger.info(ctx.uuid, 'categoryUpdate()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)
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
    this.logger.info(ctx.uuid, 'goodsList()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10
    let offset = (page - 1) * limit
    let search = ctx.body.search

    let where = {}
    if (search) {
      where.title = {
        [Op.like]: '%' + search + '%'
      }
    }
    if (search) {
      where.title = {
        [Op.like]: '%' + search + '%'
      }
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
    this.logger.info(ctx.uuid, 'goodsInfo()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)
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
    this.logger.info(ctx.uuid, 'goodsUpdate()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)
    delete ctx.body.update_time
    let mallModel = new this.models.mall_model

    let data = ctx.body
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
    this.logger.info(ctx.uuid, 'orderList()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)

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
    if(type !== ''){
      where.order_type = type
    }
    
    if(orderIds){
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

    let orderInfo = await mallModel.orderModel().findOne(dbOptions)
    if (orderInfo === null) { // 没有找到
      ctx.ret.data = {}
    }
    ctx.ret.data = orderInfo
    return ctx.ret
  }

  async paymentList(ctx) {
    this.logger.info(ctx.uuid, 'paymentList()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10
    let offset = (page - 1) * limit
    let search = ctx.body.search
    let userId = ctx.body.user_id || 0
    // let status = ctx.body.status || ''

    let where = {}
    where.status = 1
    if (search) {
      // where.title = {
      //   [Op.like]: '%' + search + '%'
      // }
    }
    if (userId) {
      where.user_id = userId
    }
 
    let mallModel = new this.models.mall_model
    let paymentModel = mallModel.paymentModel()
    let userInfoModel = (new this.models.user_model).infoModel()
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
        exclude: ['update_time', 'info']
      },
      include: [{
        model: userInfoModel,
        attributes: ['id', 'nickname', 'mobile']
      }]
    })

    ctx.ret.data = queryRet
    this.logger.info(ctx.uuid, 'paymentList()', 'ret', ctx.ret)
    return ctx.ret
  }

  async transOutDeal(ctx) {
    this.logger.info(ctx.uuid, 'transOutDeal()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)
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
   * 
   * type : 1:退货 2:换货
   */
  async orderAfterDeal(ctx) {
    this.logger.info(ctx.uuid, 'orderAfterDeal()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)

    let orderAfterId = ctx.body.id
    let type = ctx.body.type || 0

    let mallModel = new this.models.mall_model
    let orderModel = mallModel.orderModel()
    let orderItemModel = mallModel.orderItemModel()
    let orderAfterModel = mallModel.orderAfterModel()

    let t = await mallModel.getTrans()

    try {
      let orderAfter = await orderAfterModel.findByPk(orderAfterId)

      let orderId = orderAfter.order_id
      let goodsIds = orderAfter.goods_ids

      if (type == 1) {
        // 退货
        let goodsIdsArr = goodsIds.substr(1, goodsIds.length - 2).split('-')

        for (let index = 0; index < goodsIdsArr.length; index++) {
          let goodsId = goodsIdsArr[index];
          let orderItem = await orderItemModel.findOne({
            where: {
              order_id: orderId,
              goods_id: goodsId
            }
          })

          orderItem.status = -1
          let orderItemRet = await orderItem.save({
            transaction: t
          })

          if(!orderItemRet){
            throw new Error('更新订单商品条目信息失败')
          }
        }

        let order = await orderModel.findByPk(orderId)
        if(order.goods_ids == orderAfter.goods_ids){
          order.status = -1
          let orderUpdateRet = await order.save({transaction: t})
          if(!orderUpdateRet){
            throw new Error('更新订单信息失败')
          }
        }

      }

    } catch (err) {
      ctx.ret.code = 1
      ctx.ret.message = err.message
      t.rollback()
    }
  }

}

module.exports = MallController