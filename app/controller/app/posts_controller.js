const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op
const textChecker = require('../../utils/163yundun_utils')

class PostsController extends Controller {

  async _init_(ctx) {

    let needCheckToken = true
    let unLimitRoutes = ['list', 'commentList', 'channels', 'info']
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


  async channels(ctx) {

    this.logger.info(ctx.uuid, 'channels()', 'body', ctx.body, 'query', ctx.query)
    // let type = ctx.body.type || 1
    // let postModel = new this.models.posts_model
    // let channels = await postModel.channelByType(type)

    let channels = this.config.postChannels

    this.logger.info(ctx.uuid, 'channels()', 'channels', channels)
    ctx.ret.data = channels
    return ctx.ret
  }

  /**
   * 分页列表
   */
  async list(ctx) {

    this.logger.info(ctx.uuid, 'list()', 'body', ctx.body, 'query', ctx.query)

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10

    let timestamp = ctx.body.timestamp
    let type = ctx.body.type || 0 // 分类
    let recommend = ctx.body.recommend || 0 // 推荐
    let channel = ctx.body.channel || '' // 频道
    let category = ctx.body.category || ''
    if (channel == 'all') {
      channel = ''
    }

    let where = {}
    where.status = 1
    where.create_time = {
      [Op.lte]: timestamp
    }
    if (type) {
      where.type = type
    }

    if (recommend) {
      where.recommend = recommend
      // where.type = 2
    }
    if (channel) {
      where.channel = channel
    }else {
      // where.channel = {
      //   [Op.in]: this.config.postChannels
      // }
    }

    if (category) {
      where.category = category
    }
    this.logger.info(ctx.uuid, 'list()', 'where', where)

    let postsModel = new this.models.posts_model
    let queryRet = await postsModel.model().findAndCountAll({
      where: where,
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['create_time', 'desc'],
        ['id', 'desc']
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

    let listAd = []
    if (type == 1){
      let whereAd = {
        status: 1
      }
      whereAd.type = 4
      console.log('whereAd ========' , whereAd)
      listAd = await postsModel.model().findAll({
        where: whereAd,
        offset: (page - 1) * 2,
        limit: 2,
        order: [
          ['create_time', 'desc'],
          ['id', 'desc']
        ],
        attributes: this.config.postListAttributes
      }) 

      console.log('listAd ========' , listAd)
    }

    let rows = []
    let userModel = new this.models.user_model
    // let mallModel = new this.models.mall_model
    // let goodsModel = mallModel.goodsModel()

    for (let index = 0; index < queryRet.rows.length; index++) {

      let row = queryRet.rows[index]
      row.dataValues.publish_time = this.utils.date_utils.dateFormat(row.pub_date, 'YYYY-MM-DD HH:mm')

      if (row.user_id) {
        let userInfo = await userModel.getInfoByUserId(row.user_id)
        row.dataValues.user_avatar = userInfo.avatar
        row.dataValues.user_nickname = userInfo.nickname
      }

      rows.push(row)

      if(index == 4){
        if(listAd[0]){
          let rowAd = listAd[0]
          rowAd.dataValues.publish_time = this.utils.date_utils.dateFormat(rowAd.pub_date, 'YYYY-MM-DD HH:mm')
          rows.push(rowAd)
        }
      }

      if(index == 9){
        if(listAd[1]){
          let rowAd = listAd[1]
          rowAd.dataValues.publish_time = this.utils.date_utils.dateFormat(rowAd.pub_date, 'YYYY-MM-DD HH:mm')
          rows.push(rowAd)
        }
      }
    }

    ctx.ret.data = {
      rows: rows || [],
      count: queryRet.count || 0,
      page: page,
      limit: limit,
      newCount: newCount,
      timestamp: timestamp
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
    let shareId = ctx.body.share_id || 0
    this.logger.info(ctx.uuid, 'info()', 'shareId', shareId)

    let postsModel = new this.models.posts_model

    let info = await postsModel.model().findOne({
      where: {
        id: postId
      }
    })

    // 更新阅读量
    let updateTime = info.update_time
    info.views = info.views + 1
    info.update_time = updateTime
    await info.save()

    // ctx.ret.data = info.dataValues
    this.logger.info(ctx.uuid, 'info()', 'info', info)

    // 用户登录后的数据
    if (ctx.body.user_id) {
      let userId = ctx.body.user_id
      let isLike = await postsModel.likeModel().count({
        where: {
          user_id: userId,
          post_id: info.id
        }
        
      })
      this.logger.info(ctx.uuid, 'info()', 'isLike', isLike)
      let commentCount = await postsModel.commentModel().count({
        post_id: info.id
      })

      let userModel = new this.models.user_model
      let isColletion = await userModel.isCollectPost(userId, info.id)

      info.dataValues.isLike = isLike ? 1 : 0
      info.dataValues.isCollection = isColletion
      info.dataValues.commentCount = commentCount
    } else {
      info.dataValues.isLike = -1
      info.dataValues.isCollection = -1
      info.dataValues.commentCount = -1
    }

    info.content = info.content.replace(/&amp;/g, '&')
    const regex = new RegExp('<img', 'gi')
    info.content = info.content.replace(regex, `<img style="max-width: 100%;"`)

    let publishTime = this.utils.date_utils.dateFormat(info.pub_date, 'YYYY-MM-DD HH:mm')
    this.logger.info(ctx.uuid, 'info()', 'publishTime', publishTime)
    info.dataValues.publish_time = publishTime

    // 分享积分
    
    if (shareId) {
      // 
      let shareModel = new this.models.share_model
      let shareInfo = await shareModel.model().findByPk(shareId)
      this.logger.info(ctx.uuid, 'info()', 'shareInfo', shareInfo)
      let shareUserId = shareInfo.user_id
      this.logger.info(ctx.uuid, 'info()', 'shareUserId', shareUserId)
      let taskModel = new this.models.task_model
      let t = await postsModel.getTrans()
      let taskData = {
        user_id: shareUserId,
        model_id: shareId,
        ip: ctx.ip
      }
      taskModel.logByName(ctx, 'user_share', taskData, t).then(async (ret) => {
        this.logger.info(ctx.uuid, 'info() taskModel.logByName', 'ret', ret)
        if (ret.code === 0) {
          let post = await  postsModel.model().findByPk(postId)
          post.shares = post.shares + 1
          await post.save({transaction: t})
          t.commit()
        } else {
          t.rollback()
        }
      })

    }
    ctx.ret.data = info
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

    // 检查html的内容是否合法
    let checkResult = await textChecker.check(info)
    checkResult = checkResult.body
    if (checkResult.code === 200) { // 请求正常
      if (checkResult.result.action !== 0) { // 怀疑有问题，或者就是有问题
        return this._fail(ctx, '内容不合法，请修改')
      }
    } else {
      return this._fail(ctx, '网络请求失败，请稍后再试')
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
    let score = 0
    let balance = 0
    this.logger.info(ctx.uuid, 'commentAction() taskRet', taskRet)
    if (taskRet.code != 0) {
      t.rollback()
    } else {
      score = taskRet.data.score || 0
      balance = taskRet.data.balance || 0
      t.commit()
    }

    ctx.ret.data = {
      id: comment.id,
      score: score,
      balance: balance
    }
    this.logger.info(ctx.uuid, 'commentAction() ctx.ret', ctx.ret)
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

    let rows = []
    for (let index = 0; index < queryRet.rows.length; index++) {
      let comment = queryRet.rows[index]
      comment.dataValues.create_date = this.utils.date_utils.dateFormat(comment.create_time, 'YYYY-MM-DD HH:mm')

      where.pid = comment.id
      let queryReplyRet = await commentModel.findAndCountAll({
        where: where,
        offset: 0,
        limit: 5,
        order: [
          ['create_time', 'desc']
        ],
        include: [{
          model: userInfoModel,
          attributes: ['id', 'nickname', 'mobile', 'avatar']
        }]
      })

      comment.dataValues.replys = queryReplyRet.rows

      let likes = await postsModel.getCommentLikeCount(comment.id)
      comment.dataValues.likes = likes

      rows.push(comment)
    }
    ctx.ret.data = {
      rows: rows,
      count: queryRet.count,
      page: page,
      timestamp: timestamp
    }
    return ctx.ret

  }

  async commentDetail(ctx) {
    this.logger.info(ctx.uuid, 'commentDetail()', 'body', ctx.body, 'query', ctx.query)

    let commentId = ctx.body.comment_id

    let postsModel = new this.models.posts_model
    let commentModel = postsModel.commentModel()
    let userModel = (new this.models.user_model())
    let userInfoModel = userModel.infoModel()
    commentModel.belongsTo(userInfoModel, {
      targetKey: 'user_id',
      foreignKey: 'user_id'
    })

    let comment = await commentModel.findByPk(commentId, {
      include: [{
        model: userInfoModel,
        attributes: ['id', 'nickname', 'mobile', 'avatar']
      }]
    })

    comment.dataValues.create_date = this.utils.date_utils.dateFormat(comment.create_time, 'YYYY-MM-DD HH:mm')

    let where = {}
    where.pid = comment.id
    let queryReplyRet = await commentModel.findAndCountAll({
      where: where,
      order: [
        ['create_time', 'desc']
      ],
      include: [{
        model: userInfoModel,
        attributes: ['id', 'nickname', 'mobile', 'avatar']
      }]
    })

    comment.dataValues.replys = queryReplyRet.rows

    let likes = await postsModel.getCommentLikeCount(comment.id)
    comment.dataValues.likes = likes

    ctx.ret.data = comment

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
      let score = 0
      let balance = 0
      let taskRet = await taskModel.logByName(ctx, 'posts_view', taskData, t)
      if (taskRet.code != 0) {
        throw new Error(taskRet.message)
      } else {
        score = taskRet.data.score || 0
        balance = taskRet.data.balance || 0
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
        id: view.id,
        score: score,
        balance: balance
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
    this.logger.info(ctx.uuid, 'likeAction()', 'likeData', likeData)
    let like = await postsModel.likeModel().findOne({
      where: likeData
    })
    if (like) {
      return this._fail(ctx, '请不要重复点赞')

    }

    likeData.ip = ctx.ip
    like = await postsModel.likeModel().create(likeData)

    this.logger.info(ctx.uuid, 'likeAction() like', like)
    if (!like) {
      return this._fail(ctx, '添加失败')
    }

    let updateTime = post.update_time
    post.likes = post.likes + 1
    post.update_time = updateTime
    await post.save()

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
      id: like.id,
      score: score,
      balance: balance
    }
    return ctx.ret
  }

  async commentLikeAction(ctx) {
    this.logger.info(ctx.uuid, 'commentLikeAction()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    let commentId = ctx.body.comment_id

    if (!commentId) {
      return this._fail(ctx, '参数错误')
    }

    let postsModel = new this.models.posts_model

    let comment = await postsModel.commentModel().findByPk(commentId)
    if (!comment) {
      return this._fail(ctx, '无效条目')
    }

    let likeData = {
      user_id: userId,
      comment_id: commentId,
      // ip: ctx.ip
    }
    this.logger.info(ctx.uuid, 'commentLikeAction()', 'likeData', likeData)
    let like = await postsModel.likeModel().findOne({
      where: likeData
    })
    if (like) {
      return this._fail(ctx, '请不要重复点赞')

    }

    likeData.ip = ctx.ip
    like = await postsModel.likeModel().create(likeData)

    this.logger.info(ctx.uuid, 'commentLikeAction() like', like)
    if (!like) {
      return this._fail(ctx, '添加失败')
    }

    // 记录收益
    let taskModel = new this.models.task_model
    let t = await taskModel.getTrans()
    let taskData = {
      user_id: userId,
      model_id: commentId,
      ip: ctx.ip
    }
    let taskRet = await taskModel.logByName(ctx, 'post_comment_like', taskData, t)
    this.logger.info(ctx.uuid, 'likeAction() taskRet', taskRet)
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
      id: like.id,
      score: score,
      balance: balance
    }
    return ctx.ret
  }
  /**
   * 发布评测
   */
  async postAction(ctx) {

    this.logger.info(ctx.uuid, 'postAction()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    // let goodsId = ctx.body.goods_id
    let body = ctx.body
    // TODO 校验goodsID

    // 是否有评测资格
    let userModel = new this.models.user_model
    let user = await userModel.getInfoByUserId(userId)
    // if (user.share_level != 1) {
    //   return this._fail(ctx, '无评测资格')
    // }

    let contents = body.contents
    let video = body.video_url || ''
    let audio = body.audio_url || ''
    let goods = body.goods
    let goodsId = goods.id

    let contentsFormat = (contents) => {
      let description = ''
      let imgs = []
      let html = ''
      let cover = ''
      contents.forEach((content, i) => {
        if (i == 0) {
          description = content.text.substring(0, 80)
        }

        html += `<p>${content.text}</p>`

        if (content.type == 'image') {
          if (!cover) {
            cover = content.urls[0]
          }

          content.urls.forEach(url => {
            html += `<p><img src="${url}" /></p>`
            imgs.push({
              width: 0,
              height: 0,
              url: url
            })
          })
        }
      })

      return {
        description,
        imgs,
        html,
        cover
      }
    }

    let {
      description,
      imgs,
      html,
      cover
    } = contentsFormat(contents)

    // 检查html的内容是否合法
    let checkResult = await textChecker.check(html)
    checkResult = checkResult.body
    if (checkResult.code === 200) { // 请求正常
      if (checkResult.result.action !== 0) {// 怀疑有问题，或者就是有问题
        return this._fail(ctx, '内容不合法，请修改')
      }
    } else {
      return this._fail(ctx, '网络请求失败，请稍后再试')
    }

    if (!cover) {
      // 用商品的封面图
      let mallModel = new this.models.mall_model
      let goods = await mallModel.goodsModel().findByPk(goodsId)
      cover = goods.cover
    }

    let postData = {
      type: 3,
      title: body.title,
      description: description,
      content: html,
      cover: cover,
      imgs: imgs,
      video: video,
      audio: audio,
      goods_id: goodsId,
      user_id: userId,
      pub_date: parseInt(Date.now() / 1000),
      status: 0
    }
    this.logger.info(ctx.uuid, 'postAction()', 'postData', postData)

    let postsModel = new this.models.posts_model
    let post = await postsModel.model().create(postData)

    if (!post) {
      return this._fail(ctx, '发表失败')
    }

    // 获得积分 TODO
    let score = 0
    let balance = 0

    ctx.ret.data = {
      id: post.id,
      uuid: post.uuid,
      score: score,
      balance: balance
    }

    this.logger.info(ctx.uuid, 'postAction()', 'ret', ctx.ret)
    return ctx.ret

  }
}

module.exports = PostsController