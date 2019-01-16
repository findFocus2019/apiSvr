const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op

class PostsController extends Controller {

  async _init_(ctx) {
    this.logger.info(ctx.uuid, '_init_()', 'token', ctx.token)
    if (ctx.token) {
      let userModel = new this.models.user_model
      await userModel.checkAuth(ctx)
    }

    if (!ctx.body.hasOwnProperty('user_id') || !ctx.body.user_id) {
      let unLimitRoutes = ['list', 'commentList']
      if (unLimitRoutes.indexOf(ctx.route.action) < 0) {
        ctx.ret.code = -100
        ctx.ret.message = '请先登录进行操作'
        return ctx.ret
      }
    }
  }

  /**
   * 分页列表
   */
  async list(ctx) {

    this.logger.info(ctx.uuid, 'list()', 'body', ctx.body, 'query', ctx.query)

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10

    let timestamp = ctx.body.timestamp
    let type = ctx.body.type || 1 // 分类
    let recommend = ctx.body.recommend || 0 // 推荐

    let where = {}
    where.update_time = {
      [Op.lte]: timestamp
    }
    where.type = type

    if (recommend) {
      where.recommend = recommend
      where.type = 2
    }
    this.logger.info(ctx.uuid, 'list()', 'where', where)

    let postsModel = new this.models.posts_model
    let queryRet = await postsModel.model().findAndCountAll({
      where: where,
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['update_time', 'desc']
      ],
      attributes: this.config.postListAttributes
    })

    let whereNew = where
    whereNew.update_time = {
      [Op.gt]: timestamp
    }
    this.logger.info(ctx.uuid, 'list()', 'whereNew', whereNew)
    let newCount = await postsModel.model().count({
      where: where
    })

    ctx.ret.data = {
      rows: queryRet.rows || [],
      count: queryRet.count || 0,
      page: page,
      limit: limit,
      newCount: newCount
    }
    this.logger.info(ctx.uuid, 'list()', 'ret', ctx.ret)

