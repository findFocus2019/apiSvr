const https = require('https')
const qs = require('querystring')
const apikey = '65f57ddca496686cc3b1e8187f5b849c'


class SmsUtils {

  sendVerifyCodeSms(mobile, code) {
    let post_data = {
      'apikey': apikey,
      'mobile': mobile,
      'text': `【发现焦点APP】您的验证码是${code}`,
    } //这是需要提交的数据  
    let content = qs.stringify(post_data)
    this.post('/v2/sms/single_send.json', content, 'sms.yunpian.com')
  }

  query_user_info() {
    let post_data = {
      'apikey': apikey,
    } //这是需要提交的数据
    let content = qs.stringify(post_data)
    this.post('/v2/user/get.json', content, 'sms.yunpian.com')
  }

  post(uri, content, host) {
    let options = {
      hostname: host,
      port: 443,
      path: uri,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded charset=UTF-8'
      }
    }
    let req = https.request(options, function (res) {
      // console.log('STATUS: ' + res.statusCode)  
      // console.log('HEADERS: ' + JSON.stringify(res.headers))  
      res.setEncoding('utf8')
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk)
      })
    })
    //console.log(content)
    req.write(content)

    req.end()
  }
}
// let demo = new SmsUtils()
// demo.query_user_info(17666136141,8675)
module.exports = new SmsUtils()