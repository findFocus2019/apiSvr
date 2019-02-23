const Model = require('./../../lib/model')
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
  async getGoodsCategoryJd(type = 2) {
    let sql = 'select category as name from t_goods where type = :type group by category '
    let rows = await this.query(sql, {
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

  //更新jd分类
  async updateJDCategory(jdCategory) {
    let page_num = jdCategory.page_num
    let name = jdCategory.name
    let categoryInfo = await this.categoryModel().findOne({
      where: {jd_num: page_num},
      attributes: ['id']
    })
    if (categoryInfo) {
      categoryInfo.name = name
      categoryInfo.title = name
      categoryInfo.jd_num = page_num
      await categoryInfo.save()
    } else {
      await this.categoryModel().create({
        jd_num: page_num,
        title: name,
        name: name,
        type: 'goods',
        sort: 0,
        pid: 0,
        status:1 
      })
    }
  }
  
}

module.exports = MallModel