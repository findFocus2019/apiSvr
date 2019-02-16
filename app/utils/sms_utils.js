const request = require('superagent')
const apikey = '65f57ddca496686cc3b1e8187f5b849c'

class SmsUtils {

  /**
   * 发送单条短信
   * @param mobile 
   * @param code 
   */
  async sendVerifyCodeSms(mobile, code) {
    let post_data = {
      'apikey': apikey,
      'mobile': mobile,
      'text': `【发现焦点APP】您的验证码是${code}`,
    }
    return await this._post('https://sms.yunpian.com/v2/sms/single_send.json', post_data)
  }

  async _post(uri, content) {
    let result = await request.post(uri)
      .set('Accept', 'application/json;charset=utf-8;')
      .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8;')
      .send(content)
    console.log(result)
    return result.response
  }
}

module.exports = new SmsUtils()

