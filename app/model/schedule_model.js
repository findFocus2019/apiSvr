const Model = require('./../../lib/model')
const {
  schedule
} = require('./../../config/models')

class ScheduleModel extends Model {

  model() {
    return this.db().define('schedule', schedule()[0], schedule()[1])
  }
}

module.exports = ScheduleModel