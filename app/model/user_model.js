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

}

module.exports = UserModel