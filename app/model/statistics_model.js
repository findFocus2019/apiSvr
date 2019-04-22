const Model = require('./../../lib/model')
const {
  statistics
} = require('./../../config/models')

class StatisticsModel extends Model { 
  model() {
    return this.db().define('daily_user_statistics', statistics()[0], statistics()[1])
  }
}
module.exports = StatisticsModel