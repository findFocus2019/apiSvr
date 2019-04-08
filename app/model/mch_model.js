const Model = require('./../../lib/model')
const {
  mch
} = require('./../../config/models')

class MchModel extends Model {

  model() {
    return this.db().define('token', mch()[0], mch()[1])
  }
}

module.exports = MchModel