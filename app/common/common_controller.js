const Controller = require('./../../lib/controller')
const Log = require('./../../lib/log')
const Op = require('sequelize').Op

class CommonController extends Controller {

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

  async _userVipDeal(ctx, order, t) {
    this.logger.info(ctx.uuid, '_userVipDeal()', 'body', ctx.body, 'query', ctx.query)
    let amount = order.total
    let price = amount
    let userId = order.user_id
    let opts = {}
    if (t) {
      opts.transaction = t
    }
    let userModel = new this.models.user_model
    let ecardRet = await userModel.ecardModel().create({
      amount: amount,
      price: price,
      status: 1,
      user_id: userId
    }, opts)

    if (!ecardRet) {
      ctx.ret.code = 1
      ctx.ret.message = '用户代金券数据记录失败'
      return ctx.ret
    }

    // TODO 做一次现金收益处理

    return ctx.ret
  }

  /**
   * 更新商品购买数量
   * @param {*} ctx 
   * @param {*} order 
   * @param {*} t 
   */
  async _paymentGoodsUpdate(ctx, order, t) {
    let goodsItems = order.goods_items
    let mallModel = new this.models.mall_model
    let goodsModel = mallModel.goodsModel()

    let opts = {}
    opts.transaction = t

    try {
      for (let index = 0; index < goodsItems.length; index++) {
        let goodsItem = goodsItems[index]
        let goodsId = goodsItem.id
        let goods = await goodsModel.findByPk(goodsId)
        goods.sales = goods.sales + (goodsItem.num || 1)

        let goodsUpdateRet = await goods.save(opts)
        if (!goodsUpdateRet) {
          throw new Error(`${goodsItem.title}:${goodsItem.id}更新数据出现错误`)
        }
      }
    } catch (err) {
      ctx.ret.code = 1
      ctx.ret.message = err.message
      return ctx.ret
    }

    return ctx.ret

  }


  /**
   * 结算收益
   * @param {*} ctx 
   */
  async _rabateDealDay(ctx) {
    let logger = Log('rabate_deal')

    let today = this.utils.date_utils.dateFormat(null, 'YYYYMMDD')
    logger.info(ctx.uuid, '_rabateDealDay date:', today)

    let mallModel = new this.models.mall_model
    let userModel = new this.models.user_model
    let taskModel = new this.models.task_model

    let orderItemModel = mallModel.orderItemModel()
    let items = await orderItemModel.findAll({
      where: {
        status: 0,
        rabate_date: today,
        order_status: 9
      }
    })

    logger.info(ctx.uuid, '_rabateDealDay item.length:', items.length)
    for (let index = 0; index < items.length; index++) {
      const item = items[index]

      let defaultInviteUser = this.config.defaultInivteUserId

      await this._rabateDealByUser(ctx, item.id, item.invite_user_id, item.num_rabate_invite, userModel, taskModel, 15, logger)
      await this._rabateDealByUser(ctx, item.id, item.share_user_id, item.num_rabate_share, userModel, taskModel, 16, logger)
      await this._rabateDealByUser(ctx, item.id, item.post_user_id, item.num_rabate_post, userModel, taskModel, 17, logger)

      await this._rabateDealByUser(ctx, item.id, defaultInviteUser, item.profit_over, userModel, taskModel, 15, logger)

      item.status = 1
      await item.save()

      logger.info(ctx.uuid, '_rabateDealDay item finish:', item.id)

    }

    logger.info(ctx.uuid, '_rabateDealDay item.finish:', items.length)

  }

  async _rabateDealByUser(ctx, itemId, userId, balance, userModel, taskModel, taskId, logger) {

    if (!userId) {
      logger.info(ctx.uuid, '_rabateDealByUser user 0', userId)
      return
    }

    let userInfo = await userModel.getInfoByUserId(userId)
    // let isVip = userModel.isVipByInfo(userInfo)
    let t = await userModel.getTrans()

    try {
      // 记录task
      let taskRet = await taskModel.log(ctx, userId, taskId, 'rabate', 0, balance, itemId, '', t)
      if (!taskRet) {
        throw new Error(`更新${userInfo.nickname}:${userInfo.user_id}的task Log 出错`)
      }
      // 更新用户数据
      // userInfo.balance = userInfo.balance + balance
      // let userInfoRet = await userInfo.save({
      //   transaction: t
      // })
      // if (!userInfoRet) {
      //   throw new Error(`更新${userInfo.nickname}:${userInfo.user_id}的balance 出错`)
      // }

      await t.commit()
    } catch (err) {
      logger.info(ctx.uuid, err.message)
      await t.rollback()
    }

  }

