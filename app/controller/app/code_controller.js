const Controller = require('./../../../lib/controller')
const config = require('./../../../config')
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
        let code = 234567 //TODO 
        let verifyCodeModel = new this.models.verifycode_model
        // let records = await verifyCodeModel.model().build({
        //   mobile: mobile,
        //   verify_code: code,
        //   status: 1
        // }).save()
        // this.logger.info(ctx.uuid, 'CodeController.send records ',records,'mobile',mobile,'verify_code',verify_code)
        // smsUtils.sendVerifyCodeSms(mobile, code)
        ctx.ret.code = 200
        ctx.ret.message = '发送验证码成功'
      } else {
        ctx.ret.code = 400
        ctx.ret.message = '请检查参数'
      }
    } catch (err) {
        ctx.ret.code = 500
        ctx.ret.message = '服务器错误'
    }
    
  
    return ctx.ret
  }

  //验证
  async verfiy(ctx) {
    return ctx.ret
  }
}

module.exports = CodeController