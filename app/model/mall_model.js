const Model = require('./../../lib/model')
const {
  goods,
  order,
  payment,
  orderRate
} = require('./../../config/models')

class AdminModel extends Model {

  goodsModel() {
    return this.db().define('goods', goods[0], goods[1])
  }

  orderModel() {
    return this.db().define('order', order[0], order[1])
  }

  paymentModel() {
    return this.db().define('payment', payment[0], payment[1])
  }

  orderRateModel() {
    return this.db().define('order_rate', orderRate[0], orderRate[1])
  }

  /**
   * 获取商品分类
   * @param {*} type 
   */
  getGoodsCategory(type = 2) {
    let sql = 'select category from t_goods group by category where type = :type'
    let rows = this.query(sql, {
      type: type
    })

    return rows

  }
}

module.exports = AdminModel