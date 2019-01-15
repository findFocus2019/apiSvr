const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op

class ConfigController extends Controller {

  async list(ctx) {
    this.logger.info(ctx.uuid, 'list()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)

    let configModel = new this.models.config_model
    let rows = await configModel.model().findAll({
      where: {
        status: {
          [Op.gte]: 0
        }
      },
      attributes: {
        exclude: ['update_time']
      }
    })

    ctx.ret.data = {
      rows: rows
    }
    return ctx.ret
  }

  async info(ctx) {
    this.logger.info(ctx.uuid, 'info()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)
    let configModel = new this.models.config_model
    let id = ctx.body.id
    let info = await configModel.model().findByPk(id)

    ctx.ret.data = {
      info: info
    }
    this.logger.info(ctx.uuid, 'info()', 'ret', ctx.ret)
    return ctx.ret
  }

  async update(ctx) {
    this.logger.info(ctx.uuid, 'update()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)
    let configModel = new this.models.config_model

    let data = ctx.body
    let config
    if (data.id) {
      config = await configModel.model().findByPk(data.id)
      await config.update(data)
    } else {
      config = await configModel.model().create(data)
    }

    ctx.ret.data = {
      info: config
    }
    this.logger.info(ctx.uuid, 'update()', 'ret', ctx.ret)
    return ctx.ret

  }

}

module.exports = ConfigController