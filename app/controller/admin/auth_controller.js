/**
 * 登录，登出
 */

const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op

class AuthController extends Controller {
  constructor(ctx) {
    super()
  }

  /**
   * 登录
   * @param {*} ctx 
   */
  async login(ctx) {
    this.logger.info('login: ', ctx.body)

    let adminModel = (new this.models.admin_model()).model()
    let body = ctx.body

    let email = body.email
    let password = body.password

    let admin = await adminModel.findOne({
      where: {
        email: email,
        password: password
      }
    })

    if (admin === null) {
      this.logger.info('login: 账号密码错误')
      ctx.ret.code = 1
      ctx.ret.message = '账号密码错误'
      // ctx.ret.data = {code: 1, msg: '账号密码错误'}
    } else {
      // ctx.session.AUTH = {admin:admin}
      // ctx.ret.data = {code: 0, msg: 'success', data: {}}
      ctx.ret.data = {
        admin: admin
      }
      ctx.ret.session = {
        AUTH: {
          admin: admin
        }
      }

    }

    this.logger.info('login: ', ctx.ret)
    return ctx.ret
  }

  /**
   * 登出
   * @param {*} ctx 
   */
  async logout(ctx) {
    this.logger.info('logout: ', ctx.body)

    // 清除session
    ctx.session.admin = {}
  }

  async mchLogin(ctx) {
    this.logger.info('login: ', ctx.body)

    let mchModel = (new this.models.mch_model()).model()
    let body = ctx.body

    let email = body.email
    let password = body.password

    let admin = await mchModel.findOne({
      where: {
        email: email,
        password: password
      }
    })

    if (admin === null) {
      this.logger.info('login: 账号密码错误')
      ctx.ret.code = 1
      ctx.ret.message = '账号密码错误'
      // ctx.ret.data = {code: 1, msg: '账号密码错误'}
    } else {
      // ctx.session.AUTH = {admin:admin}
      // ctx.ret.data = {code: 0, msg: 'success', data: {}}
      ctx.ret.data = {
        admin: admin
      }
      ctx.ret.session = {
        AUTH: {
          admin: admin
        },
        mch_id: admin.id
      }

    }

    this.logger.info('login: ', ctx.ret)
    return ctx.ret
  }

  /**
   * 商户信息
   * @param {*} ctx 
   */
  async mchInfo(ctx) {
    let mchModel = (new this.models.mch_model()).model()
    let mchId = ctx.session.mch_id || 0

    let info = await mchModel.findByPk(mchId)
    ctx.ret.data = info

    return ctx.ret
  }

  /**
   * 更新商户信息
   * @param {*} ctx 
   */
  async mchInfoUpdate(ctx) {
    let mchModel = (new this.models.mch_model()).model()
    let mchId = ctx.session.mch_id || 0
    let data = ctx.body

    let info = await mchModel.findByPk(mchId)
    info.mobile = data.mobile
    info.username = data.username
    info.password = data.password
    info.info = data.info || {}

    let udpateRet = await info.save
    if (!udpateRet) {
      ctx.ret.code = 1
      ctx.ret.message = '更新信息失败'
    }

    return ctx.ret
  }

  async mchUpdat(ctx) {
    this.logger.info(ctx.uuid, '/mchUpdat', ctx.body)
    let mchModel = new this.models.mch_model

    let data = ctx.body
    if (data.id) {
      let mch = await mchModel.model().findByPk(data.id)
      mch.mobile = data.mobile
      mch.username = data.username
      mch.password = data.password
      mch.info = data.info || {}
      await mch.save()

    } else {
      await mchModel.model().create({
        email: data.email,
        mobile: data.mobile,
        username: data.username,
        password: data.password,
        info: data.info
      })
    }

    return ctx.ret
  }

  async adminList(ctx) {
    this.logger.info(ctx.uuid, '/adminList', ctx.body)
    let adminModel = new this.models.admin_model
    let groupModel = adminModel.groupModel()
    let list = await adminModel.model().findAll({
      where: {
        status: {
          [Op.gte]: 0
        }
      }
    })


    let lists = []
    for (let index = 0; index < list.length; index++) {
      let item = list[index]
      if (item.group_id) {
        let group = await groupModel.findByPk(item.group_id)
        this.logger.info(ctx.uuid, '/adminList group', group)
        item.dataValues.group = {
          id: group.id,
          name: group.name
        }
      } else {
        item.dataValues.group = {
          id: 0,
          name: '超级管理'
        }
      }

      lists.push(item)
    }


    this.logger.info(ctx.uuid, '/adminList lists', lists)
    ctx.ret.data = lists
    return ctx.ret
  }

