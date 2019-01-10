const Model = require('./../../lib/model')
const {
  share
} = require('./../../config/models')

class ShareModel extends Model {

  model() {
    return this.db().define('user', share[0], share[1])
  }

  /**
   * 获取分享item
   * @param {*} ctx 
   * @param {*} data 
   */
  async getShareItem(ctx, data) {
    let share = await this.model().findOne({
      user_id: data.user_id,
      category: data.category,
      item_id: data.item_id
    })

    if (!share) {
      share = await this.model().create({
        user_id: data.user_id,
        category: data.category,
        item_id: data.item_id
      })
    }

    return share
  }
}

module.exports = ShareModel