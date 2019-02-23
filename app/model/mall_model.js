const Model = require('./../../lib/model')
const Op = require('sequelize').Op
const {
  goods,
  order,
  payment,
  // orderRate,
  orderItem,
  orderAfter,
  category
} = require('./../../config/models')

class MallModel extends Model {

  categoryModel() {
    return this.db().define('category', category()[0], category()[1])
  }

  goodsModel() {
    return this.db().define('goods', goods()()[0], goods()()[1])
  }

  orderModel() {
    return this.db().define('order', order()[0], order()[1])
  }

  paymentModel() {
    return this.db().define('payment', payment()[0], payment()[1])
  }

  // orderRateModel() {
  //   return this.db().define('order_rate', orderRate()[0], orderRate()[1])
  // }

  orderItemModel() {
    return this.db().define('order_item', orderItem()[0], orderItem()[1])
  }

  orderAfterModel() {
    return this.db().define('order_after', orderAfter()[0], orderAfter()[1])
  }

  /**
   * 获取商品分类
   * @param {*} type 
   */
  async getGoodsCategoryJd() {
    let list = await this.categoryModel().findAll({
      where: {
        status: 1,
        pid: 0,
        type: 'goods',
        jd_num: {
          [Op.ne]:0
        }
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
        id: item.id,
        name: item.title
      })
    })
    return datas

  }

  async getGoodsCategory() {
    let list = await this.categoryModel().findAll({
      where: {
        status: 1,
        pid: 0,
        jd_num: 0,
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