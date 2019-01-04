const models = require('./../app/model/index')
const Log = require('./log')
class Controller {

  constructor() {
    // console.log('controller constructor')
    this.models = models
    this.logger = Log(this.constructor.name)

    this.logger.info('controller constructor')
  }

}

module.exports = Controller