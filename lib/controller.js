const models = require('./../app/model/index')
const Log = require('./log')
const config = require('./../config')

class Controller {

  constructor() {
    // console.log('controller constructor')
    this.models = models
    this.logger = Log(this.constructor.name)
    this.config = config

    this.logger.info('controller constructor')
  }



}

module.exports = Controller