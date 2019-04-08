const Model = require('./../../lib/model')
const {
  token
} = require('./../../config/models')

class TokenModel extends Model {

  model() {
    return this.db().define('token', token()[0], token()[1])
  }
}

module.exports = TokenModel