const Model = require('./../../lib/model')
const {
  share
} = require('./../../config/models')

class ShareModel extends Model {

  model() {
    return this.db().define('share', share(0)[1], share()[1])
  }

  /**
   * 获取分享item
   * @param {*} ctx 
   * @param {*} data 
   */
  async getShareItem(ctx, data) {
    console.log('================', data)
    let share = await this.model().findOne({
      where: {
        user_id: data.user_id,
        category: data.category,
        post_id: data.post_id,
        goods_id: data.goods_id
      }
    })

    if (!share) {
      share = await this.model().create({
        user_id: data.user_id,
        category: data.category,
        post_id: data.post_id,
        goods_id: data.goods_id
      })
    }

    return share
  }
}

module.exports = ShareModel