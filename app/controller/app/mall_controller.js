const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op

class MallController extends Controller {

  async _init_(ctx) {
    let userModel = new this.models.user_model
    await userModel.checkAuth(ctx)

    console.log('ctx.body.user_id=============', ctx.body.user_id)
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

    let orderDatas = ctx.body.orders
    let useScore = ctx.body.score || 0 // 是否使用积分
    let address = ctx.body.address
    let invoice = ctx.body.invoice
    let remark = ctx.body.remark || ''

    let mallModel = new this.models.mall_model
    let goodsModel = mallModel.goodsModel()
    let userModel = new this.models.user_model
    let userInfo = await userModel.getInfoByUserId(userId)

    // 是否是vip不信任前端传递
    let isVip = await userModel.isVip(userId)
    let orderIds = []
    let totals = 0

    let t = await mallModel.getTrans()
    try {

      for (let index = 0; index < orderDatas.length; index++) {
        let orderItem = orderDatas[index]
        let items = orderItem.items
        let orderType = orderItem.order_type || 1 // 1:自营 2:京东

        let goodsIds = []
        let goodsItems = []
        let total = 0 // 订单金额
        let totalVip = 0
        let score = 0 // 积分金额
        let scoreVip = 0

        for (let index = 0; index < items.length; index++) {
          let item = items[index]
          this.logger.info(ctx.uuid, 'orderCreate() item', item)
          let num = item.num
          // let totalFee = 0
          let goods = await goodsModel.findByPk(item.id)
          this.logger.info(ctx.uuid, 'orderCreate() goods', goods)
          if (!goods || goods.status != 1) {
            throw new Error(`${item.title}已下架`)
          }

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

          total += goods.price_sell * num
          totalVip += goods.price_vip * num
          score += goods.price_score_sell * num
          scoreVip += goods.price_score_vip * num

          goodsIds.push(item.id)
          goodsItems.push(item)

        }

        // 
        let scoreCost = isVip ? scoreVip : score
        if (scoreCost > userInfo.score) {
          throw new Error('积分不足')
        }

        this.logger.info(ctx.uuid, 'orderCreate() goodsItems', goodsItems)
        let orderData = {
          user_id: userId,
          goods_ids: '-' + goodsIds.join('-') + '-',
          order_type: orderType,
          goods_items: goodsItems,
          total: total,
          total_vip: totalVip,
          score: score,
          score_vip: scoreVip,
          address: address,
          invoice: invoice,
          remark: remark,
          vip: isVip,
          score_use: useScore ? 1 : 0
        }

        orderData.order_no = this._createOrderNo(ctx)
        orderData.status = 0
        let order = await mallModel.orderModel().create(orderData, {
          transaction: t
        })
        if (!order) {
          throw new Error('创建订单失败')
        }

        orderIds.push(order.id)
        totals += isVip ? (useScore ? totalVip : totalVip + scoreVip) : (useScore ? total : total + score)
      }

      ctx.ret.data = {
        ids: orderIds,
        totals: totals
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

  /**
   * 记录orderItems
   * @param {*} ctx 
   * @param {*} orderId 
   * @param {*} t 
   */
  async _creareOrderItems(ctx, order, t = null) {
    // let mallModel = new this.models.mall_model
    // this.logger.info(ctx.uuid, '_creareOrderItems orderId', orderId)
    // let order = await mallModel.orderModel().findByPk(orderId)
    // this.logger.info(ctx.uuid, '_creareOrderItems order', order)
    let items = order.goods_items

    try {
      for (let index = 0; index < items.length; index++) {
        const item = items[index]
        let rabateRet = await this._creareOrderItem(ctx, order, item, t)
        if (rabateRet.code != 0) {
          throw new Error('记录订单商品错误')
        }
      }

      // let opts = {}
      // if (t) {
      //   opts.transaction = t
      // }
      // order.rabate = 1
      // let orderRet = await order.save(opts)
      // if (!orderRet) {
      //   throw new Error('订单返利记录错误')
      // }

    } catch (err) {
      ctx.ret.code = 1
      ctx.ret.message = err.message
    }

    return ctx.ret
  }

  /**
   * 记录订单商品
   * @param {*} ctx 
   * @param {*} order 
   * @param {*} item 
   * @param {*} t 
   */
  async _creareOrderItem(ctx, order, item, t = null) {

    let userId = ctx.body.user_id
    let userModel = new this.models.user_model
    let shareModel = new this.models.share_model
    let postsModel = new this.models.posts_model
    let mallModel = new this.models.mall_model
    let orderItemModel = mallModel.orderItemModel()
    let user = await userModel.model().findByPk(userId)

    let numRabate = order.vip ? item.price_vip - item.price_cost : item.price_sell - item.price_cost

    // 记录返利
    let inviteUserId = 0
    let shareUserId = 0
    let postUserId = 0
    let numRabateShare = 0
    let numRabatePost = 0
    let numRabateInvite = 0

    if (user.pid) {
      // 邀请人
      let inviteUser = await userModel.getInviteUser(user.pid)
      if (inviteUser) {
        inviteUserId = 0
      }
    }

    let shareId = item.share_id || 0
    if (shareId) {
      let share = await shareModel.model().findByPk(shareId)
      shareUserId = share ? share.user_id : 0
      let sharePostId = share ? share.post_id : 0
      if (sharePostId) {
        let post = await postsModel.model().findByPk(share.post_id)
        postUserId = post ? post.user_id : 0
      }
    }

    let postId = item.post_id || 0
    if (postId) {
      let post = await postsModel.model().findByPk(postId)
      postUserId = post ? post.user_id : 0
    }

    if (!shareUserId && !postUserId) {
      // 商城直接购买
      if (inviteUserId) {
        numRabateInvite = numRabate
      }

    } else {
      if (shareUserId && !postUserId) {
        // 分享直接购买
        numRabatePost = numRabate * 70 / 100
        if (inviteUserId) {
          numRabateInvite = numRabate * 30 / 100
        }
      } else if (!shareUserId && postUserId) {
        // 评测购买
        numRabateShare = numRabate * 50 / 100
        if (inviteUserId) {
          numRabateInvite = numRabate * 50 / 100
        }
      } else {
        // 评测分享
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
    let data = {
      user_id: userId,
      order_id: order.id,
      goods_id: item.goods_id,
      num_rabate: numRabate,
      num_rabate_share: numRabateShare,
      num_rabate_post: numRabatePost,
      num_rabate_invite: numRabateInvite
    }
    this.logger.info(ctx.uuid, '_creareOrderItem', data)
    let orderItem = await orderItemModel.create(data, opts)

    if (!orderItem) {
      ctx.ret.code = 1
      ctx.ret.message = ''
    }

    return ctx.ret

  }

  /**
   * 订单确认，不需要在线支付的直接成功
   */
  orderConfirm() {

  }

  async _payThirdUnifiedorder(ctx) {

    // TODO
    ctx.ret.data = {
      info: {}
    }
    return ctx.ret
  }
  /**
   * 支付下单
   */
  async orderPayPre(ctx) {

    this.logger.info(ctx.uuid, 'orderPayPre() body', ctx.body)
    let userId = ctx.body.user_id
    let orderIds = ctx.body.order_ids
    let payMethod = ctx.body.pay_method
    let payType = ctx.body.pay_type || 1 // 1：Eka 2：账户余额 3：在线支付

    if (!orderIds.length) {
      return this._fail(ctx, '订单错误')
    }

    let ecardId = ctx.body.ecard_id || 0
    if (payType == 1 && ecardId == 0) {
      return this._fail(ctx, '请选择代金券')
    }

    let userModel = new this.models.user_model
    let mallModel = new this.models.mall_model
    let orderModel = mallModel.orderModel()
    let paymentModel = mallModel.paymentModel()

    let t = await mallModel.getTrans()
    try {

      let isVip = await userModel.isVip(userId)
      let userInfo = await userModel.getInfoByUserId(userId)
      let userBalance = userInfo.balance

      let total = 0 // 总金额
      let scoreNum = 0
      for (let index = 0; index < orderIds.length; index++) {
        let orderId = orderIds[index]
        let order = await orderModel.findByPk(orderId)

        // 
        if (order.status != 0) {
          throw new Error('订单已支付')
        }

        let scoreUse = order.score_use

        let totalFee = isVip ? order.total_vip : order.total
        let score = isVip ? order.score_vip : order.score

        total += scoreUse ? totalFee : totalFee + score
        scoreNum += scoreUse ? score * 1000 : 0
      }

      let amount = 0
      let balance = 0
      let ecard = 0
      let info = {}
      let paymentUuid = this.utils.uuid_utils.v4()

      if (payType == 1) {
        // ecard
        let userEcard = await userModel.ecardModel().findByPk(ecardId)
        if (userEcard.amount < total) {
          // 用余额补
          if (payMethod == 'ecard') {
            throw new Error('请选择代金券补齐方式')
          }

          if (payMethod == 'balance') {
            balance = total - userEcard.amount
            if (balance > userBalance) {
              throw new Error('账户余额不足')
            }
          } else if (payMethod == 'wx' || payMethod == 'alipay') {
            amount = total - userEcard.amount
          }

          ecard = userEcard.amount
        }
      } else if (payType == 2) {
        // 余额支付
        balance = total
        if (balance > userBalance) {
          throw new Error('账户余额不足')
        }
      } else if (payType == 3) {
        amount = total
      }

      if (amount > 0) {
        // 去3方支付下单
        let payThirdRet = await this._payThirdUnifiedorder(ctx, payMethod, paymentUuid)
        if (payThirdRet.code != 0) {
          throw new Error(payThirdRet.message)
        }

        info = payThirdRet.data.info
      }

      // 生成payment
      let payment = await paymentModel.create({
        user_id: userId,
        order_ids: '-' + orderIds.join('-') + '-',
        pay_type: payType,
        pay_method: payMethod,
        amount: amount,
        balance: balance,
        ecard: ecard,
        ecard_id: ecardId,
        score: scoreNum,
        info: info,
        uuid: paymentUuid
      })

      if (!payment) {
        throw new Error('生成支付记录失败')
      }

      ctx.ret.data = {
        id: payment.id,
        uuid: payment.uuid,
        type: payType,
        method: payMethod,
        info: info, // 第三方下单数据
        amount: amount

      }

      t.commit()

    } catch (err) {

      t.rollback()
      return this._fail(ctx, err.message)
    }

    return ctx.ret

  }

  /**
   * 确认支付(前端回调确认支付)
   */
  async orderPayConfirm(ctx) {

    let userId = ctx.body.user_id
    let paymentId = ctx.body.payment_id

    // ecard支付，余额支付必须使用密码
    let password = ctx.body.password || ''

    let mallModel = new this.models.mall_model
    let orderModel = mallModel.orderModel()
    let paymentModel = mallModel.paymentModel()
    // let orderItemsModel = mallModel.orderItemModel()
    let userModel = new this.models.user_model

    let t = await mallModel.getTrans()

    try {

      let payment = await paymentModel.findByPk(paymentId)

      let payType = payment.pay_type
      let payMethod = payment.pay_method

      // 验证密码
      if ([1, 2].indexOf(payType) > -1 && ['wx', 'alipay'].indexOf(payMethod) < 0) {
        // 使用e卡或者余额支付，不用在线支付补，要验证密码
        let user = await userModel.model().findByPk(userId)
        let userTradePassword = user.password_trade
        if (!userTradePassword) {
          throw new Error('请先设置支付密码')
        }

        password = this.utils.crypto_utils.hmacMd5(password)
        if (password != userTradePassword) {
          throw new Error('请输入正确的支付密码')
        }
      }

      if (payment.balance) {
        // 更新用户信息
        let userInfo = await userModel.getInfoByUserId(userId)
        userInfo.balance = userInfo.balance - payment.balance
        userInfo.score = userInfo.score - payment.score
        let userInfoRet = await userInfo.save({
          transaction: t
        })
        if (!userInfoRet) {
          throw new Error('更新用户信息失败')
        }

      }

      if (payment.ecard) {
        let ecardId = payment.ecard_id
        let userEcard = await userModel.ecardModel().findByPk(ecardId)
        let amount = userEcard.amount - payment.ecard
        userEcard.amount = amount
        userEcard.status = amount ? 1 : 0
        let userEcardRet = await userEcard.save({
          transaction: t
        })
        if (!userEcardRet) {
          throw new Error('更新用户e卡失败')
        }
      }


      let orderIds = payment.order_ids.substr(1, payment.order_ids.length - 2).split('-')

      for (let index = 0; index < orderIds.length; index++) {
        const orderId = orderIds[index]

        let order = await orderModel.findByPk(orderId)
        // let items = order.goods_items
        // 这里不计算返利，记录返利，7天后结算 TODO
        let rabateRet = await this._creareOrderItems(ctx, order, t)
        // let rabateRet = await this._rabate(ctx, items, t)
        if (rabateRet.code != 0) {
          throw new Error(rabateRet.message)
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
    // let userModel = new this.models.user_model
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

      order.status = -1
      let updateRet = await order.save({
        transaction: t
      })
      if (!updateRet) {
        throw new Error('更新订单信息失败')
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