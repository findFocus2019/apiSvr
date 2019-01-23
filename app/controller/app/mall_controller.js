const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op

class MallController extends Controller {

  async _init_(ctx) {
    if (ctx.token) {
      let userModel = new this.models.user_model
      await userModel.checkAuth(ctx)
    }

    if (!ctx.body.hasOwnProperty('user_id') || !ctx.body.user_id) {
      let unLimitRoutes = ['goodsList', 'goodsInfo', 'categorys']
      if (unLimitRoutes.indexOf(ctx.route.action) < 0) {
        ctx.ret.code = -100
        ctx.ret.message = '请先登录进行操作'
        return ctx.ret
      }
    }
  }

  async categorys(ctx) {
    let mallModel = new this.models.mall_model

    let type = ctx.body.type || 1
    if (type == 1) {
      let categorys = await mallModel.getGoodsCategory()
      ctx.ret.data = categorys
    } else {
      let categorys = await mallModel.getGoodsCategoryJd()
      ctx.ret.data = categorys
    }

    return ctx.ret

  }

  /**
   * 商品列表
   * @param {*} ctx 
   */
  async goodsList(ctx) {
    this.logger.info(ctx.uuid, 'goodsList()', 'body', ctx.body, 'query', ctx.query)

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10

    let timestamp = ctx.body.timestamp
    let search = ctx.body.search || ''
    let type = ctx.body.type || 1 // 分类
    let category = ctx.body.category || ''
    if (category === 'all') {
      category = ''
    }

    let where = {}
    where.update_time = {
      [Op.lte]: timestamp
    }
    where.type = type
    if (category) {
      where.category = category
    }
    if (search) {
      where.title = {
        [Op.like]: '%' + search + '%'
      }
    }
    this.logger.info(ctx.uuid, 'goodsList()', 'where', where)

    let mallModel = new this.models.mall_model
    let goodsModel = mallModel.goodsModel()
    let queryRet = await goodsModel.findAndCountAll({
      where: where,
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['update_time', 'desc']
      ],
      attributes: this.config.goodsListAttributes
    })

    let whereNew = where
    whereNew.update_time = {
      [Op.gt]: timestamp
    }
    this.logger.info(ctx.uuid, 'goodsList()', 'whereNew', whereNew)
    let newCount = await goodsModel.count({
      where: where
    })

    ctx.ret.data = {
      rows: queryRet.rows || [],
      count: queryRet.count || 0,
      page: page,
      limit: limit,
      newCount: newCount
    }
    this.logger.info(ctx.uuid, 'goodsList()', 'ret', ctx.ret)

