/**
 * 登录，登出
 */

const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op

class AuthController extends Controller {
  constructor (ctx) {
    super()
  }

  /**
   * 登录
   * @param {*} ctx 
   */
  async login (ctx) {
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
      this.logger.info('login: 账号密码错误' )
      ctx.ret.code = 1
      ctx.ret.message = '账号密码错误'
      // ctx.ret.data = {code: 1, msg: '账号密码错误'}
    } else {
      // ctx.session.AUTH = {admin:admin}
      // ctx.ret.data = {code: 0, msg: 'success', data: {}}
      ctx.ret.data = {admin: admin}
      ctx.ret.session = {
        AUTH: {admin: admin}
      }

    }

    this.logger.info('login: ', ctx.ret)
    return ctx.ret
  }

  /**
   * 登出
   * @param {*} ctx 
   */
  async logout (ctx) {
    this.logger.info('logout: ', ctx.body)

    // 清除session
    ctx.session.admin = {}
  }

  async adminList(ctx) {
    this.logger.info(ctx.uuid, '/adminList' , ctx.body )
    let adminModel = new this.models.admin_model
    let groupModel = adminModel.groupModel()
    let list = await adminModel.model().findAll({
      where: {
        status : {
          [Op.gte]: 0
        }
      }
    })


    let lists = []
    for (let index = 0; index < list.length; index++) {
      let item = list[index]
      if(item.group_id){
        let group = await groupModel.findByPk(item.group_id)
        this.logger.info(ctx.uuid, '/adminList group' , group)
        item.dataValues.group = {
          id: group.id,
          name: group.name
        }
      }else {
        item.dataValues.group = {
          id: 0,
          name: '超级管理'
        }
      }

      lists.push(item)
    }
    

    this.logger.info(ctx.uuid, '/adminList lists' , lists)
    ctx.ret.data = lists
    return ctx.ret
  }

  async adminInfo(ctx){
    this.logger.info(ctx.uuid, '/adminInfo' , ctx.body )
    let adminModel = new this.models.admin_model
    let id = ctx.body.id
    let admin = await adminModel.model().findByPk(id)

    ctx.ret.data = admin
    return ctx.ret
  }

  async adminUpdate(ctx){
    this.logger.info(ctx.uuid, '/adminUpdate' , ctx.body )
    let adminModel = new this.models.admin_model

    let data = ctx.body
    if(data.id){
      let admin = await adminModel.model().findByPk(data.id)
      admin.email = data.email
      admin.password = data.password
      admin.group_id = data.group_id
      admin.status = data.status
      await admin.save()
      
    }else {
      let admin = await adminModel.model().create({
        email: data.email,
        password: data.password,
        group_id: data.group_id
      })
    }

    return ctx.ret

  }

  async adminGroupInfo(ctx){
    this.logger.info(ctx.uuid, '/adminGroupInfo' , ctx.body , 'session' , ctx.session)
    let adminModel = new this.models.admin_model

    let groupId = ctx.session.AUTH.admin.group_id || 0

    let info = await adminModel.getGroupInfo(groupId)
    ctx.ret.data = info

    this.logger.info(ctx.uuid, '/adminGroupInfo' , ctx.ret)
    
    return ctx.ret
  }

  async groupList(ctx){
    this.logger.info(ctx.uuid, '/groupList' , ctx.body)

    let adminModel = new this.models.admin_model
    let groupModel = adminModel.groupModel()

    let groups = await groupModel.findAll({
      where: {
        status: 1
      }
    })

    groups.push({
      id: 0,
      name : '超级管理'
    })
    ctx.ret.data = groups || []
    return ctx.ret
  }

  async groupUpdate(ctx){
    this.logger.info(ctx.uuid, '/groupList' , ctx.body)

    let data = ctx.body
    let adminModel = new this.models.admin_model
    let groupModel = adminModel.groupModel()
    let group 
    if(data.id){
      group = await groupModel.findByPk(data.id)
      await group.update(data)

    }else {
      group = await groupModel.create(data)
    }

    ctx.ret.data = group
    return ctx.ret
  }
  
  async groupDelete(ctx){
    this.logger.info(ctx.uuid, '/groupList' , ctx.body)

    let groupId = ctx.body.id 
    let adminModel = new this.models.admin_model
    let groupModel = adminModel.groupModel()
    let group = await groupModel.findByPk(groupId)
    group.status = -1
    await group.save()

    ctx.ret.data = group
    return ctx.ret
  }
}

module.exports = AuthController