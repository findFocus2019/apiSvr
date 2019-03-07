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
    let type = ctx.body.type || ''
    let typeId = ctx.body.type_id || 0
    let where = {}
  
    if(type){
      where.type = type
    }
    if(typeId){
      where.type_id = typeId
    }

    where.status = {
      [Op.gte]:0
    }

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

  async info(ctx) {
    this.logger.info(ctx.uuid, 'info()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)
    let albumModel = new this.models.album_model
    let id = ctx.body.id
    let info = await albumModel.model().findByPk(id)

    ctx.ret.data = {
      info: info
    }
    this.logger.info(ctx.uuid, 'info()', 'ret', ctx.ret)
    return ctx.ret
  }

  async update(ctx) {
    this.logger.info(ctx.uuid, 'update()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)
    let albumModel = new this.models.album_model

    let data = ctx.body
    if(!data.type) {
      data.type = 'banner'
    }
    data.status = data.status ? 1:0

    let notice
    if (data.id) {
      notice = await albumModel.model().findByPk(data.id)
      await notice.update(data)
    } else {
      notice = await albumModel.model().create(data)
    }

    ctx.ret.data = {
      info: notice
    }
    this.logger.info(ctx.uuid, 'update()', 'ret', ctx.ret)
    return ctx.ret

  }

}

module.exports = AlbumController

