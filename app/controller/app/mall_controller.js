// const Controller = require('./../../../lib/controller')
const CommonController = require('./../../common/common_controller')
const Op = require('sequelize').Op
const jdUtils = require('../../utils/jd_utils')

class MallController extends CommonController {

  async _init_(ctx) {

    // console.log('ctx.body.token=============', ctx.token)
    // if (ctx.token) {
    //   let userModel = new this.models.user_model
    //   await userModel.checkAuth(ctx)
    // }

    // console.log('ctx.body.user_id=============', ctx.body.user_id)
    // if (!ctx.body.user_id) {
    //   let unLimitRoutes = ['goodsList', 'goodsInfo', 'categorys']
    //   if (unLimitRoutes.indexOf(ctx.route.action) < 0) {
    //     ctx.ret.code = -100
    //     ctx.ret.message = '请先登录进行操作'
    //     return ctx.ret
    //   }
    // }

    let needCheckToken = true
    let unLimitRoutes = ['goodsList', 'goodsInfo', 'categorys']
    if (unLimitRoutes.indexOf(ctx.route.action) > -1) {
      needCheckToken = false
    }

    console.log('ctx.body.token=============', ctx.token)
    if (needCheckToken || ctx.token) {
      let userModel = new this.models.user_model
      let checkRet = await userModel.checkAuth(ctx)
      if (checkRet.code !== 0) {
        return this._fail(ctx, checkRet.message, checkRet.code)
      }
    } else {
      console.log(ctx.uuid, 'ctx.body.user_id=============', ctx.body.user_id)
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
      categorys = [{
        id: 'all',
        name: '全部'
      }]
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

    let timestamp = ctx.body.timestamp || parseInt(Date.now() / 1000)
    let search = ctx.body.search || ''
    let type = ctx.body.type || 1 // 分类
    let category = ctx.body.category || ''
    let order = ctx.body.order || null

    // 激动隐藏
    if (type == 2){
      ctx.ret.data = {
        rows: [],
        count: 0,
        page: page,
        limit: limit,
        newCount: 0,
        timestamp: timestamp
      }
      return ctx.ret
    }

    if (category === 'all') {
      category = ''
    }
    let isShare = ctx.body.is_share

    let where = {}

    where.status = 1
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
    if (isShare) {
      where.is_share = isShare
    }
    this.logger.info(ctx.uuid, 'goodsList()', 'where', where)

    let orderBy = []
    if (order) {
      if (order.name == 'default') {
        orderBy = ['update_time', order.type]
      } else if (order.name == 'price') {
        orderBy = ['price_sell', order.type]
      } else if (order.name == 'sales') {
        orderBy = ['sales', order.type]
      }
    }

    if (orderBy.length == 0) {
      orderBy = ['create_time', 'desc']
    }
    let mallModel = new this.models.mall_model
    let goodsModel = mallModel.goodsModel()
    let queryRet = await goodsModel.findAndCountAll({
      where: where,
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        orderBy,
        ['id', 'desc']
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
      newCount: newCount,
      timestamp: timestamp
    }
    this.logger.info(ctx.uuid, 'goodsList()', 'ret', ctx.ret)

    return ctx.ret
  }

  /**
   * 商品评价列表 TODO 换表
   * @param {*} ctx 
   */
  async goodsRateList(ctx) {
    // this.logger.info(ctx.uuid, 'goodsRateList()', 'body', ctx.body, 'query', ctx.query)

    // let page = ctx.body.page || 1
    // let limit = ctx.body.limit || 10

    // let goodsId = ctx.body.goods_id

    // let where = {}
    // where.goods_id = goodsId
    // this.logger.info(ctx.uuid, 'goodsRateList()', 'where', where)

    // let mallModel = new this.models.mall_model
    // let orderRateModel = mallModel.orderRateModel()
    // let queryRet = await orderRateModel.findAndCountAll({
    //   where: where,
    //   offset: (page - 1) * limit,
    //   limit: limit,
    //   order: [
    //     ['update_time', 'desc']
    //   ]
    // })

    // ctx.ret.data = {
    //   rows: queryRet.rows || [],
    //   count: queryRet.count || 0,
    //   page: page,
    //   limit: limit
    // }
    // this.logger.info(ctx.uuid, 'goodsRateList()', 'ret', ctx.ret)

    // return ctx.ret
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

    let info = await goodsModel.findByPk(goodsId)

    this.logger.info(ctx.uuid, 'goodsInfo()', 'info', info.id)
    // 收藏
    let userId = ctx.body.user_id
    if (userId) {
      let userModel = new this.models.user_model
      let isCollect = await userModel.isCollectGoods(userId, info.id)
      info.dataValues.isCollection = isCollect
    } else {
      info.dataValues.isCollection = -1
    }

    this.logger.info(ctx.uuid, 'goodsInfo()', 'info', info)

    // info.content = info.content.replace(/&amp;/g, '&')
    const regex = new RegExp('<img', 'gi')
    info.content = info.content.replace(regex, `<img style="max-width: 100%;"`)


    // 分享积分
    let shareId = ctx.body.share_id || 0
    this.logger.info(ctx.uuid, 'info()', 'shareId', shareId)
    if (shareId > 0) {
      // 
      let shareModel = new this.models.share_model
      let shareInfo = await shareModel.model().findByPk(shareId)
      this.logger.info(ctx.uuid, 'info()', 'shareInfo', shareInfo)
      if (shareInfo) {
        let shareUserId = shareInfo.user_id
        this.logger.info(ctx.uuid, 'info()', 'shareUserId', shareUserId)
        let taskModel = new this.models.task_model
        let t = await mallModel.getTrans()
        let taskData = {
          user_id: shareUserId,
          model_id: shareId,
          ip: ctx.ip
        }
        taskModel.logByName(ctx, 'user_share', taskData, t).then(ret => {
          this.logger.info(ctx.uuid, 'info() taskModel.logByName', 'ret', ret)
          if (ret.code === 0) {
            t.commit()
          } else {
            t.rollback()
          }
        })
      }

    }

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
    let expressFee = ctx.body.express_fee || 0.00 // 京东运费

    let mallModel = new this.models.mall_model
    let goodsModel = mallModel.goodsModel()
    let userModel = new this.models.user_model
    let userInfo = await userModel.getInfoByUserId(userId)

    // 是否是vip不信任前端传递
    let isVip = await userModel.isVip(userId)
    let orderIds = []
    let totals = 0.00

    let t = await mallModel.getTrans()
    try {

      for (let index = 0; index < orderDatas.length; index++) {
        let orderItem = orderDatas[index]
        let items = orderItem.items
        let orderType = orderItem.hasOwnProperty('order_type') ? orderItem.order_type : 1 // 1:自营 2:京东

        let goodsIds = []
        let goodsItems = []
        let total = 0.00 // 订单金额
        let totalVip = 0.00
        let score = 0.00 // 积分金额
        let scoreVip = 0.00

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
          if (goods.stock != -1) {
            if (num > goods.stock) {
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
          }


          total += parseFloat(goods.price_sell * num)
          totalVip += parseFloat(goods.price_vip * num)
          score += parseFloat(goods.price_score_sell * num)
          scoreVip += parseFloat(goods.price_score_vip * num)

          goodsIds.push(item.id)
          goodsItems.push(item)

        }
        this.logger.info(ctx.uuid, 'orderCreate()', 'total', total)
        this.logger.info(ctx.uuid, 'orderCreate()', 'totalVip', totalVip)
        this.logger.info(ctx.uuid, 'orderCreate()', 'score', score)
        this.logger.info(ctx.uuid, 'orderCreate()', 'scoreVip', scoreVip)

        // 
        let scoreCost = isVip ? scoreVip : score
        if (useScore) {
          if (scoreCost > userInfo.score || userInfo.score <= 0) {
            throw new Error('积分不足')
          }
        }

        // 更新用户积分
        if (useScore) {
          userInfo.score = userInfo.score - scoreCost * this.config.scoreExchangeNum
          let scoreSaveRet = await userInfo.save({
            transaction: t
          })
          if (!scoreSaveRet) {
            throw new Error('更新积分信息失败')
          }
        }

        expressFee = parseFloat(expressFee)
        this.logger.info(ctx.uuid, 'orderCreate()', 'expressFee', expressFee)

        if (orderType == 2) {
          total += expressFee
          totalVip += expressFee
        }


        total = parseFloat(total).toFixed(2)
        totalVip = parseFloat(totalVip).toFixed(2)
        score = parseFloat(score).toFixed(2)
        scoreVip = parseFloat(scoreVip).toFixed(2)
        this.logger.info(ctx.uuid, 'orderCreate()', 'total', total)
        this.logger.info(ctx.uuid, 'orderCreate()', 'totalVip', totalVip)
        this.logger.info(ctx.uuid, 'orderCreate()', 'score', score)
        this.logger.info(ctx.uuid, 'orderCreate()', 'scoreVip', scoreVip)


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
          vip: isVip ? 1 :0,
          score_use: useScore ? 1 : 0,
          express_fee: (orderType == 2) ? expressFee : 0
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
        total = parseFloat(total)
        totalVip = parseFloat(totalVip)
        score = parseFloat(score)
        scoreVip = parseFloat(scoreVip)
        totals += isVip ? (useScore ? totalVip : (totalVip + scoreVip)) : (useScore ? total : (total + score))
      }

      totals = parseFloat(totals).toFixed(2)
      this.logger.info(ctx.uuid, 'orderCreate()', 'totals', totals)
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

    let items = order.goods_items

    try {
      for (let index = 0; index < items.length; index++) {
        const item = items[index]
        let rabateRet = await this._creareOrderItem(ctx, order, item, t)
        if (rabateRet.code != 0) {
          throw new Error('记录订单商品错误')
        }
      }
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
    // item.price_cost = 90
    this.logger.info(ctx.uuid, '_creareOrderItem order', order)
    this.logger.info(ctx.uuid, '_creareOrderItem item', item)

    let userId = ctx.body.user_id
    let userModel = new this.models.user_model
    let shareModel = new this.models.share_model
    let postsModel = new this.models.posts_model
    let mallModel = new this.models.mall_model
    let orderItemModel = mallModel.orderItemModel()
    let goodsModel = mallModel.goodsModel()

    let user = await userModel.model().findByPk(userId)
    let goods = await goodsModel.findByPk(item.id)

    let rateRabate = order.vip ? goods.rabate_rate_vip : goods.rabate_rate
    let profit = order.vip ? (item.price_vip - item.price_cost) : (item.price_sell - item.price_cost)
    // let profit = numRabate
    let numRabate = profit * rateRabate / 100
    this.logger.info(ctx.uuid, '_creareOrderItem profit', profit)
    this.logger.info(ctx.uuid, '_creareOrderItem rateRabate', rateRabate)
    this.logger.info(ctx.uuid, '_creareOrderItem numRabate', numRabate)

    // 记录返利
    let inviteUserId = 0
    let shareUserId = 0
    let postUserId = 0
    let numRabateShare = 0
    let numRabatePost = 0
    let numRabateInvite = 0
    let profitOver = 0

    if (user.pid) {
      // 邀请人
      let inviteUser = await userModel.getInviteUser(user.pid)
      if (!inviteUser) {
        inviteUserId = 0
      } else {
        inviteUserId = user.pid
      }
    } else {
      inviteUserId = 0
    }
    this.logger.info(ctx.uuid, '_creareOrderItem inviteUserId', inviteUserId)

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
    this.logger.info(ctx.uuid, '_creareOrderItem shareUserId', shareUserId)
    this.logger.info(ctx.uuid, '_creareOrderItem postUserId', postUserId)

    let postId = item.post_id || 0
    if (postId) {
      let post = await postsModel.model().findByPk(postId)
      postUserId = post ? post.user_id : 0
    }
    this.logger.info(ctx.uuid, '_creareOrderItem postUserId', postUserId)

    if (!shareUserId && !postUserId) {
      // 商城直接购买
      if (inviteUserId) {
        numRabateInvite = numRabate
      }
      this.logger.info(ctx.uuid, '_creareOrderItem inviteUserId', inviteUserId)

    } else {
      if (shareUserId && !postUserId) {
        // 分享直接购买
        numRabateShare = numRabate * 70 / 100
        if (inviteUserId) {
          numRabateInvite = numRabate * 30 / 100
        }

        this.logger.info(ctx.uuid, '_creareOrderItem numRabatePost', numRabatePost)
        this.logger.info(ctx.uuid, '_creareOrderItem numRabateInvite', numRabateInvite)
      } else if (!shareUserId && postUserId) {
        // 评测购买
        numRabatePost = numRabate * 50 / 100
        if (inviteUserId) {
          numRabateInvite = numRabate * 50 / 100
        }

        this.logger.info(ctx.uuid, '_creareOrderItem numRabatePost', numRabatePost)
        this.logger.info(ctx.uuid, '_creareOrderItem numRabateShare', numRabateShare)
      } else {
        // 评测分享
        numRabatePost = numRabate * 30 / 100
        numRabateShare = numRabate * 40 / 100
        if (inviteUserId) {
          numRabateInvite = numRabate * 30 / 100
        }

        this.logger.info(ctx.uuid, '_creareOrderItem numRabatePost', numRabatePost)
        this.logger.info(ctx.uuid, '_creareOrderItem numRabateInvite', numRabateInvite)
        this.logger.info(ctx.uuid, '_creareOrderItem numRabateShare', numRabateShare)
      }

    }

    profitOver = profit - numRabatePost - numRabateInvite - numRabateShare

    profitOver = parseFloat(profitOver).toFixed(2)
    numRabatePost = parseFloat(numRabatePost).toFixed(2)
    numRabateInvite = parseFloat(numRabateInvite).toFixed(2)
    numRabateShare = parseFloat(numRabateShare).toFixed(2)

    this.logger.info(ctx.uuid, '_creareOrderItem profitOver', profitOver)
    this.logger.info(ctx.uuid, '_creareOrderItem numRabatePost', numRabatePost)
    this.logger.info(ctx.uuid, '_creareOrderItem numRabateInvite', numRabateInvite)
    this.logger.info(ctx.uuid, '_creareOrderItem numRabateShare', numRabateShare)

    let opts = {}
    if (t) {
      opts.transaction = t
    }
    let goodsAmount = 0
    if (order.vip) {
      goodsAmount = order.score_use ? order.total_vip : (order.total_vip + order.score_vip)
    } else {
      goodsAmount = order.score_use ? order.total : (order.total + order.score)
    }
    goodsAmount = parseFloat(goodsAmount).toFixed(2)
    this.logger.info(ctx.uuid, '_creareOrderItem goodsAmount', goodsAmount)

    let data = {
      user_id: userId,
      order_id: order.id,
      goods_id: item.id,
      num_rabate: numRabate,
      num_rabate_share: numRabateShare,
      num_rabate_post: numRabatePost,
      num_rabate_invite: numRabateInvite,
      share_user_id: shareUserId,
      post_user_id: postUserId,
      invite_user_id: inviteUserId,
      goods_title: item.title,
      goods_cover: item.cover,
      goods_amount: goodsAmount,
      profit: profit,
      profit_over: profitOver
    }
    this.logger.info(ctx.uuid, '_creareOrderItem', data)
    let orderItem = await orderItemModel.create(data, opts)

    if (!orderItem) {
      ctx.ret.code = 1
      ctx.ret.message = ''
    }

    return ctx.ret

  }

  async _payThirdUnifiedorder(ctx, method, paymentData, isMpWx = 0, openid = '') {

    // TODO
    if (method == 'alipay') {
      this.logger.info(ctx.uuid, '_payThirdUnifiedorder alipay')
      let outTradeNo = paymentData.out_trade_no
      let amount = paymentData.amount
      let body = paymentData.body
      let subject = paymentData.subject
      this.logger.info(ctx.uuid, '_payThirdUnifiedorder alipay', outTradeNo, amount, body, subject)
      let info = await this.utils.alipay_utils.appPay(outTradeNo, amount, body, subject)
      this.logger.info(ctx.uuid, '_payThirdUnifiedorder info', info)
      ctx.ret.data = {
        info: info
      }
      return ctx.ret
    } else if (method == 'wxpay') {
      let body = paymentData.body
      let outTradeNo = paymentData.out_trade_no
      let totalFee = paymentData.amount * 100
      let paymentType = 'APP'
      if (isMpWx) {
        paymentType = 'JSAPI'
        if (!openid) {
          ctx.ret.code = 1
          ctx.ret.message = '无效的openid'
          return ctx.ret
        }
      }

      let unifiedOrderRet = await this.utils.wxpay_utils.unifiedOrder(body, outTradeNo, totalFee, ctx.ip, paymentType, openid)

      if (unifiedOrderRet.code != 0) {
        ctx.ret.code = unifiedOrderRet.code
        ctx.ret.message = unifiedOrderRet.message

        return ctx.ret
      }

      let prepayId = unifiedOrderRet.data.prepay_id
      let info = this.utils.wxpay_utils.getPayInfo(prepayId, isMpWx)
      ctx.ret.data = {
        info: info
      }
      return ctx.ret
    } else {
      ctx.ret.code = 1
      ctx.ret.message = '不支持的支付方式'
      return ctx.ret
    }

    // return ctx.ret
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
    let isMpWx = ctx.body.is_mp_wx || 0

    let orderIdsStr = '-' + orderIds.join('-') + '-'
    let paymentUuid = this.utils.uuid_utils.v4()

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

      // 查找是否存在相同订单
      let payment = await paymentModel.findOne({
        where: {
          order_ids: orderIdsStr
        }
      })

      if (payment) {
        if (payment.status == 1) {
          throw new Error('账单错误:存在相同已支付订单')
        }
        if (payment.user_id != userId) {
          throw new Error('账单错误')
        }

        paymentUuid = payment.uuid
      }

      let isVip = await userModel.isVip(userId)
      let userInfo = await userModel.getInfoByUserId(userId)
      let userBalance = userInfo.balance
      let openid = await userModel.getMiniOpenIdByUserId(userId)

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
        this.logger.info(ctx.uuid, 'orderPayPre totalFee', totalFee)
        total += scoreUse ? totalFee : totalFee + score
        scoreNum += scoreUse ? score * this.config.scoreExchangeNum : 0
      }

      total = parseFloat(total)
      this.logger.info(ctx.uuid, 'orderPayPre total', total)

      let amount = 0
      let balance = 0
      let ecard = 0
      let info = {}

      if (payType == 1) {
        // ecard
        let userEcard = await userModel.ecardModel().findByPk(ecardId)
        if (userEcard.amount < total) {
          // 用余额补
          if (payMethod == 'ecard') {
            throw new Error('请选择代金券补齐方式')
          } else if (payMethod == 'wxpay' || payMethod == 'alipay') {
            amount = total - userEcard.amount
          } else {
            throw new Error('支付方式选择有误(payType:1)')
          }

          ecard = userEcard.amount
        } else {
          ecard = total // ecard使用金额是订单金额
        }
      } else if (payType == 2) {
        // 余额支付
        if (total > userBalance) {
          // throw new Error('账户余额不足')
          if (payMethod == 'balance') {
            throw new Error('请选择代金券补齐方式')
          } else if (payMethod == 'wxpay' || payMethod == 'alipay') {
            amount = total - userBalance
          } else {
            throw new Error('支付方式选择有误(payType:2)')
          }

          balance = userBalance
        }else {
          balance = total
        }
      } else if (payType == 3) {
        amount = total
      }

      amount = parseFloat(amount).toFixed(2)

      if (amount > 0) {
        // 去3方支付下单
        const DEBUG = this.config.DEBUG
        // amount = 0.01
        let paymentData = {
          out_trade_no: paymentUuid,
          // amount: DEBUG ? 0.01 : amount,
          amount: amount,
          body: '发现焦点-商品支付',
          subject: '发现焦点-订单支付'
        }
        this.logger.info(ctx.uuid, 'orderPayPre()', payMethod, paymentData)
        let payThirdRet = await this._payThirdUnifiedorder(ctx, payMethod, paymentData, isMpWx, openid)
        this.logger.info(ctx.uuid, 'orderPayPre() payThirdRet', payThirdRet)
        if (payThirdRet.code != 0) {
          throw new Error(payThirdRet.message)
        }

        info = payThirdRet.data.info
      }

      if (typeof info !== 'string') {
        info = JSON.stringify(info)
      }

      amount = parseFloat(amount)
      balance = parseFloat(balance)
      ecard = parseFloat(ecard)

      // 生成payment
      let paymentData = {
        user_id: userId,
        order_ids: orderIdsStr,
        pay_type: payType,
        pay_method: payMethod,
        amount: amount,
        balance: balance,
        ecard: ecard,
        ecard_id: ecardId,
        score: scoreNum,
        info: info,
        uuid: paymentUuid
      }
      if (!payment) {
        payment = await paymentModel.create(paymentData)
      } else {
        payment = await payment.update(paymentData)
      }


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
      console.log(err)
      t.rollback()
      return this._fail(ctx, err.message)
    }

    return ctx.ret

  }

  /**
   * 确认支付(前端回调确认支付)
   */
  async orderPayConfirm(ctx) {

    this.logger.info(ctx.uuid, 'orderPayConfirm() body', ctx.body)
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
      let userInfo = await userModel.getInfoByUserId(userId)

      this.logger.info(ctx.uuid, 'orderPayConfirm() payment', payment)
      this.logger.info(ctx.uuid, 'orderPayConfirm() userInfo', userInfo)

      let payType = payment.pay_type
      let payMethod = payment.pay_method

      // 验证密码
      if ([1, 2].indexOf(payType) > -1 && ['wxpay', 'alipay'].indexOf(payMethod) < 0) {
        // 使用e卡或者余额支付，不用在线支付补，要验证密码
        // let user = await userModel.getInfoByUserId(userId)
        let userTradePassword = userInfo.password_trade
        this.logger.info(ctx.uuid, 'orderPayConfirm() userTradePassword', userTradePassword)
        if (!password) {
          throw new Error('请输入支付密码')
        }
        password = this.utils.crypto_utils.hmacMd5(password)
        if (!userTradePassword) {
          // throw new Error('请先设置支付密码')
          userInfo.password_trade = password
        }

        this.logger.info(ctx.uuid, 'orderPayConfirm() password', password)
        this.logger.info(ctx.uuid, 'orderPayConfirm() userInfo.password_trade', userInfo.password_trade)
        if (password != userInfo.password_trade) {
          throw new Error('请输入正确的支付密码')
        }

        // 测试 默认验证通过 , 状态改为已支付
        payment.status = 1
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
        this.logger.info(ctx.uuid, 'orderPayConfirm() userEcardRet', userEcardRet)
        if (!userEcardRet) {
          throw new Error('更新用户代金券信息失败')
        }
      }

      let orderIds = payment.order_ids.substr(1, payment.order_ids.length - 2).split('-')
      this.logger.info(ctx.uuid, 'orderPayConfirm() orderIds', orderIds)

      // 更新用户信息
      userInfo.balance = userInfo.balance - payment.balance
      let userSetVip = 0

      for (let index = 0; index < orderIds.length; index++) {
        const orderId = orderIds[index]
        
        let order = await orderModel.findByPk(orderId)
        if (order.status != 0) {
          throw new Error('请不要重复支付')
        }
        this.logger.info(ctx.uuid, 'orderPayConfirm() order', order.id)
        // let items = order.goods_items
        if (order.order_type != 0) {
          // 这里不计算返利，记录返利，7天后结算 TODO
          let rabateRet = await this._creareOrderItems(ctx, order, t)
          // let rabateRet = await this._rabate(ctx, items, t)
          this.logger.info(ctx.uuid, 'orderPayConfirm() rabateRet', rabateRet)
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

        order.payment = {
          type: payType,
          method: payMethod
        }
        order.status = 1

        this.logger.info(ctx.uuid, 'orderPayConfirm() order.payment', order.payment)
        let orderSaveRet = await order.save({
          transaction: t
        })

        this.logger.info(ctx.uuid, 'orderPayConfirm() orderSaveRet', orderSaveRet)

        if (!orderSaveRet) {
          throw new Error('订单支付信息更新失败')
        }

        let paymentRet = await payment.save({
          transaction: t
        })
        this.logger.info(ctx.uuid, 'orderPayConfirm() paymentRet', paymentRet)
        if (!paymentRet) {
          throw new Error('支付信息更新失败')
        }

        // 更新商品sales
        let goodsUpdateRet = await this._paymentGoodsUpdate(ctx, order, t)
        if (goodsUpdateRet.code !== 0) {
          throw new Error(goodsUpdateRet.message)
        }
      }

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
      this.logger.info(ctx.uuid, 'orderPayConfirm() userInfoRet', userInfoRet)
      if (!userInfoRet) {
        throw new Error('更新用户信息失败')
      }

      // 记录交易信息type 3:商品购买
      let transactionData = {
        balance: payment.balance,
        amount: payment.amount,
        score: payment.score * this.config.scoreExchangeNum,
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
    let status = ctx.body.status || 0

    let where = {}
    where.user_id = userId
    where.status = status
    where.order_type = {
      [Op.gt]: 0
    }
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

    queryRet.rows.forEach(row => {
      row.dataValues.create_date = this.utils.date_utils.dateFormat(row.create_time, 'YYYY-MM-DD HH:mm')
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
    let orderItemsModel = mallModel.orderItemModel()
    let order = await orderModel.findByPk(orderId)
    if (order.user_id != userId) {
      return this._fail(ctx, '无效数据')
    }

    order.dataValues.create_date = this.utils.date_utils.dateFormat(order.create_time, 'YYYY-MM-DD HH:mm')

    let orderItems = await orderItemsModel.findAll({
      where: {
        order_id: order.id
      }
    })
    ctx.ret.data = {
      info: order,
      items: orderItems
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


      // 更新商品库存
      let items = order.goods_items
      for (let index = 0; index < items.length; index++) {
        let item = items[index]
        let goods = await mallModel.goodsModel().findByPk(item.id)
        this.logger.info(ctx.uuid, 'orderInfo()', 'goods', goods, 'item', item)
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

      // 更新用户积分
      if (order.score_use) {
        let scoreCost = order.vip ? order.score_vip : order.score
        let userInfo = await userModel.getInfoByUserId(userId)
        userInfo.score = userInfo.score + scoreCost * this.config.scoreExchangeNum
        let scoreSaveRet = await userInfo.save({
          transaction: t
        })
        if (!scoreSaveRet) {
          throw new Error('更新积分信息失败')
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
   * 延长订单
   */
  async orderCompleteExtend(ctx) {

    this.logger.info(ctx.uuid, 'orderCompleteExtend()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let orderId = ctx.body.order_id

    let mallModel = new this.models.mall_model
    let orderModel = mallModel.orderModel()

    let t = await mallModel.getTrans()

    try {
      let order = await orderModel.findByPk(orderId)
      if (order.user_id != userId && order.status != 2) {
        throw new Error('订单数据错误')
      }

      order.express_extend_num = 1
      let orderRet = await order.save({
        transaction: t
      })
      if(!orderRet){
        throw new Error('延长收货失败')
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
    let orderItemModel = mallModel.orderItemModel()
    let goodsModel = mallModel.goodsModel()

    let t = await mallModel.getTrans()

    try {
      let order = await orderModel.findByPk(orderId)
      if (order.user_id != userId && order.status != 2) {
        throw new Error('订单数据错误')
      }

      let orderDealRet = await this._orderComplete(ctx, order, t)
      if (orderDealRet.code != 0) {
        throw new Error(orderDealRet.message)
      }
      // // 添加 orderRate
      // let items = order.goods_items
      // for (let index = 0; index < items.length; index++) {
      //   let item = items[index]
      //   this.logger.info(ctx.uuid, 'orderComplete()', 'goods_items', item)
      //   let orderItem = await orderItemModel.findOne({
      //     where: {
      //       order_id: orderId,
      //       goods_id: item.id
      //     }
      //   })
      //   this.logger.info(ctx.uuid, 'orderComplete()', 'orderItem', orderItem)
      //   if (orderItem) {
      //     let dayAfter7Time = parseInt(Date.now() / 1000) + 7 * 24 * 3600
      //     orderItem.order_status = 9
      //     orderItem.rabate_date = this.utils.date_utils.dateFormat(dayAfter7Time, 'YYYYMMDD')
      //     let orderItemRet = await orderItem.save({
      //       transaction: t
      //     })

      //     if (!orderItemRet) {
      //       throw new Error('更新订单条目失败')
      //     }
      //   }

      //   // goods发放积分
      //   let goods = await goodsModel.findByPk(item.id)
      //   let rabateScore = goods.rabate_score || 0
      //   this.logger.info(ctx.uuid, 'orderComplete()', 'rabateScore', rabateScore)
      //   if(rabateScore){
      //     let taskModel = new this.models.task_model
      //     let t1 = await mallModel.getTrans()
      //     let taskData = {
      //       user_id: userId,
      //       model_id: item.id,
      //       ip: ctx.ip,
      //       ext_num: rabateScore
      //     }
      //     taskModel.logByName(ctx, 'user_buy_goods', taskData, t1).then(async (ret) => {
      //       this.logger.info(ctx.uuid, 'orderComplete() taskModel.logByName', 'ret', ret)
      //       if (ret.code === 0) {
      //         t1.commit()
      //       } else {
      //         t1.rollback()
      //       }
      //     })
      //   }

      // }

      // order.status = 9
      // order.finish_time = parseInt(Date.now() / 1000)
      // let orderSaveRet = await order.save({
      //   transaction: t
      // })
      // if (!orderSaveRet) {
      //   throw new Error('更新订单信息错误')
      // }

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
  async orderAfterApply(ctx) {
    this.logger.info(ctx.uuid, 'orderAfter()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let orderId = ctx.body.order_id
    let goodsIds = ctx.body.goods_ids
    goodsIds = '-' + goodsIds.join('-') + '-'
    let mallModel = new this.models.mall_model
    let orderModel = mallModel.orderModel()

    let order = await orderModel.findByPk(orderId)
    if (order.user_id != userId && order.status != 3) {
      return this._fail(ctx, '订单错误')
    }

    let afterNo = this._createOrderNo(ctx)
    let orderAfterModel = mallModel.orderAfterModel()

    let find = await orderAfterModel.findOne({
      where: {
        user_id: userId,
        order_id: orderId,
        goods_ids: {
          [Op.like]: '%' + goodsIds + '%'
        },
        status: {
          [Op.in]: [0, 1]
        }
      }
    })
    if (find) {
      return this._fail(ctx, '订单商品已提交过，请不要重复提交')
    }

    let total = 0
    let score = 0
    let items = []

    let goodsItems = order.goods_items
    let afterGoodsIds = goodsIds.substr(1, goodsIds.length - 2).split('-')
    this.logger.info(ctx.uuid, 'orderAfter()', 'afterGoodsIds', afterGoodsIds)
    goodsItems.forEach(item => {
      if (afterGoodsIds.indexOf(item.id.toString()) > -1) {

        let itemTotal = order.vip ? (item.price_vip) : item.price_sell
        this.logger.info(ctx.uuid, 'orderAfter()', 'itemTotal', itemTotal)
        total += itemTotal * item.num
        if (order.score_use) {
          let itemScore = order.vip ? item.price_score_vip : item.price_score_sell
          this.logger.info(ctx.uuid, 'orderAfter()', 'itemScore', itemScore)
          // total += itemScore
          score += itemScore * item.num * this.config.scoreExchangeNum
        }
        items.push(item)
      }

    })

    total = parseFloat(total).toFixed(2)

    this.logger.info(ctx.uuid, 'orderAfter()', 'total', total)
    this.logger.info(ctx.uuid, 'orderAfter()', 'score', score)
    this.logger.info(ctx.uuid, 'orderAfter()', 'items', items)

    let orderAfter = await orderAfterModel.create({
      user_id: userId,
      order_id: orderId,
      goods_ids: goodsIds,
      imgs: ctx.body.imgs,
      info: ctx.body.info,
      type: ctx.body.type || '',
      category: ctx.body.category || '',
      after_no: afterNo,
      total: total,
      score: score,
      items: items
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
    let orderModel = mallModel.orderModel()
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

    let rows = []
    for (let index = 0; index < queryRet.rows.length; index++) {
      const row = queryRet.rows[index]
      let createDate = this.utils.date_utils.dateFormat(row.crate_time, 'YYYY-MM-DD HH:mm')
      row.dataValues.create_date = createDate

      let order = await orderModel.findByPk(row.order_id)
      row.dataValues.order = order

      // let goodsIds = row.goods_ids.substr(1, row.goods_ids.length - 2).split('-')
      // let goodsItems = order.goods_items
      // console.log('goodsIds =================', goodsIds)
      // let items = []
      // goodsItems.forEach(item => {
      //   console.log(item)
      //   if (goodsIds.indexOf(item.id.toString()) > -1) {
      //     items.push(item)
      //   }
      // })

      // row.dataValues.items = items

      rows.push(row)
    }

    ctx.ret.data = {
      rows: rows || [],
      count: queryRet.count || 0,
      page: page,
      limit: limit
    }
    this.logger.info(ctx.uuid, 'orderAfterList()', 'ret', ctx.ret)

    return ctx.ret
  }

  async orderItemList(ctx) {
    this.logger.info(ctx.uuid, 'orderItemList()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10
    let isRate = ctx.body.rate || 0

    let mallModel = new this.models.mall_model
    let orderItemModel = mallModel.orderItemModel()

    let where = {
      user_id: userId
    }

    if (isRate) {
      where.order_status = 9
    }

    let queryRet = await orderItemModel.findAndCountAll({
      where: where,
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ],
    })
    queryRet.rows.forEach(row => {
      row.dataValues.rate_date = this.utils.date_utils.dateFormat(row.rate_time, 'YYYY-MM-DD HH:mm')
      row.dataValues.create_date = this.utils.date_utils.dateFormat(row.create_time, 'YYYY-MM-DD HH:mm')
    })
    ctx.ret.data = {
      rows: queryRet.rows || [],
      count: queryRet.count || 0,
      page: page,
      limit: limit
    }
    this.logger.info(ctx.uuid, 'orderItemList()', 'ret', ctx.ret)

    return ctx.ret
  }

  async orderItemInfo(ctx) {

    this.logger.info(ctx.uuid, 'orderItemList()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    let id = ctx.body.id

    let mallModel = new this.models.mall_model
    let orderItemModel = mallModel.orderItemModel()

    let info = await orderItemModel.findByPk(id)
    this.logger.info(ctx.uuid, 'orderItemList()', 'info', info)
    if (info.user_id != userId) {
      this._fail(ctx, '无效数据')
    }

    ctx.ret.data = {
      info: info
    }

    return ctx.ret

  }

  /**
   * 评价
   */
  async orderRate(ctx) {
    this.logger.info(ctx.uuid, 'orderRate()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let orderItemId = ctx.body.id
    let rateData = ctx.body.rate

    let mallModel = new this.models.mall_model
    let orderItemModel = mallModel.orderItemModel()

    let orderItem = await orderItemModel.findByPk(orderItemId)
    if (orderItem.user_id != userId) {
      return this._fail(ctx, '订单错误')
    }
    if (orderItem.rate_level != 0) {
      return this._fail(ctx, '请不要重复提交')
    }

    let t = await mallModel.getTrans()
    try {

      orderItem.rate_level = rateData.level
      orderItem.rate_info = rateData.info
      orderItem.rate_imgs = rateData.imgs
      orderItem.rate_time = parseInt(Date.now() / 1000)
      let saveRet = await orderItem.save({
        transaction: t
      })
      if (!saveRet) {
        throw new Error('保存评价失败')
      }

      // 评价获得积分
      let taskModel = new this.models.task_model
      let taskData = {
        user_id: userId,
        model_id: orderItem.id,
        ip: ctx.ip
      }
      let score = 0
      let balance = 0
      let taskRet = await taskModel.logByName(ctx, 'order_item_rate', taskData, t)
      if (taskRet.code != 0) {
        throw new Error(taskRet.message)
      } else {
        score = taskRet.data.score || 0
        balance = taskRet.data.balance || 0
      }

      ctx.ret.data = {
        id: orderItem.id,
        score: score,
        balance: balance
      }

      t.commit()
    } catch (err) {
      t.rollback()
      return this._fail(ctx, err.message)
    }

    return ctx.ret

  }

  /**
   * 获取地址
   * @param {string} action
   * @param {int} id
   */
  async getAddress(ctx) {
    let {
      id,
      action
    } = ctx.body
    let data, dataObj
    switch (action) {
      case 'province':
        data = await jdUtils.getProvince()
        break;
      case 'city':
        data = await jdUtils.getCity(id)
        break;
      case 'county':
        data = await jdUtils.getCounty(id)
        break;
      case 'town':
        data = await jdUtils.getTown(id)
        break;
    }
    dataObj = JSON.parse(data)
    if (dataObj.success == true) {
      ctx.ret.data = dataObj.result
    } else {
      ctx.ret.data = {}
    }
    return ctx.ret
  }

  //检查四级地址是否合法，暂无四级地址- -
  async checkArea(ctx) {
    let data, dataObj
    let {
      provinceId,
      cityId,
      countyId,
      townId
    } = ctx.body
    data = await jdUtils.checkArea(provinceId, cityId, countyId, townId)
    dataObj = JSON.parse(data)
    if (dataObj.success == true) {
      ctx.ret.data = dataObj.result
    } else {
      ctx.ret.data = {}
    }
    return ctx.ret
  }


  /**
   * 下单
   * @param {*} ctx
   * 
   */
  static async submitOrder(params) {
    /**
     * {"success":true,"resultMessage":"下单成功！","resultCode":"0001","result":{"jdOrderId":89099122476,"freight":8,"orderPrice":13.30,
     * "orderNakedPrice":11.46,"sku":[{"skuId":231406,"num":1,"category":15924,"price":13.30,"name":"蓝月亮 深层洁净洗衣液（薰衣草）1kg/瓶 （新老包装随机发货）",
     * "tax":16,"taxPrice":1.84,"nakedPrice":11.46,"type":0,"oid":0}],"orderTaxPrice":1.84}}
     */
    let data, dataObj
    // let orderPriceSnap= JSON.stringify([{skuId:231406,price:13.30}])
    let orderParams = {
      thirdOrder: params.thirdOrder,
      sku: params.sku,
      name: params.name,
      province: params.province,
      city: params.city,
      county: params.county,
      town: params.town || 0,
      address: params.address,
      mobile: params.mobile,
      email: params.email,
      invoiceState: 2,
      invoiceType: 3,
      selectedInvoiceTitle: 5,
      companyName: '聚仁传媒',
      regCode: '91440300359634501M',//91110105678793913T
      // 纳税人识别号  开普票并要打印出来识别号时， 需传入该字段
      invoiceContent: 100,
      paymentType: 4,
      isUseBalance: 1,
      submitState: 0,
      doOrderPriceMode:  1,
      orderPriceSnap: params.orderPriceSnap ,
      invoicePhone:params.mobile
    }


    /**
     * &sku=[{"skuId":4545192,"num":1,"bNeedGift":true,"bNeedAnnex ":true,"yanbao":[]}]
     * &doOrderPriceMode=1&orderPriceSnap=[{"skuId":4545192,"price":47.98}]
     * &province=19&city=1601&county=3633&town=0&address=详细地址
     * &name=收货人姓名&phone=18900000000
     * &mobile=18900001111&email=xxxxxx&zip=100000&invoiceType=3&invoiceState=4
     * &companyName=测试有限公司北京分公司&regCode=91110105678793913T
     * &invoiceContent=100&selectedInvoiceTitle=5&invoiceProvice=12&invoiceCity=933
     * &invoiceCounty=934&invoiceAddress=&invoiceName=&invoicePhone=05278828515&paymentType=5&isUseBalance=0&submitState=0
     * &reservingDate=-1&installDate=0&needInstall=false&promiseDate=&promiseTimeRange=&promiseTimeRangeCode=0&remark=测试下单后，即可取消
     */
    data = await jdUtils.submitOrder(orderParams)
    dataObj = typeof data === 'string' ? JSON.parse(data) : data

    return dataObj
  }

  static async confirmOrder(jdOrderId) {
    let data = await jdUtils.confirmOrder(jdOrderId)
    let dataObj = typeof data === 'string' ? JSON.parse(data) : data
    //{"success":true,"resultMessage":"确认下单成功","resultCode":"0003","result":true}
    return dataObj
  }
}

module.exports = MallController
