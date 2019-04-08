const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op
const jdUtils = require('../../utils/jd_utils')
const smsUtils = require('../../utils/sms_utils')
class ConfigController extends Controller {

  async list(ctx) {
    this.logger.info(ctx.uuid, 'list()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)

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
    this.logger.info(ctx.uuid, 'info()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)
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
    this.logger.info(ctx.uuid, 'update()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)
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

  /**
   * jd余额
   * @param {*} ctx 
   */
  async getJdBalance(ctx) {
    this.logger.info(ctx.uuid, 'getJdBalance()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)

    let result = await jdUtils.getBalance(4)
    let resultObj = JSON.parse(result)
    if (resultObj.success) {
      ctx.ret.data = resultObj
    } else {
      ctx.ret.code = -1
      ctx.ret.message = '京东接口查询错误'
    }

    this.logger.info(ctx.uuid, 'getJdBalance()', 'ret', ctx.ret)
    return ctx.ret
  }

  /**
   * 短信余额
   * @param {*} ctx 
   */
  async getSmsBalance(ctx) {
    this.logger.info(ctx.uuid, 'getSmsBalance()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)
    let result = await smsUtils.getBalance()
    // let resultObj = JSON.parse(result)
    ctx.ret.data = result
    this.logger.info(ctx.uuid, 'getSmsBalance()', 'ret', ctx.ret)
    return ctx.ret
  }

}

module.exports = ConfigController