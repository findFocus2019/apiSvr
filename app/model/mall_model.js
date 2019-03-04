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
        id: item.jd_num,
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

  async updateJDGood(goodInfo,page_num) {
    let imgPrePath = 'https://img11.360buyimg.com/n1/'
    let categoryInfo = await this.goodsModel().findOne({
      where: {uuid: goodInfo.sku}
    })
    let content = goodInfo.introduction
    //利润计算
    let price_cost = parseInt(goodInfo.price * 100)
    let priceDifference = parseInt(goodInfo.jdPrice * 100) - price_cost
    let profit = parseInt(priceDifference * 50 / 100)
    let profitVip = parseInt(priceDifference * 30 / 100)
    let price_score_sell = parseInt(priceDifference * 30 / 100) / 100
    let price_score_vip = parseInt(priceDifference * 10 / 100) / 100
    //普通销售价格 最低价
    goodInfo.price_sell = (profit + price_cost) / 100
    goodInfo.price_vip = (profitVip + price_cost) / 100
    //
    if (categoryInfo) {
      categoryInfo.stock = -1
      categoryInfo.content = content
      categoryInfo.price_sell = goodInfo.price_sell
      categoryInfo.price_vip = goodInfo.price_vip
      categoryInfo.price_cost = goodInfo.price
      categoryInfo.price_market = goodInfo.jdPrice
      categoryInfo.price = goodInfo.jdPrice
      categoryInfo.cover = imgPrePath + goodInfo.imagePath
      categoryInfo.status = goodInfo.state
      categoryInfo.title  = goodInfo.name
      categoryInfo.category = page_num
      categoryInfo.price_score_sell = price_score_sell
      categoryInfo.price_score_vip = price_score_vip
      await categoryInfo.save()
    } else {
      await this.goodsModel().create({
        uuid: goodInfo.sku,
        price_vip: goodInfo.price_vip,
        price_sell: goodInfo.price_sell,
        price_cost: goodInfo.price,
        price_market: goodInfo.jdPrice,
        content: goodInfo.introduction,
        cover: imgPrePath + goodInfo.imagePath,
        status: goodInfo.state,
        title: goodInfo.name,
        category: page_num,
        rabate_rate: 80,
        rabate_rate_vip: 80,
        price_score_sell: price_score_sell,
        price_score_vip: price_score_vip,
        type: 2,
        stock: -1
      })
    }
  }
  
}

module.exports = MallModel