  async adminInfo(ctx) {
    this.logger.info(ctx.uuid, '/adminInfo', ctx.body)
    let adminModel = new this.models.admin_model
    let id = ctx.body.id
    let admin = await adminModel.model().findByPk(id)

    ctx.ret.data = admin
    return ctx.ret
  }

  async adminUpdate(ctx) {
    this.logger.info(ctx.uuid, '/adminUpdate', ctx.body)
    let adminModel = new this.models.admin_model

    let data = ctx.body
    if (data.id) {
      let admin = await adminModel.model().findByPk(data.id)
      admin.email = data.email
      admin.password = data.password
      admin.group_id = data.group_id
      admin.status = data.status
      await admin.save()

    } else {
      let admin = await adminModel.model().create({
        email: data.email,
        password: data.password,
        group_id: data.group_id
      })
    }

    return ctx.ret

  }

  async adminGroupInfo(ctx) {
    this.logger.info(ctx.uuid, '/adminGroupInfo', ctx.body, 'session', ctx.session)
    let adminModel = new this.models.admin_model

    let groupId = ctx.session.AUTH.admin.group_id || 0

    let info = await adminModel.getGroupInfo(groupId)
    // info.dataValues.rules = info.dataValues.rules.split(',')
    ctx.ret.data = info

    this.logger.info(ctx.uuid, '/adminGroupInfo', ctx.ret)

    return ctx.ret
  }

  async groupInfoGet(ctx) {
    this.logger.info(ctx.uuid, '/GroupInfoGet', ctx.body, 'session', ctx.session)
    let adminModel = new this.models.admin_model
    let groupModel = adminModel.groupModel()
    let groupId = ctx.body.id || 0

    let info = await groupModel.findByPk(groupId)
    // info.dataValues.rules = info.dataValues.rules.split(',')
    ctx.ret.data = info

    this.logger.info(ctx.uuid, '/GroupInfoGet', ctx.ret)

    return ctx.ret
  }

  async adminGroupUpdate(ctx) {
    this.logger.info(ctx.uuid, '/adminGroupUpdate', ctx.body)
    let adminModel = new this.models.admin_model

    let data = ctx.body
    console.log('==========', typeof data.rules)
    if (typeof data.rules !== 'string') {
      data.rules = data.rules.join(',')
    }

    if (data.id) {
      let group = await adminModel.groupModel().findByPk(data.id)
      group.name = data.name
      group.rules = data.rules
      group.status = data.status
      await group.save()

    } else {
      await adminModel.groupModel().create({
        name: data.name,
        rules: data.rules
      })
    }

    return ctx.ret
  }

  async groupList(ctx) {
    this.logger.info(ctx.uuid, '/groupList', ctx.body)

    let adminModel = new this.models.admin_model
    let groupModel = adminModel.groupModel()

    let groups = await groupModel.findAll({
      where: {
        status: {
          [Op.gte]: 0
        }
      }
    })

    groups.push({
      id: 0,
      name: '超级管理'
    })
    ctx.ret.data = groups || []
    return ctx.ret
  }

  async groupUpdate(ctx) {
    this.logger.info(ctx.uuid, '/groupUpdate', ctx.body)

    let data = ctx.body
    let adminModel = new this.models.admin_model
    let groupModel = adminModel.groupModel()
    let group
    if (data.id) {
      group = await groupModel.findByPk(data.id)
      await group.update(data)

    } else {
      group = await groupModel.create(data)
    }

    ctx.ret.data = group
    return ctx.ret
  }

  async groupDelete(ctx) {
    this.logger.info(ctx.uuid, '/groupDelete', ctx.body)

    let groupId = ctx.body.id
    let adminModel = new this.models.admin_model
    let groupModel = adminModel.groupModel()
    let group = await groupModel.findByPk(groupId)
    group.status = -1
    await group.save()

    ctx.ret.data = group
    return ctx.ret
  }

  async rulesList(ctx) {
    this.logger.info(ctx.uuid, '/rulesList', ctx.body)

    let adminModel = new this.models.admin_model
    let rulesModel = adminModel.rulesModel()
    let rules = await rulesModel.findAll({
      where: {
        status: 1
      },
      order: [
        ['pid', 'asc'],
        ['sort', 'asc'],
      ]
    })

    ctx.ret.data = rules
    return ctx.ret
  }
}

module.exports = AuthController