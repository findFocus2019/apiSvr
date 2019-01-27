const Controller = require('../../../lib/controller')
const Op = require('sequelize').Op

class AlbumController extends Controller {
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
    let where = {}
  
    let fields = ['status', 'type', 'sort', 'type_id']
    fields.map(field => {
      if (ctx.body[fields] && ctx.body[fields] != "") {
        where[field] = ctx.body[fields]
      }
    })


    this.logger.info(ctx.uuid, 'AlbumController list()', 'where', where)

    let albumModel = new this.models.album_model
    let queryRet = await albumModel.model().findAndCountAll({
      where: where,
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['update_time', 'desc']
      ],
      attributes: this.config.postListAttributes
    })

    ctx.ret.data = {
      rows: queryRet.rows || [],
      count: queryRet.count || 0,
      page: page,
      limit: limit
    }
    this.logger.info(ctx.uuid, 'AlbumController list()', 'ret', ctx.ret)

    return ctx.ret
  }
}

module.exports = AlbumController

