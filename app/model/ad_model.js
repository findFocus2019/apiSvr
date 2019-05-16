const Model = require('./../../lib/model')
const {
  adItem,
} = require('./../../config/models')
const Op = require('sequelize').Op

class AdModel extends Model {

  itemModel() {
    return this.db().define('ad_item', adItem()[0], adItem()[1])
  }


}

module.exports = AdModel