const Model = require('./../../lib/model')
const {
  verifycode
} = require('./../../config/models')
const smsUtils = require('./../utils/sms_utils')

class VerifyCodeModel extends Model {
  model() {
    return this.db().define('verify_code_records', verifycode()[0], verifycode()[1])
  }

  //发送
  async send(mobile) {
    let ret = {}
    try {
      if (mobile) {
        let code = this._generateValidateCode()
        await smsUtils.sendVerifyCodeSms(mobile, code)
        await this.model().build({
          mobile: mobile,
          verify_code: code,
          status: 1
        }).save()
        ret.code = 0
        ret.message = '发送验证码成功'
      } else {
        ret.code = 400
        ret.message = '请检查参数'
      }
    } catch (err) {
      ret.code = 500
      ret.message = '服务器错误'
    }
    return ret
  }

  async verify(mobile, code) {
    let ret = {}
    try {
      if (!mobile || !code) {
        ret.code = 400
        ret.message = '请检查参数'
      }
      let rows = await this.model().findOne({
        where: {
          mobile: mobile,
          verify_code: code,
        },
        order: [
          ['id', 'DESC']
        ]
      })
      console.log('verify =================', rows.status)
      //TODO 时间过期
      if (rows.status != 1) {
        ret.code = 403
        ret.message = '验证码已失效'
      } else {
        rows.status = 1
        await rows.save()
        ret.code = 0
        ret.message = '验证成功'
      }
      return ret
    } catch (err) {
      ret.code = 500
      ret.message = '服务器错误'
      // ret.data = err
      return ret
    }

  }

  _generateValidateCode() {
    return Math.random().toString().substr(2, 4);
  }
}

module.exports = VerifyCodeModel