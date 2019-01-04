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

    let userModel = (new this.models.user_model()).model()
    let user = await userModel.findByPk(ctx.query.id)

    ctx.ret.data = user
    this.logger.info(ctx.uuid, 'ret', ctx.ret)
  }
}

module.exports = UserController