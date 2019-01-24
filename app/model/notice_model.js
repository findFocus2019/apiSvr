const Model = require('./../../lib/model')
const {
  notice
} = require('./../../config/models')

class NoticeModel extends Model {

  model() {
    return this.db().define('notice', notice()[0], notice()[1])
  }
}

module.exports = NoticeModel