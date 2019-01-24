const Model = require('./../../lib/model')
const {
  admin
} = require('./../../config/models')

class AdminModel extends Model {

  model() {
    return this.db().define('admin', admin()[0], admin()[1])
  }
}

module.exports = AdminModel