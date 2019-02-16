const Model = require('./../../lib/model')
const {
  verifycode
} = require('./../../config/models')

class VerifyCodeModel extends Model {
  model() {
    return this.db().define('verify_code_records', verifycode()[0], verifycode()[1])
  }

}

module.exports = VerifyCodeModel