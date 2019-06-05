const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op

class ActivityController extends Controller {

  async _init(ctx) {
    let needCheckToken = true
    let unLimitRoutes = ['list', 'info']
    if (unLimitRoutes.indexOf(ctx.route.action) > -1) {
      needCheckToken = false
    }

    console.log('ctx.body.token=============', ctx.token)
    if (needCheckToken || ctx.token) {
      let userModel = new this.models.user_model
      let checkRet = await userModel.checkAuth(ctx)
      if (checkRet.code !== 0) {
        return this._fail(ctx, checkRet.message, checkRet.code)
      }
    } else {
      console.log(ctx.uuid, 'ctx.body.user_id=============', ctx.body.user_id)
    }
  }

  /**
   * 可参与活动的列表商品
   * @param {*} ctx 
   */
  list(ctx) {

  }

  /**
   * 创建活动
   * @param {*} ctx 
   */
  create(ctx) {

  }

  /**
   * 活动详情
   */
  info(ctx) {

  }

  /**
   * 参与活动
   * @param {*} ctx 
   */
  join(ctx) {

  }

  /**
   * 我创建的活动
   * @param {*} ctx 
   */
  mine(ctx) {

  }

}

module.exports = ActivityController