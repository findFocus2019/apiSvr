const Model = require('./../../lib/model')
const {
  schedule
} = require('./../../config/models')

class ScheduleModel extends Model {

  model() {
    return this.db().define('user', schedule(0)[1], schedule()[1])
  }
}

module.exports = ScheduleModel