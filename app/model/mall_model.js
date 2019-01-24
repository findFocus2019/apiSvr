const Model = require('./../../lib/model')
const {
  goods,
  order,
  payment,
  orderRate,
  orderRabate,
  orderAfter,
  category
} = require('./../../config/models')

class MallModel extends Model {

  categoryModel() {
    return this.db().define('category', category(0)[1], category()[1])
  }

  goodsModel() {
    return this.db().define('goods', goods()(0)[1], goods()()[1])
  }

  orderModel() {
    return this.db().define('order', order(0)[1], order()[1])
  }

  paymentModel() {
    return this.db().define('payment', payment(0)[1], payment()[1])
  }

  orderRateModel() {
    return this.db().define('order_rate', orderRate(0)[1], orderRate()[1])
  }

  orderRabateModel() {
    return this.db().define('order_rate', orderRabate(0)[1], orderRabate()[1])
  }

  orderAfterModel() {
    return this.db().define('order_after', orderAfter(0)[1], orderAfter()[1])
  }

  /**
   * 获取商品分类
   * @param {*} type 
   */
  async getGoodsCategoryJd(type = 2) {
    let sql = 'select category as name from t_goods where type = :type group by category '
    let rows = this.query(sql, {
      type: type
    })

    let datas = [{
      id: 'all',
      name: '全部'
    }]
    rows.forEach(item => {
      datas.push({
        id: item.category,
        name: item.category
      })
    })
    return datas

  }

  async getGoodsCategory() {
    let list = await this.categoryModel().findAll({
      where: {
        status: 1,
        pid: 0,
        type: 'goods'
      },
      order: [
        ['sort', 'asc'],
        ['create_time', 'desc']
      ]
    })

    let datas = [{
      id: 'all',
      name: '全部'
    }]
    list.forEach(item => {
      datas.push({
        id: item.name,
        name: item.title
      })
    })

    return datas
  }
}

module.exports = MallModel