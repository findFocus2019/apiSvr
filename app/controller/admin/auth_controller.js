/**
 * 登录，登出
 */

const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op

class AuthController extends Controller {
  constructor (ctx) {
    super()
  }

  /**
   * 登录
   * @param {*} ctx 
   */
  async login (ctx) {
    this.logger.info('login: ', ctx.body)

    let adminModel = new this.models.admin_model().model()
    let body = ctx.body

    let email = body.email
    let password = body.password

    let admin = await adminModel.findOne({
      where: {
        email: email,
        password: password
      }
    })

    if (admin === null) {
      this.logger.info('login: 账号密码错误' )
      ctx.ret.data = {code: -1, msg: '账号密码错误'}
    } else {
      ctx.session.admin = admin
      ctx.ret.data = {code: 0, msg: 'success', data: {}}
      ctx.ret.session = ctx.session.admin

    }
  }

  /**
   * 登出
   * @param {*} ctx 
   */
  async logout (ctx) {
    this.logger.info('logout: ', ctx.body)

    // 清除session
    ctx.session.admin = {}
  }
}

module.exports = AuthController