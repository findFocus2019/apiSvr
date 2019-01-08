const Controller = require('./../../../lib/controller')

class UserController extends Controller {

  constructor(ctx) {
    // super.constructor()
    super()
    this.logger.info(ctx.uuid, 'UserController Constructor')

  }

  async _init_(ctx) {
    this.logger.info(ctx.uuid, 'UserController._init_ async ')
    let userModel = new this.models.user_model
    await userModel.checkAuth(ctx)
    // let token = ctx.query.token || ctx.body.token || ''
    // if (!token) {
    //   ctx.ret.code = -101
    //   ctx.ret.message = 'token err'
    //   return ctx.ret
    // }

    // let userModel = new this.models.user_model
    // let userAuth = await userModel.authModel().findOne({
    //   where: {
    //     token: token
    //   }
    // })
    // this.logger.info(ctx.uuid, 'UserController._init_ user ', userAuth)
    // if (!userAuth) {
    //   ctx.ret.code = -100
    //   ctx.ret.message = 'token check fail'
    //   return ctx.ret
    // }


    // ctx.body.user_id = userAuth.user_id

    // return ctx.ret
  }

  /**
   * 退出登录
   * @param {*} ctx 
   */
  async logout(ctx) {

    this.logger.info(ctx.uuid, 'logout()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let userModel = new this.models.user_model
    let userAuth = await userModel.authModel().findOne({
      where: {
        user_id: userId
      }
    })
    userAuth.token = ''
    await userAuth.save()

    return ctx.ret

  }

  /**
   * 用户信息
   */
  async info(ctx) {
    this.logger.info(ctx.uuid, 'info()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let userModel = new this.models.user_model
    let info = await userModel.getInfoByUserId(userId)

    ctx.ret.data = {
      info: info
    }

    return ctx.ret
  }


}

module.exports = UserController