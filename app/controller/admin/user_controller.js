const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op
class UserController extends Controller {

  constructor(ctx) {
    // super.constructor()
    super()
    this.logger.info(ctx.uuid, 'UserController Constructor')

    ;
    (async () => {
      this.logger.info(ctx.uuid, 'UserController.constructor async ')
    })()
  }

  async list(ctx) {
    this.logger.info(ctx.uuid, 'list()', 'body', ctx.body, 'query', ctx.query)

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10
    let offset = (page - 1) * limit
    let where = {}

    let search = ctx.body.search || ''
    if (search) {
      where.mobile = {
        [Op.like]: '%' + search + '%'
      }
    }

    let userModel = (new this.models.user_model())
    let queryRet = await userModel.infoModel().findAndCountAll({
      where: where,
      offset: offset,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ]
    })

    this.logger.info(ctx.uuid, 'list()', 'queryRet', queryRet)
    ctx.ret.data = queryRet
    return ctx.ret
  }

  async info(ctx) {
    this.logger.info(ctx.uuid, 'info()', 'body', ctx.body, 'query', ctx.query)

    let userModel = (new this.models.user_model())
    let user = await userModel.model().findByPk(ctx.query.id)
    let info = await userModel.getInfoByUserId(user.id)

    ctx.ret.data = {
      info: info
    }
    this.logger.info(ctx.uuid, 'info()', 'ret', ctx.ret)
  }

  async shareList(ctx) {

    this.logger.info(ctx.uuid, 'shareList()', 'body', ctx.body, 'query', ctx.query)

    let page = ctx.body.page || 1
    let userId = ctx.body.user_id || 0
    let limit = ctx.body.limit || 10
    let offset = (page - 1) * limit
    let where = {}

    if (userId) {
      where.user_id = userId
    }
    let search = ctx.body.search || ''
    if (search) {
      where.uuid = {
        [Op.like]: '%' + search + '%'
      }
    }

    let userModel = (new this.models.user_model()).infoModel()
    let shareModel = (new this.models.share_model).model()

    shareModel.belongsTo(userModel, {
      targetKey: 'user_id',
      foreignKey: 'user_id'
    })
    let queryRet = await shareModel.findAndCountAll({
      where: where,
      offset: offset,
      limit: limit,
      order: [
        ['update_time', 'desc']
      ],
      include: [{
        model: userModel,
        attributes: ['id', 'nickname', 'mobile']
      }]
    })

    let postsModel = (new this.models.posts_model).model()
    let goodsModel = (new this.models.mall_model).goodsModel()

    for (let index = 0; index < queryRet.rows.length; index++) {
      let item = queryRet.rows[index]
      let postId = item.post_id || 0
      let goodsId = item.goods_id || 0

      if (postId) {
        let post = await postsModel.findByPk(postId)
        item.dataValues.post = {
          id: post.id,
          title: post.title
        }
      } else {
        item.dataValues.post = null
      }

      if (goodsId) {
        let goods = await goodsModel.findByPk(goodsId)
        item.dataValues.goods = {
          id: goods.id,
          title: goods.title
        }
      } else {
        item.dataValues.goods = null
      }

      // console.log(item)
      // queryRet.rows[index] = item
    }

    this.logger.info(ctx.uuid, 'shareList()', 'queryRet', queryRet)
    ctx.ret.data = queryRet
    return ctx.ret
  }

  async shareUpdate(ctx) {
    this.logger.info(ctx.uuid, 'shareUpdate()', 'body', ctx.body, 'query', ctx.query)

    let body = ctx.body

    let shareModel = (new this.models.share_model).model()

    let share = await shareModel.findByPk(body.id)
    if (!share) {
      return this._fail(ctx, '无效数据')
    }

    let updateRet = await share.update(body)
    this.logger.info(ctx.uuid, 'shareUpdate()', 'updateRet', updateRet)
    ctx.ret.data = updateRet
    return ctx.ret
  }

  /**
   * 签到记录
   * @param {*} ctx 
   */
  async dailySignList(ctx) {
    this.logger.info(ctx.uuid, 'dailySignList()', 'body', ctx.body, 'query', ctx.query)

    let page = ctx.body.page || 1
    let userId = ctx.body.user_id || 0
    let limit = ctx.body.limit || 10
    let offset = (page - 1) * limit
    let where = {}

    if (userId) {
      where.user_id = userId
    }
    let search = ctx.body.search || ''
    if (search) {
      // where.user_id = {
      //   [Op.like]: '%' + search + '%'
      // }
    }

    let userModel = (new this.models.user_model())
    let infoModel = userModel.infoModel()
    let dailySignModel = userModel.dailySignModel()

    dailySignModel.belongsTo(infoModel, {
      targetKey: 'user_id',
      foreignKey: 'user_id'
    })
    let queryRet = await dailySignModel.findAndCountAll({
      where: where,
      offset: offset,
      limit: limit,
      order: [
        ['update_time', 'desc']
      ],
      include: [{
        model: infoModel,
        attributes: ['id', 'nickname', 'mobile']
      }]
    })

    this.logger.info(ctx.uuid, 'dailySignList()', 'queryRet', queryRet)
    ctx.ret.data = queryRet
    return ctx.ret
  }

  /**
   * 签到记录
   * @param {*} ctx 
   */
  async addressList(ctx) {
    this.logger.info(ctx.uuid, 'addressList()', 'body', ctx.body, 'query', ctx.query)

    let page = ctx.body.page || 1
    let userId = ctx.body.user_id || 0
    let limit = ctx.body.limit || 10
    let offset = (page - 1) * limit
    let where = {}

    if (userId) {
      where.user_id = userId
    }
    let search = ctx.body.search || ''
    if (search) {
      // where.user_id = {
      //   [Op.like]: '%' + search + '%'
      // }
    }

    let userModel = (new this.models.user_model())
    let addressModel = userModel.addressModel()
    // let dailySignModel = userModel.dailySignModel()

    // dailySignModel.belongsTo(infoModel, {
    //   targetKey: 'user_id',
    //   foreignKey: 'user_id'
    // })
    let queryRet = await addressModel.findAndCountAll({
      where: where,
      offset: offset,
      limit: limit,
      order: [
        ['update_time', 'desc']
      ],
      // include: [{
      //   model: infoModel,
      //   attributes: ['id', 'nickname', 'mobile']
      // }]
    })

    this.logger.info(ctx.uuid, 'addressList()', 'queryRet', queryRet)
    ctx.ret.data = queryRet
    return ctx.ret
  }


}

module.exports = UserController