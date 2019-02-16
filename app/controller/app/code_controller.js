const Controller = require('./../../../lib/controller')
// const config = require('./../../../config')
const smsUtils = require('./../../utils/sms_utils')

class CodeController extends Controller {
  constructor(ctx) {
    super()
    this.logger.info(ctx.uuid, 'CodeController Constructor')
  }

  //发送
  async send(ctx) {
    try {
      let mobile = ctx.body.mobile || 0
      if (mobile) {
        let code = this._generateValidateCode()
        let verifyCodeModel = new this.models.verifycode_model
        let sendStatus = await smsUtils.sendVerifyCodeSms(mobile, code)
        let records = await verifyCodeModel.model().build({
          mobile: mobile,
          verify_code: code,
          status: 1
        }).save()
        this.logger.info(ctx.uuid, 'CodeController.send sendStatus ', sendStatus)
        ctx.ret.code = 200
        ctx.ret.message = '发送验证码成功'
      } else {
        ctx.ret.code = 400
        ctx.ret.message = '请检查参数'
      }
    } catch (err) {

      ctx.ret.code = 500
      if (err.response && err.response.text) {
        let text = JSON.parse(err.response.text)
        ctx.ret.message = text.msg || text
      } else {
        ctx.ret.message = '服务器错误'
      }

    }


    return ctx.ret
  }

  //验证
  async verify(ctx) {
    try {
      let {
        mobile,
        code
      } = ctx.body
      if (!mobile || !code) {
        ctx.ret.code = 400
        ctx.ret.message = '请检查参数'
      }
      let verifyCodeModel = new this.models.verifycode_model
      let rows = await verifyCodeModel.model().findOne({
        where: {
          mobile: mobile,
          verify_code: code,
        },
        order: [
          ['id', 'DESC']
        ]
      })
      //TODO 时间过期
      if (rows.status != 1) {
        ctx.ret.code = 403
        ctx.ret.message = '验证码已失效'
      } else {
        rows.status = 0
        await rows.save()
        ctx.ret.code = 200
        ctx.ret.message = '验证成功'
      }
      return ctx.ret
    } catch (err) {
      ctx.ret.code = 500
      ctx.ret.message = '服务器错误'
      ctx.ret.data = err
      return ctx.ret
    }

  }
  _generateValidateCode() {
    return Math.random().toString().substr(2, 4);
  }
}

module.exports = CodeController