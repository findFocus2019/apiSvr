const Controller = require('./../../../lib/controller')

class UserController extends Controller {

  constructor(ctx) {
    // super.constructor()
    super()
    this.logger.info(ctx.uuid, 'UserController Constructor')

    ;
    (async () => {
      this.logger.info(ctx.uuid, 'UserController.constructor async ')
    })()
  }

  async info(ctx) {
    this.logger.info(ctx.uuid, 'body', ctx.body, 'query', ctx.query)

    let userModel = (new this.models.user_model())
    let user = await userModel.model().findByPk(ctx.query.id)
    let info = await userModel.getInfoByUserId(user.id)

    ctx.ret.data = {
      info: info
    }
    this.logger.info(ctx.uuid, 'ret', ctx.ret)
  }
}

module.exports = UserController