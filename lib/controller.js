const models = require('./../app/model/index')
const Log = require('./log')
const config = require('./../config')
const utils = require('./../app/utils')

class Controller {

  constructor() {
    // console.log('controller constructor')
    this.models = models
    this.logger = Log(this.constructor.name)
    this.config = config
    this.utils = utils

    this.logger.info('controller constructor')
  }

  _fail(ctx, message, code = 1, data = null) {
    ctx.ret.code = code
    ctx.ret.message = message
    if (data) {
      ctx.ret.data = data
    }
    return ctx.ret
  }



}

module.exports = Controller