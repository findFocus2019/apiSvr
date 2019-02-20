const util = require('util')
const request = require('request')
const fs = require('fs')
const md5 = require('md5')
const config = {
  username: "深圳聚仁2018",
  password: "jd360buy",
  client_id: "5VQFKPYtsCZM2i3I4DD4",
  client_secret: "jDaqQBtlcYbvzzs50S9N",
  tokenFile:'jd_token'
}
class jdUtils{
  constructor() {
    // this.token = this.getAccessToken
  }
  
  async getAccessToken() {
    let tokenFile = fs.readFileSync(config.tokenFile)
    let tokenObj = JSON.parse(tokenFile)
    let millisecond = Date.now()
    // let second = Math.floor(millisecond / 1000)
    let rspData
    if (tokenObj) {
      switch (true) {
        //有效期内
        case millisecond - tokenObj.time < tokenObj.expires_in * 1000:
          return tokenObj.access_token
        //过期时,可刷新token时间内
        case tokenObj.refresh_token_expires > millisecond:
          rspData = await this.refreshToken(tokenObj.refresh_token)
          break;
      }
    } else {
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
        let sign_str = params.client_secret + params.timestamp + params.client_id + params.username + params.password 
            + params.grant_type + params.scope + params.client_secret
        params.sign = md5(sign_str).toUpperCase() 
        let url = 'https://bizapi.jd.com/oauth2/accessToken'
        rspData = await this._ruquestUtil(params, url)
    }
   
    let rspObj = JSON.parse(rspData)
    if (rspObj.success) {
      fs.writeFileSync('jd_token', JSON.stringify(rspObj.result))
      return rspObj.result.access_token
    } else {
      return 'request token err'
    }
    
  }

  async refreshToken(refresh_token) {
    let params = {
      refresh_token: refresh_token,
      client_id: config.client_id,
      client_secret:config.client_secret
    }
    let url = 'https://bizapi.jd.com/oauth2/refreshToken'
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

  //批量查询商品售卖价
  async getSellPrice(accessToken,sku) {
    let params = {
      token: accessToken,
      sku: sku
    }
    let url = 'https://bizapi.jd.com/api/price/getSellPrice'
    return await this._ruquestUtil(params,url)
  }

  //库存相关 START
  //批量获取库存接口（建议订单详情页、下单使用）
  async getNewStockById(accessToken, skuNums, area) {
    let params = {
      token: accessToken,
      skuNums: skuNums,
      area: area
    }
    let url = 'https://bizapi.jd.com/api/stock/getNewStockById'
    return await this._ruquestUtil(params,url)
  }

  /**
   * 批量获取库存接口(建议商品列表页使用)
   *  
    授权时获取的 access token  
    商品编号 批量以逗号分隔  (最高支持 100 个商品)  
    格式：1_0_0 (分别代表 1、2、3 级地址) 
   */
  async getStockById(accessToken,sku,area) {
    let params = {
      token: accessToken,
      sku: sku,
      area: area
    }
    let url = 'https://bizapi.jd.com/api/stock/getStockById'
    return await this._ruquestUtil(params,url)
  }
  //库存相关 END


  //订单相关 START
  /**
   * 统一下单接口
   * @param {*} accessToken 
   * @param {*} params
   *  
   */
  async submitOrder(accessToken,orderParams){
    let params = {
      token: accessToken
    }
    Object.keys(orderParams).forEach(item => {
      params[item] = orderParams[item]
    })
    let url = 'https://bizapi.jd.com/api/order/submitOrder'
    return await this._ruquestUtil(params,url)
  }


  //确认预占库存订单接口
  async confirmOrder(accessToken, jdOrderId, companyPayMoney) {
    let params = {
      token: accessToken,
      jdOrderId: jdOrderId,
      companyPayMoney: companyPayMoney
    }
    let url = 'https://bizapi.jd.com/api/order/confirmOrder'
    return await this._ruquestUtil(params,url)
  }

  //取消未确认订单接口
  async orderCancel(accessToken, jdOrderId) {
    let params = {
      token: accessToken,
      jdOrderId: jdOrderId
    }
    let url = 'https://bizapi.jd.com/api/order/cancel'
    return await this._ruquestUtil(params,url)
  }

  //订单相关 END

  //地址相关 start

  //获取一级地址 
  async getProvince(token) {
    let params = {
      token: token
    }
    let url = 'https://bizapi.jd.com/api/area/getProvince'
    return await this._ruquestUtil(params,url)
  }

  //二级地址
  async getCity(token, id) {
    let params = {
      token: token,
      id: id
    }
    let url = 'https://bizapi.jd.com/api/area/getCity'
    return await this._ruquestUtil(params,url)
  }

  //三级地址
  async getCounty(token, id) {
    let params = {
      token: token,
      id: id
    }
    let url = 'https://bizapi.jd.com/api/area/getCounty'
    return await this._ruquestUtil(params,url)
  }
  
  //四级地址
  async getTown(token, id) {
    let params = {
      token: token,
      id: id
    }
    let url = 'https://bizapi.jd.com/api/area/getTown'
    return await this._ruquestUtil(params,url)
  }

  //验证四级地址是否正确 
  async checkArea(token, provinceId,cityId,countyId=0,townId=0) {
    let params = {
      token: token,
      provinceId: provinceId,
      cityId: cityId,
      countyId: countyId,
      townId:townId
    }
    let url = 'https://bizapi.jd.com/api/area/checkArea'
    return await this._ruquestUtil(params,url)
 
  }

  //根据地址查询京东地址编码
  async getJDAddressFromAddress(token,address) {
    let params = {
      token: token,
      address: address
    }
    let url = 'https://bizapi.jd.com/api/area/getJDAddressFromAddress'
    return await this._ruquestUtil(params,url)
  }

  //根据经纬度查询京东地址编码
  async getJDAddressFromLatLng(token, lng, lat) {
    let params = {
      token: token,
      lng: lng,
      lat: lat
    }
    let url = 'https://bizapi.jd.com/api/area/getJDAddressFromLatLng'
    return await this._ruquestUtil(params,url)
  }
   //地址相关 END
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
(async () => {
  let demo = new jdUtils
  let data = await demo.getAccessToken()
  console.log(data)
 
})()

module.exports = new jdUtils