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

    authInfo.user_id = user.id
    let userAuth = await userModel.authLogin(authInfo)
    if (!userAuth.token) {
      ctx.ret.code = 1
      ctx.ret.message = '请稍后重试'
      return ctx.ret
    } else {
      ctx.ret.data = {
        token: userAuth.token
      }
    }

    this.logger.info(ctx.uuid, 'login()', 'ret', ctx.ret)
    return ctx.ret
  }

  /**
   * 3方登录
   * @param {*} ctx 
   */
  async loginOauth(ctx) {
    this.logger.info(ctx.uuid, 'loginOauth()', 'body', ctx.body, 'query', ctx.query)

    let {
      platform,
      device,
      avatar,
      nickname,
      openid
    } = ctx.body

    if (['weixin', 'qq', 'sinaweibo'].indexOf(platform) < 0) {
      // TODO 微信小程序授权获取openid
    }

    let userModel = new this.models.user_model
    let oauth = await userModel.getOauthByPlatformAndOpenid({
      platform: platform,
      avatar: avatar,
      nickname: nickname,
      openid: openid
    })
    this.logger.info(ctx.uuid, 'loginOauth()', 'oauth', oauth)
    if (!oauth.user_id) {
      ctx.ret.code = 2
      ctx.ret.message = '请前往绑定'
      ctx.ret.data = {
        oauth_id: oauth.id
      }
      return ctx.ret
    }

    // let token = uuid.v4()
    let authData = {
      platform: platform,
      device: device,
      user_id: oauth.user_id,
      // token: token
    }

    let authRet = await userModel.authLogin(authData)
    if (!authRet.token) {
      ctx.ret.code = 1
      ctx.ret.message = '请稍后重试'
      return ctx.ret
    } else {
      ctx.ret.data = {
        token: authRet.token
      }

      userModel.getInfoByUserId(authRet.user_id).then(userInfo => {
        userInfo.avatar = avatar
        userInfo.nickname = nickname
        userInfo.save()
      })
    }

    this.logger.info(ctx.uuid, 'loginOauth()', 'ret', ctx.ret)
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
    } else if (type == 3) {
      password = cryptoUtils.hmacMd5(password, '')
      if (user) {
        if (user.password != '' && user.password != password) {
          ctx.ret.code = 1
          ctx.ret.message = '已有账号密码不正确'
          return ctx.ret
        } else {
          user.password = password
          await user.save()
        }
      } else {
        user = await userModel.model().create({
          mobile: mobile,
          password: password
        })
        this.logger.info(ctx.uuid, 'register(3)', 'user.create', user)

        if (!user) {
          ctx.ret.code = 1
          ctx.ret.message = '授权绑定注册失败'
          return ctx.ret
        }
      }

      // 3方登录绑定
      let oauthInfo = ctx.body.oauth_info
      let oauthId = oauthInfo.oauth_id
      let oauth = await userModel.oAuthModel().findByPk(oauthId)
      oauth.user_id = user.id
      let oauthRet = await oauth.save()
      if (!oauthRet) {
        ctx.ret.code = 1
        ctx.ret.message = '授权绑定失败'
        return ctx.ret
      } else {
        // 更新用户信息
        let userInfo = await userModel.getInfoByUserId(user.id)
        this.logger.info(ctx.uuid, 'register(3)', 'user.userInfo', userInfo)
        userInfo.avatar = oauthRet.avatar
        userInfo.nickname = oauthRet.nickname
        await userInfo.save()
      }

      let authData = {
        platform: oauthInfo.platform,
        device: oauthInfo.device,
        user_id: user.id
      }

      let authRet = await userModel.authLogin(authData)
      if (!authRet.token) {
        ctx.ret.code = 1
        ctx.ret.message = '请稍后重试'
        return ctx.ret
      } else {
        ctx.ret.data = {
          token: authRet.token
        }
      }
    }

    if (type != 3) {
      let userInfo = await userModel.getInfoByUserId(user.id, mobile)
      this.logger.info(ctx.uuid, 'register()', 'user.userInfo', userInfo)
    }

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