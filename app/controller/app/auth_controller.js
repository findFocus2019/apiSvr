const Controller = require('./../../../lib/controller')

class AuthController extends Controller {

  constructor(ctx) {
    // super.constructor()
    super()
    this.logger.info(ctx.uuid, 'AuthController Constructor')

    ;
    (async () => {
      this.logger.info(ctx.uuid, 'AuthController.constructor async ')
    })()
  }

  async login(ctx) {
    this.logger.info(ctx.uuid, 'login()', 'body', ctx.body, 'query', ctx.query)

    let userModel = (new this.models.user_model()).model()
    let user = await userModel.findByPk(ctx.query.id)

    ctx.ret.data = user
    this.logger.info(ctx.uuid, 'login()', 'ret', ctx.ret)
  }
}

module.exports = AuthController