  /**
   * 结算vip
   * @param {*} ctx 
   */
  async _taskLogDealByUser(ctx) {

    let logger = Log('task_log_deal')

    let taskModel = new this.models.task_model
    let userModel = new this.models.user_model
    let taskLogsModel = taskModel.logsModel()
    let dateUtils = this.utils.date_utils

    let todayDate = dateUtils.dateFormat(null, 'YYYY-MM-DD')
    console.log(todayDate)
    let todayTimestamp = dateUtils.getTimestamp(todayDate)
    console.log(todayTimestamp)
    let startTimestamp = todayTimestamp - 30 * 24 * 3600
    let logs = await taskLogsModel.findAll({
      where: {
        status: 0,
        balance: {
          [Op.gt]: 0
        },
        create_time: {
          [Op.gte]: startTimestamp
        }
      }
    })

    for (let index = 0; index < logs.length; index++) {
      let taskLog = logs[index]
      let userInfo = await userModel.getInfoByUserId(taskLog.user_id)
      let isVip = userModel.isVipByInfo(userInfo)

      if (isVip) {
        // vip做计算
        logger.info(ctx.uuid, `${userInfo.nickname}:${userInfo.user_id}是vip`)

        let t = await userModel.getTrans()
        let opts = {
          transaction: t
        }
        try {
          userInfo.balance = userInfo.balance + taskLog.balance
          let userSaveRet = await userInfo.save(opts)
          if (!userSaveRet) {
            throw new Error(`更新${userInfo.nickname}:${userInfo.user_id}的balance 出错`)
          }

          taskLog.status = 1
          let taskLogRet = await taskLog.save(opts)
          if (!taskLogRet) {
            throw new Error(`更新${userInfo.nickname}:${userInfo.user_id}的task log status 出错`)
          }

          await t.commit()

        } catch (err) {
          logger.info(ctx.uuid, err.message)
          await t.rollback()
        }

      } else {
        // 不是vip
        logger.info(ctx.uuid, `${userInfo.nickname}:${userInfo.user_id}不是vip`)
      }

    }

    // 超过1个月未结算的
    let logs1 = await taskLogsModel.findAll({
      where: {
        status: 0,
        balance: {
          [Op.gt]: 0
        },
        create_time: {
          [Op.lt]: startTimestamp
        }
      }
    })
    logger.info(ctx.uuid, `taskLog失效条目:${logs1.length}`)

    for (let index = 0; index < logs1.length; index++) {
      const taskLog = logs1[index];
      taskLog.status = -1
      await taskLog.save()

      logger.info(ctx.uuid, `taskLog:${taskLog.id}失效`)

    }

    logger.info(ctx.uuid, `taskLog失效条目:${logs1.length}处理完毕`)
  }


  async _orderComplete(ctx, order, t) {

    try {
      let mallModel = new this.models.mall_model
      let orderItemModel = mallModel.orderItemModel()
      let goodsModel = mallModel.goodsModel()

      // 添加 orderRate
      let items = order.goods_items
      for (let index = 0; index < items.length; index++) {
        let item = items[index]
        this.logger.info(ctx.uuid, 'orderComplete()', 'goods_items', item)
        let orderItem = await orderItemModel.findOne({
          where: {
            order_id: order.id,
            goods_id: item.id
          }
        })
        this.logger.info(ctx.uuid, 'orderComplete()', 'orderItem', orderItem)
        if (orderItem) {
          let dayAfter7Time = parseInt(Date.now() / 1000) + 7 * 24 * 3600
          orderItem.order_status = 9
          orderItem.rabate_date = this.utils.date_utils.dateFormat(dayAfter7Time, 'YYYYMMDD')
          let orderItemRet = await orderItem.save({
            transaction: t
          })

          if (!orderItemRet) {
            throw new Error('更新订单条目失败')
          }
        }

        // goods发放积分
        let goods = await goodsModel.findByPk(item.id)
        let rabateScore = goods.rabate_score || 0
        this.logger.info(ctx.uuid, 'orderComplete()', 'rabateScore', rabateScore)
        if (rabateScore) {
          let taskModel = new this.models.task_model
          let t1 = await taskModel.getTrans()
          let taskData = {
            user_id: order.user_id,
            model_id: item.id,
            ip: ctx.ip,
            ext_num: rabateScore * item.num
          }
          taskModel.logByName(ctx, 'user_buy_goods', taskData, t1).then(async (ret) => {
            this.logger.info(ctx.uuid, 'orderComplete() taskModel.logByName', 'ret', ret)
            if (ret.code === 0) {
              t1.commit()
            } else {
              t1.rollback()
            }
          })
        }

      }

      order.status = 9
      order.finish_time = parseInt(Date.now() / 1000)
      let orderSaveRet = await order.save({
        transaction: t
      })
      if (!orderSaveRet) {
        throw new Error('更新订单信息错误')
      }

    } catch (err) {
      ctx.ret.code = 1
      ctx.ret.message = err.message
      return ctx.ret
    }

    ctx.ret.code = 0
    ctx.ret.message = ''
    return ctx.ret

  }
}

module.exports = CommonController