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
  }
}

module.exports = UserController