    return ctx.ret
  }

  /**
   * 详情
   */
  async info(ctx) {
    this.logger.info(ctx.uuid, 'info()', 'body', ctx.body, 'query', ctx.query)

    let postId = ctx.body.post_id
    let postsModel = new this.models.posts_model

    let info = await postsModel.model().findOne({
      where: {
        uuid: postId
      }
    })

    // 更新阅读量
    info.views = info.views++
    await info.save()

    ctx.ret.data.info = info
    this.logger.info(ctx.uuid, 'info()', 'info', info)

    // 用户登录后的数据
    if (ctx.body.user_id) {
      let userId = ctx.body.user_id
      let isLike = await postsModel.likeModel().count({
        user_id: userId,
        post_id: info.id
      })
      let commentCount = await postsModel.commentModel().count({
        post_id: info.id
      })
      ctx.ret.data.isLike = isLike ? 1 : 0
      ctx.ret.data.commentCount = commentCount
    } else {
      ctx.ret.data.isLike = -1
      ctx.ret.data.commentCount = -1
    }

    return ctx.ret
  }

  /**
   * 评论操作
   * @param {*} ctx 
   */
  async commentAction(ctx) {
    this.logger.info(ctx.uuid, 'commentAction()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    let postId = ctx.body.post_id
    let info = ctx.body.info
    let pid = ctx.body.pid || 0

    if (!postId || !info.trim()) {
      return this._fail(ctx, '参数错误')
    }

    let postsModel = new this.models.posts_model

    let post = await postsModel.model().findOne({
      where: {
        uuid: postId
      }
    })
    if (!post) {
      return this._fail(ctx, '无效条目')
    }

    if (pid) {
      let fComment = await postsModel.commentModel().findByPk(pid)
      if (!fComment) {
        return this._fail(ctx, '无效评论条目')
      }
    }

    postId = post.id

    let comment = await postsModel.commentModel().create({
      user_id: userId,
      post_id: postId,
      ip: ctx.ip,
      info: info,
      pid: pid
    })

    this.logger.info(ctx.uuid, 'commentAction() comment', comment)
    if (!comment) {
      return this._fail(ctx, '添加失败')
    }

    // 记录收益
    let taskModel = new this.models.task_model
    let t = await taskModel.getTrans()
    let taskData = {
      user_id: userId,
      model_id: postId,
      ip: ctx.ip
    }
    let taskRet = await taskModel.logByName(ctx, 'posts_comment', taskData, t)
    this.logger.info(ctx.uuid, 'commentAction() taskRet', taskRet)
    if (taskRet.code != 0) {
      t.rollback()
    } else {
      t.commit()
    }

    ctx.ret.data = {
      id: comment.id
    }
    return ctx.ret

  }

  /**
   * 评论列表
   * @param {*} ctx 
   */
  async commentList(ctx) {
    this.logger.info(ctx.uuid, 'commentList()', 'body', ctx.body, 'query', ctx.query)

    let postId = ctx.body.post_id
    let pid = ctx.body.pid || 0
    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10
    let timestamp = ctx.body.timestamp

    let postsModel = new this.models.posts_model
    let post = await postsModel.model().findOne({
      where: {
        uuid: postId
      }
    })
    if (!post) {
      throw new Error('无效条目')
    }

    postId = post.id

    let commentModel = postsModel.commentModel()
    let userModel = (new this.models.user_model())
    let userInfoModel = userModel.infoModel()
    commentModel.belongsTo(userInfoModel, {
      targetKey: 'user_id',
      foreignKey: 'user_id'
    })

    let where = {}
    where.post_id = postId
    where.pid = pid
    where.status = 1
    where.update_time = {
      [Op.lte]: timestamp
    }
    let offset = (page - 1) * limit

    let queryRet = await commentModel.findAndCountAll({
      where: where,
      offset: offset,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ],
      include: [{
        model: userInfoModel,
        attributes: ['id', 'nickname', 'mobile', 'avatar']
      }]
    })

    ctx.ret.data = queryRet
    return ctx.ret

  }

  /**
   * 阅读记录
   * @param {*} ctx 
   */
  async viewAction(ctx) {

    this.logger.info(ctx.uuid, 'viewAction()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    let postId = ctx.body.post_id

    if (!postId) {
      return this._fail(ctx, '参数错误')
    }

    let postsModel = new this.models.posts_model
    let taskModel = new this.models.task_model
    let t = await taskModel.getTrans()

    try {
      let post = await postsModel.model().findOne({
        where: {
          uuid: postId
        }
      })
      if (!post) {
        throw new Error('无效条目')
      }

      postId = post.id

      // 记录收益
      let taskData = {
        user_id: userId,
        model_id: postId,
        ip: ctx.ip
      }
      let taskRet = await taskModel.logByName(ctx, 'posts_view', taskData, t)
      if (taskRet.code != 0) {
        throw new Error(taskRet.message)
      }
      this.logger.info(ctx.uuid, 'viewAction() taskRet', taskRet)

      let view = await postsModel.viewModel().create({
        user_id: userId,
        post_id: postId,
        ip: ctx.ip,
        view_date: this.utils.date_utils.dateFormat(null, 'YYYYMMDD')
      })

      this.logger.info(ctx.uuid, 'viewAction() view', view)
      if (!view) {
        throw new Error('添加失败')
      }

      ctx.ret.data = {
        id: view.id
      }
      t.commit()
    } catch (err) {
      t.rollback()
      return this._fail(ctx, err.message || 'err')
    }

    return ctx.ret

  }

  /**
   * 收藏操作
   * @param {*} ctx 
   */
  async likeAction(ctx) {
    this.logger.info(ctx.uuid, 'likeAction()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    let postId = ctx.body.post_id

    if (!postId) {
      return this._fail(ctx, '参数错误')
    }

    let postsModel = new this.models.posts_model

    let post = await postsModel.model().findOne({
      where: {
        uuid: postId
      }
    })
    if (!post) {
      return this._fail(ctx, '无效条目')
    }

    postId = post.id
    let likeData = {
      user_id: userId,
      post_id: postId,
      // ip: ctx.ip
    }
    let like = await postsModel.likeModel().findOne(likeData)
    if (like) {
      return this._fail(ctx, '重复操作')

    }

    likeData.ip = ctx.ip
    like = await postsModel.likeModel().create(likeData)

    this.logger.info(ctx.uuid, 'likeAction() like', like)
    if (!like) {
      return this._fail(ctx, '添加失败')
    }

    // 记录收益
    let taskModel = new this.models.task_model
    let t = await taskModel.getTrans()
    let taskData = {
      user_id: userId,
      model_id: postId,
      ip: ctx.ip
    }
    let taskRet = await taskModel.logByName(ctx, 'posts_like', taskData, t)
    this.logger.info(ctx.uuid, 'likeAction() taskRet', taskRet)
    if (taskRet.code != 0) {
      t.rollback()
    } else {
      t.commit()
    }

    ctx.ret.data = {
      id: like.id
    }
    return ctx.ret
  }

  /**
   * 发布评测
   */
  async postAction(ctx) {

    this.logger.info(ctx.uuid, 'postAction()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    let goodsId = ctx.body.goods_id
    let body = ctx.body
    // TODO 校验goodsID

    // 是否有评测资格
    let userModel = new this.models.user_model
    let user = await userModel.model().findByPk(userId)
    if (user.share_level != 1) {
      return this._fail(ctx, '无评测资格')
    }

    let postData = {
      type: 3,
      title: body.title,
      content: body.content,
      cover: body.cover || '',
      imgs: body.imgs || [],
      video: body.video || '',
      audio: body.audio || '',
      goods_id: goodsId,
      user_id: userId
    }
    this.logger.info(ctx.uuid, 'postAction()', 'postData', postData)

    let postsModel = new this.models.posts_model
    let post = await postsModel.model().create(postData)

    if (!post) {
      return this._fail(ctx, '发表失败')
    }

    ctx.ret.data = {
      uuid: post.uuid
    }
    this.logger.info(ctx.uuid, 'postAction()', 'ret', ctx.ret)
    return ctx.ret

  }
}

module.exports = PostsController