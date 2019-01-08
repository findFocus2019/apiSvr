const Controller = require('./../../../lib/controller')
const cryptoUtils = require('./../../utils/crypto_utils')
const uuid = require('uuid')
const config = require('./../../../config')

class AuthController extends Controller {

  constructor(ctx) {
    // super.constructor()
    super()
    this.logger.info(ctx.uuid, 'AuthController Constructor')

    ;
    (async () => {
      this.logger.info(ctx.uuid, 'AuthController.constructor async ')
    })()
  }

  /**
   * 登录
   * @param {*} ctx 
   */
  async login(ctx) {
    this.logger.info(ctx.uuid, 'login()', 'body', ctx.body, 'query', ctx.query)

    let {
      mobile,
      password
    } = ctx.body
    let authInfo = ctx.body.auth_info

    let userModel = (new this.models.user_model())
    let user = await userModel.model().findOne({
      where: {
        mobile: mobile
      }
    })
    this.logger.info(ctx.uuid, 'login()', 'user', user)

    if (!user || user.password != cryptoUtils.hmacMd5(password, '')) {
      ctx.ret.code = 1
      ctx.ret.message = '账号或密码错误'
      return ctx.ret
    }

    let token = uuid.v4()
    authInfo.user_id = user.id
    authInfo.token = token
    let userAuth = await userModel.authLogin(authInfo)
    if (!userAuth.token) {
      ctx.ret.code = 1
      ctx.ret.message = '请稍后重试'
      return ctx.ret
    } else {
      ctx.ret.data = {
        token: token
      }
    }

    this.logger.info(ctx.uuid, 'login()', 'ret', ctx.ret)
    return ctx.ret
  }

  async register(ctx) {
    this.logger.info(ctx.uuid, 'register()', 'body', ctx.body, 'query', ctx.query)

    let {
      mobile,
      password,
      verify_code,
      type
    } = ctx.body
    // type 0:注册 1:忘记密码 2:老用户绑定 3:3方登录绑定

    // TODO 短信验证
    if (verify_code != '0512') {
      ctx.ret.code = 1
      ctx.ret.message = '验证码错误'
      return ctx.ret
    }

    let userModel = new this.models.user_model()
    let user = await userModel.model().findOne({
      where: {
        mobile: mobile
      }
    })
    this.logger.info(ctx.uuid, 'register()', 'user.find', user)

    if (type == 0) {
      if (user) {
        ctx.ret.code = 1
        ctx.ret.message = '请不要重复注册'
        return ctx.ret
      }

      password = cryptoUtils.hmacMd5(password, '')
      user = await userModel.model().create({
        mobile: mobile,
        password: password
      })
      this.logger.info(ctx.uuid, 'register()', 'user.create', user)

      if (!user) {
        ctx.ret.code = 1
        ctx.ret.message = '注册失败'
        return ctx.ret
      }

      ctx.ret.message = '注册成功'

    } else if (type == 1 || type == 2) {
      if (!user) {
        ctx.ret.code = 1
        ctx.ret.message = '无效账号,请先注册'
        return ctx.ret
      }
      if (type == 2) {
        if (user.password) {
          ctx.ret.code = 1
          ctx.ret.message = '密码已重置过，请返回登录'
          return ctx.ret
        }
      }

      user.password = cryptoUtils.hmacMd5(password, '')
      await user.save()

      ctx.ret.message = '重置密码成功'
    }

    let userInfo = await userModel.getInfoByUserId(user.id, mobile)
    this.logger.info(ctx.uuid, 'register()', 'user.userInfo', userInfo)

    if (type == 0) {
      // 发送现金
      let t = await userModel.getTrans()
      let taskModel = new this.models.task_model
      let taskData = {
        user_id: user.id,
        model_id: 0,
        ip: ctx.ip
      }
      taskModel.logByName(ctx, config.tasks.REGISTER, taskData, t).then(ret => {
        if (ret.code === 0) {
          t.commit()
        } else {
          t.rollback()
        }
      })

    }
    return ctx.ret
  }


}

module.exports = AuthController