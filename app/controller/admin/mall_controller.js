const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op

class MallController extends Controller {

  async categoryList(ctx) {
    this.logger.info(ctx.uuid, 'categoryList()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)

    let where = {}
    where.type = this.config.categoryType.GOODS
    where.status = {
      [Op.gte]: 0
    }
    let mallModel = new this.models.mall_model
    let rows = await mallModel.categoryModel().findAll({
      where: where,
      order: [
        ['sort', 'asc'],
        ['create_time', 'desc']
      ],
      attributes: {
        exclude: ['update_time']
      }
    })

    ctx.ret.data = {
      rows: rows
    }
    return ctx.ret
  }

  async categoryInfo(ctx) {
    this.logger.info(ctx.uuid, 'info()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)
    let mallModel = new this.models.mall_model
    let id = ctx.body.id
    let info = await mallModel.categoryModel().findByPk(id)

    ctx.ret.data = {
      info: info
    }
    this.logger.info(ctx.uuid, 'info()', 'ret', ctx.ret)
    return ctx.ret
  }

  async categoryUpdate(ctx) {
    this.logger.info(ctx.uuid, 'categoryUpdate()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)
    let mallModel = new this.models.mall_model

    let data = ctx.body
    let mall
    if (data.id) {
      mall = await mallModel.categoryModel().findByPk(data.id)
      await mall.update(data)
    } else {
      data.type = this.config.categoryType.GOODS
      mall = await mallModel.categoryModel().create(data)
    }

    ctx.ret.data = {
      info: mall
    }
    this.logger.info(ctx.uuid, 'categoryUpdate()', 'ret', ctx.ret)
    return ctx.ret

  }

  async goodsList(ctx) {
    this.logger.info(ctx.uuid, 'goodsList()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)

    let page = ctx.body.page || 1
    let limit = ctx.body.limt || 10
    let offset = (page - 1) * limit

    let where = {}
    let mallModel = new this.models.mall_model
    let queryRet = await mallModel.goodsModel().findAndCountAll({
      where: where,
      offset: offset,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ],
      attributes: {
        exclude: ['update_time', 'content']
      }
    })

    ctx.ret.data = queryRet
    return ctx.ret
  }

  async goodsInfo(ctx) {
    this.logger.info(ctx.uuid, 'goodsInfo()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)
    let mallModel = new this.models.mall_model
    let id = ctx.body.id
    let info = await mallModel.goodsModel().findByPk(id)

    ctx.ret.data = {
      info: info
    }
    this.logger.info(ctx.uuid, 'goodsInfo()', 'ret', ctx.ret)
    return ctx.ret
  }

  async goodsUpdate(ctx) {
    this.logger.info(ctx.uuid, 'goodsUpdate()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)
    let mallModel = new this.models.mall_model

    let data = ctx.body
    let goods
    if (data.id) {
      goods = await mallModel.goodsModel().findByPk(data.id)
      await goods.update(data)
    } else {
      goods = await mallModel.goodsModel().create(data)
    }

    ctx.ret.data = {
      info: goods
    }
    this.logger.info(ctx.uuid, 'goodsUpdate()', 'ret', ctx.ret)
    return ctx.ret
  }
}

module.exports = MallController