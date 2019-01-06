const Controller = require('./../../../lib/controller')
const cryptoUtils = require('./../../utils/crypto_utils')
const uuid = require('uuid')

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
    let userModel = (new this.models.user_model()).model()
    let user = await userModel.findOne({
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
    user.auth_token = token
    await user.save()
    ctx.ret.data = {
      token: token
    }
    this.logger.info(ctx.uuid, 'login()', 'ret', ctx.ret)
    return ctx.ret
  }

  async register(ctx) {
    this.logger.info(ctx.uuid, 'register()', 'body', ctx.body, 'query', ctx.query)

    let {
      mobile,
      password,
      verify_code
    } = ctx.body

    // TODO 短信验证
    if (verify_code != '0512') {
      ctx.ret.code = 1
      ctx.ret.message = '验证码错误'
    }

    let userModel = new this.models.user_model()
    let user = await userModel.model().findOne({
      where: {
        mobile: mobile
      }
    })
    this.logger.info(ctx.uuid, 'register()', 'user.find', user)

    if (user) {
      ctx.ret.code = 1
      ctx.ret.message = '请不要重复注册'
      return ctx.ret
    }

    password = cryptoUtils.hmacMd5(password, '')
    password
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

    let userInfo = await userModel.getInfoByUserId(user.id, mobile)
    this.logger.info(ctx.uuid, 'register()', 'user.userInfo', userInfo)

    ctx.ret.message = '注册成功'
    return ctx.ret
  }

  /**
   * 老用户登录
   * @param {*} ctx 
   */
  async signIn(ctx) {

  }

  /**
   * 绑定新密码
   */
  async signSetPwd() {

  }

  /**
   * 第三方登录
   * @param {*} ctx 
   */
  async signThird(ctx) {

  }

  /**
   * 三方登录绑定
   * @param {*} ctx 
   */
  async signThirdBind(ctx) {

  }


}

module.exports = AuthController