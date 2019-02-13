const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op
class UserController extends Controller {

  constructor(ctx) {
    // super.constructor()
    super()
    this.logger.info(ctx.uuid, 'UserController Constructor')

  }

  async _init_(ctx) {
    this.logger.info(ctx.uuid, 'UserController._init_ async ')
    let userModel = new this.models.user_model
    let checkRet = await userModel.checkAuth(ctx)
    if (checkRet.code !== 0) {
      return this._fail(ctx, checkRet.message)
    }
    // let token = ctx.query.token || ctx.body.token || ''
    // if (!token) {
    //   ctx.ret.code = -101
    //   ctx.ret.message = 'token err'
    //   return ctx.ret
    // }

    // let userModel = new this.models.user_model
    // let userAuth = await userModel.authModel().findOne({
    //   where: {
    //     token: token
    //   }
    // })
    // this.logger.info(ctx.uuid, 'UserController._init_ user ', userAuth)
    // if (!userAuth) {
    //   ctx.ret.code = -100
    //   ctx.ret.message = 'token check fail'
    //   return ctx.ret
    // }


    // ctx.body.user_id = userAuth.user_id

    // return ctx.ret
  }

  /**
   * 退出登录
   * @param {*} ctx 
   */
  async logout(ctx) {

    this.logger.info(ctx.uuid, 'logout()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let userModel = new this.models.user_model
    let userAuth = await userModel.authModel().findOne({
      where: {
        user_id: userId
      }
    })
    userAuth.token = ''
    await userAuth.save()

    return ctx.ret

  }

  /**
   * 用户信息
   */
  async info(ctx) {
    this.logger.info(ctx.uuid, 'info()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let userModel = new this.models.user_model
    let info = await userModel.getInfoByUserId(userId)
    let isVip = await userModel.isVip(userId)

    // isVip = true

    ctx.ret.data = {
      info: info,
      isVip: isVip
    }

    return ctx.ret
  }

  async infoUpdate(ctx) {
    this.logger.info(ctx.uuid, 'infoUpdate()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let body = ctx.body
    let userModel = new this.models.user_model
    let info = await userModel.getInfoByUserId(userId)

    let updateItems = ['nickname', 'sex', 'avatar', 'alipay', 'openid']
    Object.keys(body).forEach(key => {
      if (updateItems.indexOf(key) > -1) {
        info[key] = body[key]
      }
    })

    let updateRet = info.save()
    if (!updateRet) {
      return this._fail(ctx, '更新数据发生错误')
    }

    return ctx.ret
  }

  /**
   * 个人中心数据
   * @param {*} ctx 
   */
  async centerData(ctx) {
    this.logger.info(ctx.uuid, 'info()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id

    let userModel = new this.models.user_model
    let info = await userModel.getInfoByUserId(userId)

    let postModel = new this.models.posts_model

    let viewCount = await postModel.getViewCountByUserId(userId)
    let commentCount = await postModel.getCommentCountByUserId(userId)
    let likeCount = await postModel.getLikeCountByUserId(userId)

    let shareModel = new this.models.share_model
    let shareCount = await shareModel.getShareCountByUserId(userId)

    let taskModel = new this.models.task_model
    let balanceSum = await taskModel.getBalanceSumByUserId(userId)

    let data = {}
    data.score = info.score
    data.balance = balanceSum
    data.count = {
      views: viewCount,
      comments: commentCount,
      likes: likeCount,
      shares: shareCount
    }

    this.logger.info(ctx.uuid, 'info()', 'data', data)

    ctx.ret.data = data
    return ctx.ret
  }

  /**
   * 重置密码
   * @param {*} ctx 
   */
  async resetPwd(ctx) {
    this.logger.info(ctx.uuid, 'resetPwd()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    let type = ctx.body.type || 0
    let password = ctx.body.password
    let verifyCode = ctx.body.verify_code

    // TODO 短信验证
    if (verifyCode != '0512') {
      return this._fail(ctx, '短信验证失败')
    }

    password = this.utils.crypto_utils.hmacMd5(password)
    let userModel = new this.models.user_model
    let user = await userModel.model().findByPk(userId)

    if (type == 0) {
      user.password = password
    } else {
      user.password_trade = password
    }

    let updateRet = await user.save()
    if (!updateRet) {
      return this._fail(ctx, '')
    }

    return ctx.ret

  }


  /**
   * 申请评测资格
   */
  async applyShareLevel(ctx) {
    this.logger.info(ctx.uuid, 'applyCanPost()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let userModel = new this.models.user_model
    let user = await userModel.model().findByPk(userId)
    this.logger.info(ctx.uuid, 'applyCanPost()', 'user.share_level', user.share_level)
    if (user.share_level == 1) {
      return this._fail(ctx, '已有资格')
    }

    let type = this.config.userApplyTypes.SHARE_LEVEL
    let find = await userModel.applyModel().count({
      where: {
        user_id: userId,
        type: type,
        status: {
          [Op.gt]: 0
        }
      }
    })
    this.logger.info(ctx.uuid, 'applyCanPost()', 'user.applyCount', find)
    if (find > 0) {
      return this._fail(ctx, '请不要重复申请')
    }

    let apply = await userModel.applyModel().create({
      user_id: userId,
      type: type
    })

    if (!apply) {
      return this._fail(ctx, '申请失败')
    }

    ctx.ret.data = {
      id: apply.id
    }
    this.logger.info(ctx.uuid, 'applyCanPost()', 'user.ret', ctx.ret)
    return ctx.ret

  }

  /**
   * 用户地址
   * @param {*} ctx 
   */
  async address(ctx) {
    this.logger.info(ctx.uuid, 'address()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let userModel = new this.models.user_model

    let rows = await userModel.addressModel().findAll({
      where: {
        user_id: userId
      },
      order: [
        ['update_time', 'desc']
      ]
    })
    this.logger.info(ctx.uuid, 'address()', 'rows', rows)

    ctx.ret.data = {
      list: rows
    }
    return ctx.ret
  }

  /**
   * 删除地址
   * @param {*} ctx 
   */
  async addressDelete(ctx) {
    this.logger.info(ctx.uuid, 'addressDelete()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let addressId = ctx.body.address_id
    let userModel = new this.models.user_model

    let address = await userModel.addressModel().findByPk(addressId)
    this.logger.info(ctx.uuid, 'addressDelete()', 'address', address)
    if (!address && address.user_id != userId) {
      return this._fail(ctx, '无效数据')
    }

    await address.destroy()

    return ctx.ret
  }
  /**
   * 用户地址管理
   * @param {*} ctx 
   */
  async addressUpdate(ctx) {
    this.logger.info(ctx.uuid, 'addressUpdate()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let body = ctx.body
    let userModel = new this.models.user_model

    let count = await userModel.addressModel().count({
      where: {
        user_id: userId
      }
    })

    if (body.id) {
      let address = await userModel.addressModel().findByPk(body.id)
      this.logger.info(ctx.uuid, 'addressUpdate()', 'address', address)
      if (!address && address.user_id != userId) {
        return this._fail(ctx, '无效数据')
      }

      let updateRet = await address.update(body)
      if (!updateRet) {
        return this._fail(ctx, '')
      }

      this.logger.info(ctx.uuid, 'addressUpdate()', 'updateRet', updateRet)
      ctx.ret.data = {
        id: address.id
      }
    } else {
      if (count > this.config.userAddressCountLimit) {
        return this._fail(ctx, '超过数量限制')
      }
      let address = await userModel.addressModel().create(body)
      this.logger.info(ctx.uuid, 'addressUpdate()', 'address', address)
      if (!address) {
        return this._fail(ctx, '')
      }

      ctx.ret.data = {
        id: address.id
      }
    }


    return ctx.ret


  }

  /**
   * 分享操作
   * @param {*} ctx 
   */
  async shareAction(ctx) {

    this.logger.info(ctx.uuid, 'shareAction()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    let postId = ctx.body.post_id || 0
    let goodsId = ctx.body.goods_id || 0
    let category = ctx.body.category

    if (Object.values(this.config.shareCategory).indexOf(category) < 0) {
      return this._fail(ctx, '分享类型错误')
    }

    if (!postId && category == this.config.shareCategory.POSTS) {
      return this._fail(ctx, '参数错误:post_id')
    }

    if (!goodsId && category == this.config.shareCategory.GOODS) {
      return this._fail(ctx, '参数错误:goods_id')
    }

    if (postId) {
      let postsModel = new this.models.posts_model
      let post = await postsModel.model().findByPk(postId)
      if (!post) {
        return this._fail(ctx, '无效分享条目')
      }

      postId = post.id

      if (post.goods_id) {
        goodsId = post.goods_id
      }
    }

    if (goodsId) {
      let goodsModel = (new this.models.mall_model).goodsModel()
      let goods = await goodsModel.findByPk(goodsId)
      if (!goods) {
        return this._fail(ctx, '无效商品分享条目')
      }

      goodsId = goods.id
    }


    let shareModel = new this.models.share_model
    let share = await shareModel.getShareItem(ctx, {
      user_id: userId,
      category: category,
      post_id: postId,
      goods_id: goodsId
    })

    ctx.ret.data = {
      info: share
    }
    return ctx.ret

  }

  /**
   * 阅读记录
   * @param {*} ctx 
   */
  async listView(ctx) {

    this.logger.info(ctx.uuid, 'listView()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10

    // let userModel = new this.models.user_model
    let PostModel = new this.models.posts_model

    let postModel = PostModel.model()
    let viewModel = PostModel.viewModel()

    viewModel.belongsTo(postModel, {
      targetKey: 'id',
      foreignKey: 'post_id'
    })

    let queryRet = await viewModel.findAndCountAll({
      where: {
        user_id: userId
      },
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ],
      include: [{
        model: postModel,
        attributes: ['id', 'uuid', 'title']
      }],
    })

    ctx.ret.data = {
      rows: queryRet.rows,
      count: queryRet.count,
      page: page
    }

    return ctx.ret
  }

  async delComment(ctx) {
    this.logger.info(ctx.uuid, 'delPost()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let postId = ctx.body.id

    let PostModel = new this.models.posts_model
    let commentModel = PostModel.commentModel()

    let comment = await commentModel.findByPk(postId)

    if (comment.user_id != userId) {
      return this._fail(ctx, '无权限删除')
    }

    comment.status = -1
    let delRet = await comment.save()
    if (!delRet) {
      return this._fail(ctx, '数据删除发生错误')
    }

    return ctx.ret
  }

  async listComment(ctx) {

    this.logger.info(ctx.uuid, 'listComment()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10

    // let userModel = new this.models.user_model
    let PostModel = new this.models.posts_model

    let postModel = PostModel.model()
    let commentModel = PostModel.commentModel()

    commentModel.belongsTo(postModel, {
      targetKey: 'id',
      foreignKey: 'post_id'
    })

    let queryRet = await commentModel.findAndCountAll({
      where: {
        user_id: userId
      },
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ],
      include: [{
        model: postModel,
        attributes: ['id', 'uuid', 'title', 'cover']
      }],
    })

    ctx.ret.data = {
      rows: queryRet.rows,
      count: queryRet.count,
      page: page
    }

    return ctx.ret

  }

  async listLike(ctx) {
    this.logger.info(ctx.uuid, 'listLike()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10

    // let userModel = new this.models.user_model
    let PostModel = new this.models.posts_model

    let postModel = PostModel.model()
    let likeModel = PostModel.likeModel()

    likeModel.belongsTo(postModel, {
      targetKey: 'id',
      foreignKey: 'post_id'
    })

    let queryRet = await likeModel.findAndCountAll({
      where: {
        user_id: userId
      },
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ],
      include: [{
        model: postModel,
        attributes: ['id', 'uuid', 'title']
      }],
    })

    queryRet.rows.forEach(row => {
      row.dataValues.create_date = this.utils.date_utils.dateFormat(row.create_time, 'YYYY-MM-DD HH:mm:ss')
    })

    ctx.ret.data = {
      rows: queryRet.rows,
      count: queryRet.count,
      page: page
    }

    return ctx.ret
  }

  /**
   * 我的评测
   * @param {*} ctx 
   */
  async listPost(ctx) {
    this.logger.info(ctx.uuid, 'listPost()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10

    let PostModel = new this.models.posts_model

    let postModel = PostModel.model()
    let queryRet = await postModel.findAndCountAll({
      where: {
        user_id: userId,
        type: 3,
        status: {
          [Op.gte]: 0
        }
      },
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ],
      attributes: this.config.postListAttributes
    })

    queryRet.rows.forEach(row => {
      row.dataValues.create_date = this.utils.date_utils.dateFormat(row.create_time, 'YYYY-MM-DD HH:mm')
    })
    ctx.ret.data = {
      rows: queryRet.rows,
      count: queryRet.count,
      page: page
    }

    return ctx.ret
  }

  /**
   * 每日任务
   */
  async tasks(ctx) {
    this.logger.info(ctx.uuid, 'task()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id

    let taskModel = this.models.task_model

    let tasks = await taskModel.model().findAll({
      where: {
        display: 1
      }
    })

    tasks.forEach(async (task) => {
      task.todayCount = await taskModel.getTodayCount(ctx, userId, task.dataValues.type)
    })

    ctx.ret.data.rows = tasks
    return ctx.ret

  }

  async delPost(ctx) {
    this.logger.info(ctx.uuid, 'delPost()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let postId = ctx.body.id

    let PostModel = new this.models.posts_model
    let postModel = PostModel.model()

    let post = await postModel.findByPk(postId)

    if (post.user_id != userId) {
      return this._fail(ctx, '无权限删除')
    }

    post.status = -1
    let delRet = await post.save()
    if (!delRet) {
      return this._fail(ctx, '数据删除发生错误')
    }

    return ctx.ret
  }

  /**
   * 每日签到
   * @param {*} ctx 
   */
  async dailySign(ctx) {
    this.logger.info(ctx.uuid, 'dailySign()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id

    let userModel = new this.models.user_model
    let t = await userModel.getTrans()
    try {

      let lastDailySign = await userModel.dailySignModel().findOne({
        where: {
          user_id: userId
        },
        order: [
          ['create_time', 'desc']
        ]
      })
      this.logger.info(ctx.uuid, 'dailySign()', 'lastDailySign', lastDailySign)

      let continuesNum = lastDailySign ? lastDailySign.continues_num : 0
      let lastTimeDay = lastDailySign ? lastDailySign.create_time : 0
      let lastTimeDate = this.utils.date_utils.dateFormat(lastTimeDay, 'YYYYMMDD')
      let dayPlusDate = this.utils.date_utils.dateFormat(lastTimeDay + 24 * 3600, 'YYYYMMDD')
      let today = this.utils.date_utils.dateFormat(null, 'YYYYMMDD')
      this.logger.info(ctx.uuid, 'dailySign()', 'lastTimeDate', lastTimeDate)
      this.logger.info(ctx.uuid, 'dailySign()', 'dayPlusDate', dayPlusDate)
      this.logger.info(ctx.uuid, 'dailySign()', 'today', today)

      if (lastTimeDate == today) {
        throw new Error('已签到')
      }

      if (dayPlusDate == today) {
        continuesNum++
      } else {
        continuesNum = 1
      }

      let dailySignRet = await userModel.dailySignModel().create({
        user_id: userId,
        continues_num: continuesNum > 7 ? 1 : continuesNum
      }, {
        transaction: t
      })
      this.logger.info(ctx.uuid, 'dailySign()', 'dailySignRet', dailySignRet)
      if (!dailySignRet) {
        throw new Error('保存记录失败')
      }

      // 每日签到奖励
      let score = 0
      let balance = 0

      let taskModel = new this.models.task_model
      let taskData = {
        user_id: userId,
        model_id: 0,
        ip: ctx.ip
      }

      let taskLogRet = await taskModel.logByName(ctx, this.config.tasks.DAILY_SIGN, taskData, t)
      this.logger.info(ctx.uuid, 'dailySign()', 'taskLogRet', taskLogRet)
      if (taskLogRet.code != 0) {
        throw new Error(taskLogRet.message)
      } else {
        score += taskLogRet.data.score
        balance += taskLogRet.data.balance
      }

      if (continuesNum == 7) {
        // 连续7天，现金奖励
        let taskLogRet7 = await taskModel.logByName(ctx, this.config.tasks.DAILY_SIGN_7, taskData, t)
        this.logger.info(ctx.uuid, 'dailySign()', 'taskLogRet', taskLogRet)
        if (taskLogRet7.code != 0) {
          throw new Error(taskLogRet7.message)
        } else {
          score += taskLogRet7.data.score
          balance += taskLogRet7.data.balance
        }
      }

      ctx.ret.data = {
        score: score,
        balance: balance
      }

      t.commit()
    } catch (err) {
      t.rollback()
      return this._fail(ctx, err.message || 'err')
    }

    this.logger.info(ctx.uuid, 'dailySign()', 'ret', ctx.ret)
    return ctx.ret
  }

  async dailySignData(ctx) {
    this.logger.info(ctx.uuid, 'dailySign()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id

    let userModel = new this.models.user_model
    let dailySignModel = userModel.dailySignModel()

    let monthFirstDay = this.utils.date_utils.dateFormat(null, 'YYYY-MM-01')
    this.logger.info(ctx.uuid, 'dailySign()', 'monthFirstTime', monthFirstDay)
    let monthFirstTime = this.utils.date_utils.getTimestamp(monthFirstDay)
    this.logger.info(ctx.uuid, 'dailySign()', 'monthFirstTime', monthFirstTime)
    let rows = await dailySignModel.findAll({
      where: {
        user_id: userId,
        create_time: {
          [Op.gte]: monthFirstTime
        }
      },
      order: [
        ['create_time', 'desc']
      ]
    })

    let data = {
      continues_num: 0,
      active_days: [],
      score: 0,
      balance: 0,
      today_sign: 0
    }
    let today = parseInt(this.utils.date_utils.dateFormat(null, 'DD'))
    rows.forEach((row, i) => {
      let day = parseInt(this.utils.date_utils.dateFormat(row.create_time, 'DD'))
      if (i == 0 && day == today) {
        data.continues_num = row.continues_num
        data.today_sign = 1
      }
      if (i == 1 && day == today - 1 && day.today_sign == 0) {
        data.continues_num = row.continues_num
      }

      data.active_days.push(day)
    })

    let taskModel = new this.models.task_model
    let score = await taskModel.getScoreSumByTypeAndUser(userId, 9)
    data.score = score
    let balance = await taskModel.getBalanceSumByUserId(userId, 6, 0)
    data.balance = balance

    ctx.ret.data = data
    return ctx.ret
  }

  /**
   * 计算现金收益，vip功能
   * @param {*} ctx 
   */
  async balanceGet(ctx) {
    let {
      amount,
      password
    } = ctx.body
  }

  /**
   * vip下单
   * @param {*} ctx 
   */
  async vipOrderCreate(ctx) {

    let userId = ctx.body.userId
    let type = ctx.body.type // 支付方式
    let password = ctx.body.password
    try {
      // 验证密码

      // 计算用户vip起始时间

      // 创建订单数据

      // 创建订单数据，默认vip代金券商品

      // 去支付平台下单
    } catch (err) {

      ctx.ret.code = 1
      ctx.ret.message = err.message || 'err'
    }

    return ctx.ret
  }

  /**
   * 发票信息
   * @param {*} ctx 
   */
  async invoiceInfo(ctx) {
    let userId = ctx.body.user_id
    if (!userId) {
      ctx.ret.code = 1
      return ctx.ret
    }

    let userModel = new this.models.user_model
    let info = await userModel.getUserInvoice(userId)

    this.logger.info(ctx.uuid, 'info', info)
    ctx.ret.data = info
    return ctx.ret
  }

  /**
   * 更新发票信息
   * @param {*} ctx 
   */
  async invoiceUpdate(ctx) {
    let userId = ctx.body.user_id
    let body = ctx.body

    this.logger.info(ctx.uuid, 'body', body)

    let userModel = new this.models.user_model
    let info = await userModel.getUserInvoice(userId)
    let updateRet = await info.update(body)

    ctx.ret.data = updateRet
    return ctx.ret

  }

  async listEcard(ctx) {
    let userId = ctx.body.user_id
    let body = ctx.body

    this.logger.info(ctx.uuid, 'body', body)

    let userModel = new this.models.user_model
    let list = await userModel.ecardModel().findAll({
      where: {
        user_id: userId
      },
      order: [
        ['status', 'desc'],
        ['create_time', 'desc']
      ]
    })

    ctx.ret.data = {
      list: list
    }
    return ctx.ret
  }

  async listCollection(ctx) {
    this.logger.info(ctx.uuid, 'collectionAction()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    let category = ctx.body.category || 'posts'
    let type = ctx.body.type || 0

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10

    let where = {}
    where.status = 1
    where.user_id = userId
    where.category = category
    if (type) {
      where.type = type
    }

    let userModel = new this.models.user_model
    let collectionModel = userModel.collectionModel()

    let queryRet = await collectionModel.findAndCountAll({
      where: where,
      order: [
        ['create_time', 'desc']
      ],
      offset: (page - 1) * limit,
      limit: limit
    })

    let postModel = (new this.models.posts_model).model()
    let mallModel = new this.models.mall_model
    let goodsModel = mallModel.goodsModel()

    let rows = []
    for (let index = 0; index < queryRet.rows.length; index++) {
      let row = queryRet.rows[index]
      let category = row.category
      let createDate = this.utils.date_utils.dateFormat(row.create_time, 'YYYY-MM-DD HH:mm')
      let info = {}

      if (category == 'posts') {
        let post = await postModel.findByPk(row.post_id)
        info.title = post.title
        info.cover = post.cover
        info.views = post.views
        info.shares = post.shares
        info.likes = post.likes
        info.pub_date = this.utils.date_utils.dateFormat(info.pub_date, 'YYYY-MM-DD HH:mm')
      } else {
        let goods = await goodsModel.findByPk(row.goods_id)
        info.title = goods.title
        info.cover = goods.cover
        info.price = (goods.price_sell * 100 + goods.price_score_sell * 100) / 100
        info.score = goods.price_score_sell
      }

      row.dataValues.create_date = createDate
      row.dataValues.info = info
      rows.push(row)

    }

    ctx.ret.data = {
      rows: rows,
      count: queryRet.count,
      page: page
    }

    return ctx.ret
  }

  /**
   * 收藏
   * @param {*} ctx 
   */
  async collectionAction(ctx) {
    this.logger.info(ctx.uuid, 'collectionAction()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    let postId = ctx.body.post_id
    let goodsId = ctx.body.goods_id
    let category = ctx.body.category || 'posts'
    let type = ctx.body.type || 0

    if (category == 'posts' && !postId) {
      return this._fail(ctx, '参数错误')
    }

    if (category == 'goods' && !goodsId) {
      return this._fail(ctx, '参数错误')
    }

    let userModel = new this.models.user_model
    let collectionModel = userModel.collectionModel()

    let findData = {
      user_id: userId,
      category: category,
      type: type
      // ip: ctx.ip
    }

    if (category == 'posts') {
      findData.post_id = postId
    } else {
      findData.goods_id = goodsId
    }

    let find = await collectionModel.findOne({
      where: findData
    })

    if (find) {
      // 取消
      let status = find.status
      if (status == 1) {
        find.status = -1
      } else {
        find.status = 1
      }

      let ret = await find.save()
      if (!ret) {
        ctx.ret.code = 1
        ctx.ret.message = find.status == 1 ? '收藏失败' : '取消收藏失败'
        return ctx.ret
      } else {
        ctx.ret.code = 0
        ctx.ret.message = find.status == 1 ? '收藏成功' : '取消收藏成功'
        return ctx.ret
      }

    } else {
      // 
      let collection = await collectionModel.create(findData)
      if (!collection) {
        ctx.ret.code = 1
        ctx.ret.message = '记录收藏数据失败'
        return ctx.ret
      }

      // 记录收益
      let taskModel = new this.models.task_model
      let t = await taskModel.getTrans()
      let taskData = {
        user_id: userId,
        model_id: collection.id,
        ip: ctx.ip
      }
      let taskRet = await taskModel.logByName(ctx, 'user_collection', taskData, t)
      this.logger.info(ctx.uuid, 'collectionAction() taskRet', taskRet)
      let score = 0
      let balance = 0
      if (taskRet.code != 0) {
        t.rollback()
      } else {
        score = taskRet.data.score || 0
        balance = taskRet.data.balance || 0
        t.commit()
      }

      ctx.ret.data = {
        id: collection.id,
        score: score,
        balance: balance
      }
    }


    return ctx.ret
  }

  async listOrderItem(ctx) {
    this.logger.info(ctx.uuid, 'listOrderItem()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10

    let mallModel = new this.models.mall_model
    let orderItemModel = mallModel.orderItemModel()
    let goodsModel = mallModel.goodsModel()

    orderItemModel.belongsTo(goodsModel, {
      targetKey: 'id',
      foreignKey: 'goods_id'
    })

    let queryRet = await orderItemModel.findAndCountAll({
      where: {
        user_id: userId,
        status: 1
      },
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ],
      include: [{
        model: goodsModel,
        attributes: ['id', 'cover', 'title']
      }],
    })

    queryRet.rows.forEach(row => {
      row.dataValues.create_date = this.utils.date_utils.dateFormat(row.create_time, 'YYYY-MM-DD HH:mm')
    })
    ctx.ret.data = {
      rows: queryRet.rows,
      count: queryRet.count,
      page: page
    }

    return ctx.ret
  }

  /**
   * 邀请的人
   */
  async listInvite(ctx) {

    this.logger.info(ctx.uuid, 'listInvite()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 20
    let timestamp = ctx.body.timestamp || parseInt(Date.now() / 1000)

    let userModel = new this.models.user_model

    let queryRet = await userModel.model().findAndCountAll({
      where: {
        pid: userId,
        create_time: {
          [Op.lt]: timestamp
        }
      },
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ]
    })

    let rows = []
    for (let index = 0; index < queryRet.rows.length; index++) {
      let row = queryRet.rows[index];
      let createDate = this.utils.date_utils.dateFormat(row.create_time, 'YYYY-MM-DD HH:mm')
      let userInfo = await userModel.getInfoByUserId(row.id)

      rows.push({
        id: row.id,
        uuid: row.uuid,
        nikcname: userInfo.nikcname,
        avatar: userInfo.avatar,
        create_date: createDate
      })
    }

    ctx.ret.data = {
      rows: rows,
      count: queryRet.count,
      page: page,
      timestamp: timestamp
    }

    return ctx.ret
  }

  async applyAction(ctx) {
    this.logger.info(ctx.uuid, 'listInvapplyInfoite()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let type = ctx.body.type || 1
    let info = ctx.body.info || ''
    let remark = ctx.body.remark || ''

    let userModel = new this.models.user_model
    let apply = await userModel.getUserApplyByType(userId, type)

    if (apply && apply.status != -1) {
      return this._fail(ctx, '请不要重复提交申请')
    }

    info = info ? JSON.stringify(info) : ''
    let status = (type == 1) ? 0 : 1
    let data = await userModel.applyModel().create({
      user_id: userId,
      type: type,
      info: info,
      remark: remark,
      status: status
    })

    if (!data) {
      return this._fail(ctx, '提交数据发生错误')
    }

    ctx.ret.data = {
      id: data.id
    }
    return ctx.ret

  }

  async applyInfo(ctx) {
    this.logger.info(ctx.uuid, 'applyInfo()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let type = ctx.body.type || 1

    let userModel = new this.models.user_model
    let apply = await userModel.getUserApplyByType(userId, type)

    if (apply) {
      apply.info = apply.info ? JSON.parse(apply.info) : {}
    }

    ctx.ret.data = apply

    return ctx.ret
  }

  /**
   * 收益记录
   * @param {*} ctx 
   */
  async taskLogs(ctx) {
    this.logger.info(ctx.uuid, 'trades()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)
    let userId = ctx.body.user_id
    let type = ctx.body.type || 1
    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10
    let startDate = ctx.body.start_date || 0
    let endDate = ctx.body.end_date || 0

    let TaskModel = new this.models.task_model
    let taskLogsModel = TaskModel.logsModel()
    let taskModel = TaskModel.model()

    taskLogsModel.belongsTo(taskModel, {
      targetKey: 'id',
      foreignKey: 'task_id'
    })

    let where = {}
    where.user_id = userId
    if (type == 1) {
      where.balance = {
        [Op.gt]: 0
      }
    } else {
      where.score = {
        [Op.gt]: 0
      }
    }

    if (startDate && endDate) {
      let startTime = this.utils.date_utils.getTimestamp(startDate)
      let endTime = this.utils.date_utils.getTimestamp(endDate + ' 23:59:59')

      where.create_time = {
        [Op.gte]: startTime,
        [Op.lte]: endTime
      }
    }

    let queryRet = await taskLogsModel.findAndCountAll({
      where: where,
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ],
      include: [{
        model: taskModel,
        attributes: ['id', 'name', 'title']
      }],
    })

    queryRet.rows.forEach(row => {
      row.dataValues.create_date = this.utils.date_utils.dateFormat(row.create_time, 'YYYY-MM-DD HH:mm')
    })
    ctx.ret.data = {
      rows: queryRet.rows,
      count: queryRet.count,
      page: page,
      start_date: startDate,
      end_date: endDate
    }

    return ctx.ret
  }

  async taskList(ctx) {

    this.logger.info(ctx.uuid, 'taskLogs()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10

    let taskModel = this.models.task_model

    let queryRet = await taskModel.findAndCountAll({
      where: {
        user_id: userId
      },
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ]
    })

    ctx.ret.data = {
      rows: queryRet.rows,
      count: queryRet.count,
      page: page
    }

    return ctx.ret
  }
}

module.exports = UserController