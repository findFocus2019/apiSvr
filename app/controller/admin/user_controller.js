const Controller = require('./../../../lib/controller')

class UserController extends Controller {

  constructor(ctx) {
    // super.constructor()
    super()
    console.log('UserController', ctx.uuid)

    ;
    (async () => {
      console.log('UserController.constructor async ')
    })()
  }

  async info(ctx) {
    console.log(ctx)

    let userModel = (new this.models.user_model()).model()
    let user = await userModel.findByPk(ctx.query.id)

    ctx.ret.data = user
  }
}

module.exports = UserController