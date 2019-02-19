const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op

class PostsController extends Controller {

  async list(ctx) {
    this.logger.info(ctx.uuid, 'list()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10

    let where = {}
    where.type = ctx.body.type || 1
    // where.status = {
    //   [Op.gte]: 0
    // }
    let search = ctx.body.search || ''
    if (search) {
      where.title = {
        [Op.like]: '%' + search + '%'
      }
    }
    this.logger.info(ctx.uuid, 'list()', 'where', where)

    let postsModel = new this.models.posts_model
    let queryRet = await postsModel.model().findAndCountAll({
      where: where,
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ],
      attributes: {
        exclude: ['update_time', 'content']
      }
    })

    ctx.ret.data = {
      rows: queryRet.rows,
      count: queryRet.count,
      page: page,
      limit: limit
    }
    return ctx.ret
  }

  async info(ctx) {
    this.logger.info(ctx.uuid, 'info()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)
    let postsModel = new this.models.posts_model
    let id = ctx.body.id
    let info = await postsModel.model().findByPk(id)

    ctx.ret.data = {
      info: info
    }
    this.logger.info(ctx.uuid, 'info()', 'ret', ctx.ret)
    return ctx.ret
  }

  async update(ctx) {
    this.logger.info(ctx.uuid, 'update()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)
    let postsModel = new this.models.posts_model

    let data = ctx.body
    let posts
    if (data.id) {
      posts = await postsModel.model().findByPk(data.id)
      await posts.update(data)
    } else {
      posts = await postsModel.model().create(data)
    }

    ctx.ret.data = {
      info: posts
    }
    this.logger.info(ctx.uuid, 'update()', 'ret', ctx.ret)
    return ctx.ret

  }

  async send(ctx) {

    this.logger.info(ctx.uuid, 'send()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)

    return ctx.ret
  }

  /**
   * 阅读记录
   * @param {*} ctx 
   */
  async viewList(ctx) {
    this.logger.info(ctx.uuid, 'body', ctx.body, 'query', ctx.query)

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10
    let offset = (page - 1) * limit
    let where = {}

    let search = ctx.body.search || ''
    if (search) {
      where.mobile = {
        [Op.like]: '%' + search + '%'
      }
    }

    let userModel = (new this.models.user_model())
    let userInfoModel = userModel.infoModel()
    let PostsModel = (new this.models.posts_model)
    let postsModel = PostsModel.model()
    let viewModel = PostsModel.viewModel()

    viewModel.belongsTo(userInfoModel, {
      targetKey: 'user_id',
      foreignKey: 'user_id'
    })
    viewModel.belongsTo(postsModel, {
      targetKey: 'id',
      foreignKey: 'post_id'
    })

    let queryRet = await viewModel.findAndCountAll({
      where: where,
      offset: offset,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ],
      include: [{
        model: userInfoModel,
        attributes: ['id', 'nickname', 'mobile']
      }, {
        model: postsModel,
        attributes: ['id', 'uuid', 'title']
      }]
    })

    this.logger.info(ctx.uuid, 'queryRet', queryRet)
    ctx.ret.data = queryRet
    return ctx.ret
  }

  /**
   * 点赞记录
   * @param {*} ctx 
   */
  async likeList(ctx) {
    this.logger.info(ctx.uuid, 'likeList()', 'body', ctx.body, 'query', ctx.query)

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10
    let offset = (page - 1) * limit
    let where = {}

    let search = ctx.body.search || ''
    if (search) {
      where.mobile = {
        [Op.like]: '%' + search + '%'
      }
    }

    let userModel = (new this.models.user_model())
    let userInfoModel = userModel.infoModel()
    let PostsModel = (new this.models.posts_model)
    let postsModel = PostsModel.model()
    let likeModel = PostsModel.likeModel()

    likeModel.belongsTo(userInfoModel, {
      targetKey: 'user_id',
      foreignKey: 'user_id'
    })
    likeModel.belongsTo(postsModel, {
      targetKey: 'id',
      foreignKey: 'post_id'
    })

    let queryRet = await likeModel.findAndCountAll({
      where: where,
      offset: offset,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ],
      include: [{
        model: userInfoModel,
        attributes: ['id', 'nickname', 'mobile']
      }, {
        model: postsModel,
        attributes: ['id', 'uuid', 'title']
      }]
    })

    this.logger.info(ctx.uuid, 'likeList()', 'queryRet', queryRet)
    ctx.ret.data = queryRet
    return ctx.ret
  }

  /**
   * 评论记录
   * @param {*} ctx 
   */
  async commentList(ctx) {
    this.logger.info(ctx.uuid, 'commentList()', 'body', ctx.body, 'query', ctx.query)

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10
    let offset = (page - 1) * limit
    let where = {}

    let search = ctx.body.search || ''
    if (search) {
      where.mobile = {
        [Op.like]: '%' + search + '%'
      }
    }

    let userModel = (new this.models.user_model())
    let userInfoModel = userModel.infoModel()
    let PostsModel = (new this.models.posts_model)
    let postsModel = PostsModel.model()
    let commentModel = PostsModel.commentModel()

    commentModel.belongsTo(userInfoModel, {
      targetKey: 'user_id',
      foreignKey: 'user_id'
    })
    commentModel.belongsTo(postsModel, {
      targetKey: 'id',
      foreignKey: 'post_id'
    })

    let queryRet = await commentModel.findAndCountAll({
      where: where,
      offset: offset,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ],
      include: [{
        model: userInfoModel,
        attributes: ['id', 'nickname', 'mobile']
      }, {
        model: postsModel,
        attributes: ['id', 'uuid', 'title']
      }]
    })

    this.logger.info(ctx.uuid, 'likeList()', 'queryRet', queryRet)
    ctx.ret.data = queryRet
    return ctx.ret
  }

  /**
   * 评论修改
   * @param {*} ctx 
   */
  async commentUpdate(ctx) {
    this.logger.info(ctx.uuid, 'commentUpdate()', 'body', ctx.body, 'query', ctx.query)

    let body = ctx.body

    let PostsModel = (new this.models.posts_model)
    let commentModel = PostsModel.commentModel()

    let comment = await commentModel.findByPk(body.id)
    if (!comment) {
      return this._fail(ctx, '无效数据')
    }

    let updateRet = await comment.update(body)
    this.logger.info(ctx.uuid, 'commentUpdate()', 'updateRet', updateRet)
    ctx.ret.data = updateRet
    return ctx.ret
  }
}

module.exports = PostsController