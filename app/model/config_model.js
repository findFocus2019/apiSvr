const Model = require('./../../lib/model')
const {
  config
} = require('./../../config/models')

class NoticeModel extends Model {

  model() {
    return this.db().define('notice', config()[0], config()[1])
  }
}

module.exports = NoticeModel