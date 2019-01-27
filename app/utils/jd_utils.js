const util = require('util');
const request = require('request');

class jdUtils{

  async getAccessToken() {
    let params = {
      grant_type: 'access_token',
      client_id: '',
      client_secret: '',
      timestamp: this._getCurrentTime(),
      username: '',
      password: '',
      scope: '',
      sign: ''
    }
    let url = 'https://bizapi.jd.com/oauth2/accessToken '

    return this._ruquestUtil(params,url)
  }

  async _ruquestUtil(params, url) {
    try {
      let action = await util.promisify(request)({
        method: 'POST',
        url: url,
        formData: params
      })
      return action.body
    } catch (err) {
      return err
    }
  }

  /**
   * 获取当前时间 格式：yyyy-MM-dd HH:MM:SS
   */
  _getCurrentTime() {
      let date = new Date();//当前时间
      let month = this._zeroFill(date.getMonth() + 1);//月
      let day = this._zeroFill(date.getDate());//日
      let hour = this._zeroFill(date.getHours());//时
      let minute = this._zeroFill(date.getMinutes());//分
      let second = this._zeroFill(date.getSeconds());//秒
      
      //当前时间
      let curTime = date.getFullYear() + "-" + month + "-" + day
              + " " + hour + ":" + minute + ":" + second;
      return curTime;
  }
   
  /**
   * 补零
   */
  _zeroFill(i) {
    if (i >= 0 && i <= 9) {
      return "0" + i;
    } else {
      return i;
    }
  }
}

module.exports = new jdUtils