    return ctx.ret
  }

  /**
   * 商品评价列表
   * @param {*} ctx 
   */
  async goodsRateList(ctx) {
    this.logger.info(ctx.uuid, 'goodsRateList()', 'body', ctx.body, 'query', ctx.query)

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10

    let goodsId = ctx.body.goods_id

    let where = {}
    where.goods_id = goodsId
    this.logger.info(ctx.uuid, 'goodsRateList()', 'where', where)

    let mallModel = new this.models.mall_model
    let orderRateModel = mallModel.orderRateModel()
    let queryRet = await orderRateModel.findAndCountAll({
      where: where,
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['update_time', 'desc']
      ]
    })

    ctx.ret.data = {
      rows: queryRet.rows || [],
      count: queryRet.count || 0,
      page: page,
      limit: limit
    }
    this.logger.info(ctx.uuid, 'goodsRateList()', 'ret', ctx.ret)

    return ctx.ret
  }

  /**
   * 商品详情
   * @param {*} ctx 
   */
  async goodsInfo(ctx) {

    this.logger.info(ctx.uuid, 'goodsInfo()', 'body', ctx.body, 'query', ctx.query)

    let goodsId = ctx.body.goods_id
    let mallModel = new this.models.mall_model
    let goodsModel = mallModel.goodsModel()

    let info = await goodsModel.findOne({
      where: {
        uuid: goodsId
      }
    })

    this.logger.info(ctx.uuid, 'goodsInfo()', 'info', info)
    ctx.ret.data = {
      info: info
    }

    return ctx.ret
  }

  /**
   * 生成订单
   */
  async orderCreate(ctx) {
    this.logger.info(ctx.uuid, 'orderCreate()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id

    let items = ctx.body.items
    let orderType = ctx.body.order_type || 1 // 1:自营 2:京东
    let payType = ctx.body.pay_type || 1 // 1：Eka 2：账户余额 3：在线支付
    let useScore = ctx.body.score || 0 // 是否使用积分
    let ecardId = ctx.body.ecard_id || 0
    let address = ctx.body.address
    let invoice = ctx.body.invoice
    let remark = ctx.body.remark || ''

    if (payType == 1 && ecardId == 0) {
      this._fail(ctx, '请选择E卡')
    }

    let mallModel = new this.models.mall_model
    let goodsModel = mallModel.goodsModel()
    let userModel = new this.models.user_model
    // let shareModel = new this.models.share_model
    // let postsModel = new this.models.posts_model
    let userInfo = await userModel.getInfoByUserId(userId)

    let t = await mallModel.getTrans()
    try {

      let goodsIds = []
      let goodsItems = []
      let amount = 0 // 在线支付费用
      let ecard = 0 // e卡支付费用
      let balance = 0 // 余额支付费用
      let score = 0

      let isVip = await userModel.isVip(userId)

      for (let index = 0; index < items.length; index++) {
        let item = items[index]
        let num = item.num
        let goods = await goodsModel.findByPk(item.goods_id)
        let goodsFee = isVip ? goods.price_vip : goods.price_sell
        let scoreItem = isVip ? goods.price_score_vip : goods.price_score_sell

        // 判断库存
        if (num > goods.stock && goods.stock != -1) {
          throw new Error(`${item.title}库存不足`)
        } else {
          // 更新库存
          goods.stock = goods.stock - num
          let stockRet = await goods.save({
            transaction: t
          })
          if (!stockRet) {
            throw new Error(`${item.title}库存更新失败`)
          }
        }

        // 计算费用
        score += scoreItem // TODO 讲价
        if (!useScore) {
          goodsFee = goodsFee * 1 + scoreItem / 1000
        }
        if (payType == 1) {
          ecard += goodsFee
        } else if (payType == 2) {
          balance += goodsFee
        } else if (payType == 3) {
          amount += goodsFee
        }

        item.num_rabate = goodsFee - (useScore ? (scoreItem / 1000) : 0) * 1

        goodsIds.push(item.goods_id)
        goodsItems.push(item)

      }

      if (payType == 1) {
        let userEcard = await userModel.ecardModel().findByPk(ecardId)
        if (userEcard.amount < ecard) {
          // 费用不够，收益补上
          balance = ecard - userEcard.amount

          // 收益不够，支付补
          if (balance > userInfo.balance) {
            amount = ecard - userEcard.amount
            balance = 0
          }
        }

        // 减去ecard金额
        userEcard.amount = (userEcard.amount < ecard) ? 0 : (userEcard.amount - ecard)
        let userEcardRet = await userEcard.save({
          transaction: t
        })
        if (!userEcardRet) {
          throw new Error('记录ecard使用失败')
        }


      } else if (payType == 2) {
        if (balance > userInfo.balance) {
          throw new Error('账户余额不足，请换其他支付方式')
        }
      }

      // 判断积分是否足够
      if (score > userInfo.score) {
        throw new Error('积分不足')
      }

      // 减去积分和收益
      userInfo.score = userInfo.score - score
      userInfo.balance = userInfo.balance - balance
      let userInfoUpdateRet = await userInfo.save({
        transaction: t
      })
      if (!userInfoUpdateRet) {
        throw new Error('更新用户积分余额失败')
      }

      let orderData = {
        user_id: userId,
        goods_ids: '-' + goodsIds.join('-') + '-',
        goodsItems: goodsItems,
        pay_type: payType,
        amount: amount,
        balance: balance,
        ecard: ecard,
        score: score,
        ecard_id: ecardId,
        address: address,
        invoice: invoice,
        remark: remark,
        order_type: orderType,
        is_vip: isVip
      }

      orderData.order_no = this._createOrderNo(ctx)
      orderData.status = (amount == 0) ? 1 : 0 // 不用在线支付的默认支付成功
      let order = await mallModel.orderModel().create(orderData, {
        transaction: t
      })
      if (!order) {
        throw new Error('创建订单失败')
      }

      // 就不在这里计算返利了

      if (amount == 0) {
        // 直接支付成功了
        ctx.ret.code = 2
      }

      t.commit()
    } catch (err) {
      t.rollback()
      return this._fail(ctx, err.message)
    }

    return ctx.ret

  }

  _createOrderNo(ctx) {
    let orderNo = ''
    orderNo += this.utils.uuid_utils.randomNum(6).toString()
    orderNo += this.utils.date_utils.dateFormat(null, 'YYYYMMDDHHmmss')
    orderNo += this.utils.uuid_utils.randomNum(6).toString()
    this.logger.info(ctx.uuid, 'create()._createOrderNo', orderNo)
    return orderNo
  }

  async _rabateItems(ctx, orderId, t = null) {
    let mallModel = new this.models.mall_model

    let order = await mallModel.orderModel().findByPk(orderId)
    let items = order.goods_items

    try {
      for (let index = 0; index < items.length; index++) {
        const item = items[index]
        let rabateRet = await this._rabateItem(ctx, order, item, t)
        if (rabateRet.code != 0) {
          throw new Error('计算返利错误')
        }
      }

      let opts = {}
      if (t) {
        opts.transaction = t
      }
      order.rabate = 1
      let orderRet = await order.save(opts)
      if (!orderRet) {
        throw new Error('订单返利记录错误')
      }

    } catch (err) {
      ctx.ret.code = 1
      ctx.ret.message = err.message
    }

    return ctx.ret
  }
  /**
   * 计算返利
   * @param {*} ctx 
   * @param {*} order 
   * @param {*} item 
   * @param {*} t 
   */
  async _rabateItem(ctx, order, item, t = null) {

    let userId = ctx.body.user_id
    let userModel = new this.models.user_model
    let shareModel = new this.models.share_model
    let postsModel = new this.models.posts_model
    let mallModel = new this.models.mall_model
    let orderRabateModel = mallModel.orderRabateModel()
    let user = await userModel.model().findByPk(userId)

    // 记录返利
    let inviteUserId = 0
    let shareUserId = 0
    let postUserId = 0
    let numRabateShare = 0
    let numRabatePost = 0
    let numRabateInvite = 0

    if (user.pid) {
      let inviteUser = await userModel.getInviteUser(user.pid)
      if (inviteUser) {
        inviteUserId = 0
      }
    }

    let shareId = item.share_id
    let share = await shareModel.model().findByPk(shareId)
    shareUserId = share.user_id

    if (share.post_id) {
      let post = await postsModel.model().findByPk(share.post_id)
      // if (post.user_id != shareUserId) {
      //   postUserId = post.user_id
      // }
      postUserId = post.user_id

    }

    let numRabate = item.num_rabate
    if (!shareUserId && !postUserId) {
      if (inviteUserId) {
        numRabateInvite = numRabate
      }

    } else {
      if (shareUserId && !postUserId) {
        numRabatePost = numRabate * 70 / 100
        if (inviteUserId) {
          numRabateInvite = numRabate * 30 / 100
        }
      } else if (!shareUserId && postUserId) {
        numRabateShare = numRabate * 50 / 100
        if (inviteUserId) {
          numRabateInvite = numRabate * 50 / 100
        }
      } else {
        numRabatePost = numRabate * 30 / 100
        numRabateShare = numRabate * 40 / 100
        if (inviteUserId) {
          numRabateInvite = numRabate * 30 / 100
        }
      }


    }

    let opts = {}
    if (t) {
      opts.transaction = t
    }
    let orderItem = await orderRabateModel.create({
      user_id: userId,
      order_id: order.id,
      goods_id: item.goods_id,
      num_rabate: numRabate,
      num_rabate_share: numRabateShare,
      num_rabate_post: numRabatePost,
      num_rabate_invite: numRabateInvite
    }, opts)
    if (!orderItem) {
      ctx.ret.code = 1
      ctx.ret.message = ''
    }

    return ctx.ret

  }
  /**
   * 返利
   * @param {*} ctx 
   * @param {*} items 
   */
  _rabate(ctx, orderId, t = null) {

  }

  /**
   * 第三方支付下单
   */
  async orderPayPre() {

  }

  /**
   * 确认支付(前端回调确认支付)
   */
  async orderPayConfirm(ctx) {

    let body = ctx.body
    let orderId = body.order_id

    let mallModel = new this.models.mall_model
    let orderModel = mallModel.orderModel()

    let t = await mallModel.getTrans()

    try {

      let order = await orderModel.findByPk(orderId)
      let items = order.goods_items
      let rabateRet = await this._rabate(ctx, items, t)
      if (rabateRet.code != 0) {
        throw new Error(rabateRet.message)
      }

      t.commit()
    } catch (err) {
      t.rollback()
      return this._fail(ctx, err.message)
    }

    return ctx.ret
  }

  /**
   * 订单列表
   */
  async orderList(ctx) {

    this.logger.info(ctx.uuid, 'orderList()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10

    let where = {}
    where.user_id = userId
    this.logger.info(ctx.uuid, 'orderList()', 'where', where)

    let mallModel = new this.models.mall_model
    let orderModel = mallModel.orderModel()
    let queryRet = await orderModel.findAndCountAll({
      where: where,
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['update_time', 'desc']
      ],
    })

    ctx.ret.data = {
      rows: queryRet.rows || [],
      count: queryRet.count || 0,
      page: page,
      limit: limit
    }
    this.logger.info(ctx.uuid, 'orderList()', 'ret', ctx.ret)

    return ctx.ret
  }

  /**
   * 订单详情
   */
  async orderInfo(ctx) {

    this.logger.info(ctx.uuid, 'orderInfo()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let orderId = ctx.body.order_id

    let mallModel = new this.models.mall_model
    let orderModel = mallModel.orderModel()

    let order = await orderModel.findByPk(orderId)
    if (order.user_id != userId) {
      return this._fail(ctx, '无效数据')
    }

    ctx.ret.data = {
      info: order
    }

    return ctx.ret
  }

  /**
   * 取消订单
   */
  async orderCancel(ctx) {
    this.logger.info(ctx.uuid, 'orderCancel()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let orderId = ctx.body.order_id

    let mallModel = new this.models.mall_model
    let orderModel = mallModel.orderModel()
    let userModel = new this.models.user_model
    let t = await mallModel.getTrans()

    try {
      let order = await orderModel.findByPk(orderId)
      if (order.user_id != userId) {
        throw new Error('无效数据')
      }

      // 判断是否可以取消
      if (order.status != 0) {
        throw new Error('已支付订单无法取消')
      }

      // 更新用户信息
      let userInfo = await userModel.getInfoByUserId(userId)
      userInfo.balance = userInfo.balance + order.balance
      userInfo.score = userInfo.score + order.score
      let userInfoRet = await userInfo.save({
        transaction: t
      })
      if (!userInfoRet) {
        throw new Error('更新用户信息失败')
      }

      let ecardId = order.ecard_id
      let userEcard = await userModel.ecardModel().findByPk(ecardId)
      userEcard.amount = userEcard.amount + order.ecard
      let userEcardRet = await userEcard.save({
        transaction: t
      })
      if (!userEcardRet) {
        throw new Error('更新用户e卡失败')
      }
      // 更新商品库存

      let items = order.goods_items
      for (let index = 0; index < items.length; index++) {
        let item = items[index]
        let goods = await mallModel.goodsModel().findByPk(item.good_id)
        if (goods.stock != -1) {
          goods.stock = goods.stock + item.num
          let goodsRet = await goods.save({
            transaction: t
          })
          if (!goodsRet) {
            throw new Error('更新商品库存失败')
          }
        }
      }

      t.commit()
    } catch (err) {
      t.rollback()
      return this._fail(ctx, err.message)
    }

    return ctx.ret

  }

  /**
   * 完成订单（确认收货)
   */
  async orderComplete(ctx) {

    this.logger.info(ctx.uuid, 'orderComplete()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let orderId = ctx.body.order_id

    let mallModel = new this.models.mall_model
    let orderModel = mallModel.orderModel()

    let order = await orderModel.findByPk(orderId)
    if (order.user_id != userId && order.status != 2) {
      return this._fail(ctx, '订单错误')
    }

    order.status = 3
    await order.save()

    return ctx.ret
  }

  /**
   * 评价
   */
  async orderRate(ctx) {
    this.logger.info(ctx.uuid, 'orderRate()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let orderId = ctx.body.order_id

    let mallModel = new this.models.mall_model
    let orderModel = mallModel.orderModel()

    let order = await orderModel.findByPk(orderId)
    if (order.user_id != userId && order.status != 3) {
      return this._fail(ctx, '订单错误')
    }

    let t = await mallModel.getTrans()
    try {
      let orderReteModel = mallModel.orderRateModel()

      let orderRate = await orderReteModel.create({
        user_id: userId,
        order_id: orderId,
        goods_id: 0,
        level: ctx.body.level,
        info: ctx.body.info
      })
      if (!orderRate) {
        throw new Error('保存订单评价失败')
      }

      let items = ctx.body.items
      for (let index = 0; index < items.length; index++) {
        const item = items[index]
        let orderRate = await orderReteModel.create({
          user_id: userId,
          order_id: orderId,
          goods_id: item.goods_id,
          level: item.level,
          info: item.info
        })
        if (!orderRate) {
          throw new Error('保存商品评价失败')
        }
      }
      t.commit()
    } catch (err) {
      t.rollback()
      return this._fail(ctx, err.message)
    }

    return ctx.ret

  }

  /**
   * 申请售后
   * @param {*} ctx 
   */
  async orderAfter(ctx) {
    this.logger.info(ctx.uuid, 'orderAfter()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let orderId = ctx.body.order_id
    let goodsId = ctx.body.goods_id

    let mallModel = new this.models.mall_model
    let orderModel = mallModel.orderModel()

    let order = await orderModel.findByPk(orderId)
    if (order.user_id != userId && order.status != 3) {
      return this._fail(ctx, '订单错误')
    }

    let orderAfterModel = mallModel.orderAfterModel()

    let orderAfter = await orderAfterModel.create({
      user_id: userId,
      order_id: orderId,
      goods_id: goodsId,
      imgs: ctx.body.imgs,
      info: ctx.body.info,
      name: ctx.body.name,
      mobile: ctx.body.mobile,
      type: ctx.body.type || 1,
      order_status: ctx.body.status || 3
    })
    if (!orderAfter) {
      return this._fail(ctx, '保存数据失败')
    }

    return ctx.ret

  }

  /**
   * 售后列表
   * @param {*} ctx 
   */
  async orderAfterList(ctx) {
    this.logger.info(ctx.uuid, 'orderAfterList()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10

    let mallModel = new this.models.mall_model

    let orderAfterModel = mallModel.orderAfterModel()

    let queryRet = await orderAfterModel.findAndCountAll({
      where: {
        user_id: userId
      },
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['update_time', 'desc']
      ],
    })

    ctx.ret.data = {
      rows: queryRet.rows || [],
      count: queryRet.count || 0,
      page: page,
      limit: limit
    }
    this.logger.info(ctx.uuid, 'orderAfterList()', 'ret', ctx.ret)

    return ctx.ret
  }
}

module.exports = MallController