const Model = require('./../../lib/model')
const {
  user,
  userInfo,
  userAuth,
  oAuth,
  userApply,
  userAddress
} = require('./../../config/models')
const uuid = require('uuid')

class UserModel extends Model {

  model() {
    return this.db().define('user', user[0], user[1])
  }

  oAuthModel() {
    return this.db().define('oauth', oAuth[0], oAuth[1])
  }

  infoModel() {
    return this.db().define('user_info', userInfo[0], userInfo[1])
  }

  authModel() {
    return this.db().define('user_auth', userAuth[0], userAuth[1])
  }

  applyModel() {
    return this.db().define('user_apply', userApply[0], userApply[1])
  }

  addressModel() {
    return this.db().define('user_address', userAddress[0], userAddress[1])
  }

  async checkAuth(ctx) {

    let token = ctx.query.token || ctx.body.token || ''
    if (!token) {
      ctx.ret.code = -101
      ctx.ret.message = 'token err'
      return ctx.ret
    }

    // let userModel = new this.models.user_model
    let userAuth = await this.authModel().findOne({
      where: {
        token: token
      }
    })
    // this.logger.info(ctx.uuid, 'UserController._init_ user ', userAuth)
    if (!userAuth) {
      ctx.ret.code = -100
      ctx.ret.message = 'token check fail'
      return ctx.ret
    }

    ctx.body.user_id = userAuth.user_id
    return ctx.ret

  }

  /**
   * 获取授权登录信息
   * @param {*} platform 
   * @param {*} openid 
   */
  async getOauthByPlatformAndOpenid(oauthData) {
    let oauth = await this.oAuthModel().findOne({
      where: {
        platform: oauthData.platform,
        openid: oauthData.openid
      }
    })

    if (!oauth) {
      oauth = await this.oAuthModel().create({
        platform: oauthData.platform,
        openid: oauthData.openid,
        avatar: oauthData.avatar || '',
        nickname: oauthData.nickname || ''
      })
    }

    return oauth
  }
  /**
   * 授权登录
   * @param {*} auth 
   */
  async authLogin(auth) {
    console.log(JSON.stringify(auth))
    auth.token = uuid.v4()

    let userAuth = await this.authModel().findOne({
      where: {
        user_id: auth.user_id,
        platform: auth.platform
      }
    })

    if (userAuth) {
      let saveRet = await userAuth.update(auth)
      console.log(JSON.stringify(saveRet))
      return saveRet
    } else {
      userAuth = await this.authModel().create(auth)
      console.log(JSON.stringify(userAuth))
      return userAuth
    }

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