const models = require('./../app/model/index')
class Controller {

  constructor() {
    console.log('controller constructor')
    this.models = models
  }

}

module.exports = Controller