const Model = require('./../../lib/model')
const {
  user,
  userInfo
} = require('./../../config/models')

class UserModel extends Model {

  model() {
    return this.db().define('user', user[0], user[1])
  }

  infoModel() {
    return this.db().define('user_info', userInfo[0], userInfo[1])
  }

  async getInfoByUserId(userId, mobile = '') {
    let info = await this.infoModel().findOne({
      where: {
        user_id: userId
      }
    })
    if (!info) {
      info = await this.infoModel().create({
        user_id: userId,
        mobile: mobile
      })
    }

    return info
  }

  /**
   * 增加用户积分或者现金
   * @param {*} ctx 
   * @param {*} userId 
   * @param {*} balance 
   * @param {*} score 
   * @param {*} t 
   */
  async addUserAssets(ctx, userId, balance = 0, score = 0, t = null) {
    let ret = {
      code: 0,
      message: ''
    }

    let info = await this.getInfoByUserId(userId)
    info.balance = info.balance + balance
    info.score = info.score + score

    let opts = {
      transaction: t
    }
    let saveRet = await info.save(opts)
    if (!saveRet) {
      ret.code = 1
      ret.message = '更新用户资产失败'
    }

    return ret
  }

}

module.exports = UserModel