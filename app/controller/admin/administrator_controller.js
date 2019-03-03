const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op

class AdministratorController extends Controller {
  constructor(ctx) {
    super()

    this.logger.info(ctx.uuid, 'AdministratorController Constructor')
  }

  async administratorList (ctx) {
    this.logger.info('administratorList: ', ctx.body)

    let adminModel = new this.models.admin_model().model()

    let administratorList = await adminModel.findAll()

    ctx.ret.data = administratorList

    return ctx.ret

  }

  /**
   * 创建一个用户
   * @param {} ctx 
   */
  async administratorNew (ctx) {
    this.logger.info('administratorNew: ', ctx.body)

    let adminModel = new this.models.admin_model().model()

    let body = ctx.body
    let row = {'email': body.email, 'password': body.password, 'status': 1, 'pid': 0, 'type': ''}
    adminModel.create(row, {fields: ['email', 'password', 'status', 'pid', 'type']}).then(result => {
      this.logger.info('create administrator result: ', result)

    }).catch(error => {
      this.logger.error('error', error)
    })
  }

  /**
   * 更新一个用户信息
   * @param {*} ctx 
   */
  async administratorUpdate (ctx) {
    this.logger.info('administratorNew: ', ctx.body)

    let adminModel = new this.models.admin_model().model()

    let body = ctx.body
    let row = {
      'id': body.id,
      'email': body.email,
      'password': body.password,
      'status': 1,
      'pid': 0,
      'type': ''
    }
    
    let updateOptions = {
      where: {
        id: row.id
      }
    }

    adminModel.update(row, updateOptions).then(result => {
      this.logger.info('create administrator result: ', result)

    }).catch(error => {
      this.logger.error('error', error)
    })
  }

  /**
   * 删除账户
   * @param {} ctx 
   */
  async administratorDelete (ctx) {
    this.logger.info('administratorNew: ', ctx.body)

    let adminModel = new this.models.admin_model().model()

    let body = ctx.body

    adminModel.destroy({where: {id: body.id}}).then(result => {
      this.logger.info('delete administrator result: ', result)
    }).catch(error => {
      this.logger.error('error', error)
    })
  }
}

module.exports = AdministratorController