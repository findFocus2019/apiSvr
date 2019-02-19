const util = require('util');
const request = require('request');
const md5 = require('md5')
const config = {
  username: "深圳聚仁2018",
  password: "jd360buy",
  client_id: "5VQFKPYtsCZM2i3I4DD4",
  client_secret: "jDaqQBtlcYbvzzs50S9N"
}
class jdUtils{
  constructor() {
    // this.token = this.getAccessToken
  }
  
  async getAccessToken() {
    let params = {
      grant_type: 'access_token',
      client_id: config.client_id,
      client_secret: config.client_secret,
      timestamp: this._getCurrentTime(),
      username: config.username,
      password: md5(config.password),
      scope: '',
      sign: ''
    }
    let sign_str = params.client_secret+params.timestamp+params.client_id+params.username+params.password 
      + params.grant_type + params.scope + params.client_secret
    params.sign = md5(sign_str).toUpperCase()
    console.log('params',params)
    let url = 'https://bizapi.jd.com/oauth2/accessToken '

    return await this._ruquestUtil(params,url)
  }

  //商品相关 START
  //获取商品池编号接口
  async getPageNum(accessToken) {
    let params = {
      token:accessToken
    }
    let url = 'https://bizapi.jd.com/api/product/getPageNum'
    return await this._ruquestUtil(params,url)
  }

  /**
   * 获取池内商品编号接口-品类商品池
   * @param {*} accessToken 
   * @param {*} pageNum 商品池编号 
   * @param {*} pageNo  页码，默认取第一页；每页最多 10000 条数据，
   *                    品类商品池可能存在多页数据
   */
  async getSkuByPage(accessToken, pageNum, pageNo) {
    let params = {
      token: accessToken,
      pageNum: pageNum,
      pageNo: pageNo
    }
    let url = 'https://bizapi.jd.com/api/product/getSkuByPage'
    return await this._ruquestUtil(params,url)
  }
  

  /**
   * 获取商品详细信息接口 
   * @param {*} accessToken 
   * @param {*} sku 
   */
  async getDetail(accessToken,sku) {
    let params = {
      token: accessToken,
      sku: sku
    }
    let url = 'https://bizapi.jd.com/api/product/getDetail'
    return await this._ruquestUtil(params,url)
  }

  /**
   * 获取商品上下架状态接口 
   * @param {*} accessToken 
   * @param {*} sku 
   */
  async skuState(accessToken,sku) {
    let params = {
      token: accessToken,
      sku: sku
    }
    let url = 'https://bizapi.jd.com/api/product/skuState'
    return await this._ruquestUtil(params,url)
  }

  /**
   *  获取所有图片信息
   * @param {*} accessToken 
   * @param {*} sku 
   */
  async skuImage(accessToken, sku) {
    let params = {
      token: accessToken,
      sku: sku
    }
    let url = 'https://bizapi.jd.com/api/product/skuImage'
    return await this._ruquestUtil(params,url)
  }
  
  //商品相关 END

  //商品价格
  async getSellPrice(accessToken,sku) {
    let params = {
      token: accessToken,
      sku: sku
    }
    let url = 'https://bizapi.jd.com/api/price/getSellPrice'
    return await this._ruquestUtil(params,url)
  }

  async _ruquestUtil(params, url) {
    try {
      let action = await util.promisify(request)({
        method: 'POST',
        url: url,
        formData: params
      })
      // console.log(action)
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
// (async () => {
//   let demo = new jdUtils
//   let data = await demo.getSellPrice('SbTNlbSsXtVTSYVFQeAFOHUcq',405684)
//   console.log(data)
 
// })()

module.exports = new jdUtils