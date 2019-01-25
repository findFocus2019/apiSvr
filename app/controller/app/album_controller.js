const Controller = require('./../../../lib/controller')

class AlbumController extends Controller{
  constructor(ctx) {
    // super.constructor()
    super()
    this.logger.info(ctx.uuid, 'AuthController Constructor')

    ;
    (async () => {
      this.logger.info(ctx.uuid, 'AuthController.constructor async ')
    })()
  }
}

module.exports = new AlbumController();