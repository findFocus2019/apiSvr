const Controller = require('./../../../lib/controller')

class AlbumController extends Controller{
  constructor(ctx) {
    // super.constructor()
    super()
    this.logger.info(ctx.uuid, 'AlbumController Constructor')

    ;
    (async () => {
      this.logger.info(ctx.uuid, 'AlbumController.constructor async ')
    })()
  }

    /**
   * 分页列表
   */
  async list(ctx) {

    this.logger.info(ctx.uuid, 'AlbumController list()', 'body', ctx.body, 'query', ctx.query)

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10
    let timestamp = ctx.body.timestamp
    let where = {}
    where.update_time = {
      [Op.lte]: timestamp
    }
    let fields =['status','type','sort','type_id']
    fields.map(field => {
      if (ctx.body[fields] && ctx.body[fields]!="") {
        where[field] = ctx.body[fields]
      }
    })

  
    this.logger.info(ctx.uuid, 'AlbumController list()', 'where', where)

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
    this.logger.info(ctx.uuid, 'AlbumController list()', 'ret', ctx.ret)

    return ctx.ret
  }
}

module.exports = new AlbumController();