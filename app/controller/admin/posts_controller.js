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
}

module.exports = PostsController