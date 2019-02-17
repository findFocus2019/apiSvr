const models = require('./../app/model/index')
const Log = require('./log')
const config = require('./../config')
const utils = require('./../app/utils')

class Controller {

  constructor() {
    // console.log('controller constructor')
    this.models = models
    this.logger = Log(this.constructor.name)
    this.config = config
    this.utils = utils

    this.logger.info('controller constructor')
  }

  _fail(ctx, message, code = 1, data = null) {
    ctx.ret.code = code
    ctx.ret.message = message
    if (data) {
      ctx.ret.data = data
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
    let user = await userModel.model().findByPk(userId)

    let numRabate = order.vip ? (item.price_vip * 100 - item.price_cost * 100) / 100 : (item.price_sell * 100 - item.price_cost * 100) / 100
    this.logger.info(ctx.uuid, '_creareOrderItem numRabate', numRabate)

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
        inviteUserId = this.config.defaultInivteUserId
      }
    } else {
      inviteUserId = this.config.defaultInivteUserId
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
        numRabatePost = numRabate * 70 / 100
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

    let opts = {}
    if (t) {
      opts.transaction = t
    }
    let goodsAmount = 0
    if (order.vip) {
      goodsAmount = order.score_use ? order.total_vip : (order.total_vip * 100 + order.score_vip * 100) / 100
    } else {
      goodsAmount = order.score_use ? order.total : (order.total * 100 + order.score * 100) / 100
    }
    this.logger.info(ctx.uuid, '_creareOrderItem goodsAmount', goodsAmount)
    let data = {
      user_id: userId,
      order_id: order.id,
      goods_id: item.goods_id,
      num_rabate: numRabate,
      num_rabate_share: numRabateShare,
      num_rabate_post: numRabatePost,
      num_rabate_invite: numRabateInvite,
      goods_title: item.title,
      goods_cover: item.cover,
      goods_amount: goodsAmount
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



}

module.exports = Controller