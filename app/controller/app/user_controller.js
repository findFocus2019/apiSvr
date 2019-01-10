const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op
class UserController extends Controller {

  constructor(ctx) {
    // super.constructor()
    super()
    this.logger.info(ctx.uuid, 'UserController Constructor')

  }

  async _init_(ctx) {
    this.logger.info(ctx.uuid, 'UserController._init_ async ')
    let userModel = new this.models.user_model
    await userModel.checkAuth(ctx)
    // let token = ctx.query.token || ctx.body.token || ''
    // if (!token) {
    //   ctx.ret.code = -101
    //   ctx.ret.message = 'token err'
    //   return ctx.ret
    // }

    // let userModel = new this.models.user_model
    // let userAuth = await userModel.authModel().findOne({
    //   where: {
    //     token: token
    //   }
    // })
    // this.logger.info(ctx.uuid, 'UserController._init_ user ', userAuth)
    // if (!userAuth) {
    //   ctx.ret.code = -100
    //   ctx.ret.message = 'token check fail'
    //   return ctx.ret
    // }


    // ctx.body.user_id = userAuth.user_id

    // return ctx.ret
  }

  /**
   * 退出登录
   * @param {*} ctx 
   */
  async logout(ctx) {

    this.logger.info(ctx.uuid, 'logout()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let userModel = new this.models.user_model
    let userAuth = await userModel.authModel().findOne({
      where: {
        user_id: userId
      }
    })
    userAuth.token = ''
    await userAuth.save()

    return ctx.ret

  }

  /**
   * 用户信息
   */
  async info(ctx) {
    this.logger.info(ctx.uuid, 'info()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let userModel = new this.models.user_model
    let info = await userModel.getInfoByUserId(userId)

    ctx.ret.data = {
      info: info
    }

    return ctx.ret
  }

  /**
   * 申请评测资格
   */
  async applyCanPost(ctx) {
    this.logger.info(ctx.uuid, 'applyCanPost()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let userModel = new this.models.user_model
    let info = await userModel.getInfoByUserId(userId)
    this.logger.info(ctx.uuid, 'applyCanPost()', 'user.post_pub', info.post_pub)

    if (info.post_pub) {
      return this._fail('已有资格')
    }

    let type = this.config.userApplyTypes.PUB_POST
    let find = await userModel.applyModel().count({
      where: {
        user_id: userId,
        type: type,
        status: {
          [Op.gt]: 0
        }
      }
    })
    this.logger.info(ctx.uuid, 'applyCanPost()', 'user.applyCount', find)
    if (find > 0) {
      return this._fail('请不要重复申请')
    }

    let apply = await userModel.applyModel().create({
      user_id: userId,
      type: type
    })

    if (!apply) {
      return this._fail('申请失败')
    }

    ctx.ret.data = {
      id: apply.id
    }
    this.logger.info(ctx.uuid, 'applyCanPost()', 'user.ret', ctx.ret)
    return ctx.ret

  }

  /**
   * 用户地址
   * @param {*} ctx 
   */
  async address(ctx) {
    this.logger.info(ctx.uuid, 'address()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let userModel = new this.models.user_model

    let rows = await userModel.addressModel().findAll({
      where: {
        user_id: userId
      }
    })
    this.logger.info(ctx.uuid, 'address()', 'rows', rows)

    ctx.ret.data.list = rows
    return ctx.ret
  }

  /**
   * 删除地址
   * @param {*} ctx 
   */
  async addressDelete(ctx) {
    this.logger.info(ctx.uuid, 'addressDelete()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let addressId = ctx.body.address_id
    let userModel = new this.models.user_model

    let address = await userModel.addressModel().findByPk(addressId)
    this.logger.info(ctx.uuid, 'addressDelete()', 'address', address)
    if (!address && address.user_id != userId) {
      return this._fail('无效数据')
    }

    await address.destory()

    return ctx.ret
  }
  /**
   * 用户地址管理
   * @param {*} ctx 
   */
  async addressUpdate(ctx) {
    this.logger.info(ctx.uuid, 'addressUpdate()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let body = ctx.body
    let userModel = new this.models.user_model

    let count = await userModel.addressModel().count({
      where: {
        user_id: userId
      }
    })

    if (body.id) {
      let address = await userModel.addressModel().findByPk(body.id)
      this.logger.info(ctx.uuid, 'addressUpdate()', 'address', address)
      if (!address && address.user_id != userId) {
        return this._fail('无效数据')
      }

      let updateRet = await address.update(body)
      if (!updateRet) {
        return this._fail('')
      }

      this.logger.info(ctx.uuid, 'addressUpdate()', 'updateRet', updateRet)
      ctx.ret.data = {
        id: address.id
      }
    } else {
      if (count > this.config.userAddressCountLimit) {
        return this._fail('超过数量限制')
      }
      let address = await userModel.addressModel().create(body)
      this.logger.info(ctx.uuid, 'addressUpdate()', 'address', address)
      if (!address) {
        return this._fail('')
      }

      ctx.ret.data = {
        id: address.id
      }
    }


    return ctx.ret


  }


}

module.exports = UserController