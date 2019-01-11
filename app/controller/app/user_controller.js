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
    await userModel.checkAuth(ctx)
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

    ctx.ret.data = {
      info: info
    }

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

    ctx.ret.data.list = rows
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

    await address.destory()

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
        type: 3
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

  async taskLogs(ctx) {

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