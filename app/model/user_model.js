const Model = require('./../../lib/model')
const {
  user
} = require('./../../config/models')

class UserModel extends Model {

  model() {
    return this.db().define('user', user[0], user[1])
  }
}

module.exports = UserModel