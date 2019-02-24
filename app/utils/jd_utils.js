const util = require('util')
const request = require('request')
const fs = require('fs')
const md5 = require('md5')
const path = require('path')
const eventEmitter = require('events').EventEmitter
const models = require('./../model/index')
const Op = require('sequelize').Op
const config = {
  username: "深圳聚仁2018",
  password: "jd360buy",
  client_id: "5VQFKPYtsCZM2i3I4DD4",
  client_secret: "jDaqQBtlcYbvzzs50S9N",
  tokenFilePath: path.resolve(__dirname+'/token'),
  tokenFile:'/jd_token'
}


class jdUtils{

  constructor() {
    //监听自定义事件
    this.myEmitter = new eventEmitter()
    // this.myEmitter.on('insertGood',this.handleInsertGoodEvent)
    this.myEmitter.on('updateCategory', this.hanldeUpdateCategory)
    this.syncGoodsInfo = {
      delayTime: 1000,
      intervalTime: 500
    }
  }
  //同步商品入库
  async syncGoods() {
    try {
      let allPageNum = await this.getPageNum()
      let pageNumsObj = JSON.parse(allPageNum)
      if (pageNumsObj.resultCode != '0000') { 
        return false
      }
      let numsResult = pageNumsObj.result
      for (let index in numsResult) {
    //     console.log(numsResult[index].page_num)
        let skus = await this.getSkuByPage(numsResult[index].page_num);
        let skusObj = JSON.parse(skus)
        if (skusObj.resultCode != "0000") { return false }
        let pageCount = skusObj.result.pageCount
        //现在暂时每个分类都是一页，不考虑分页，后续可以改进
        let skusResult = skusObj.result.skuIds
        // console.log({ pageCount, skusResult })
        //拿到结果，异步执行
        this.handleInsertGoodEvent(skusResult,numsResult[index].page_num)
        // this.myEmitter.emit('insertGood',skusResult,numsResult[index].page_num)
        
      }
      return true
    } catch (err) {
      
    }
    
  }

  //同步分类信息
  async syncCategory() {
    let allPageNum = await this.getPageNum()
    let allPageNumObj = JSON.parse(allPageNum)
    if (allPageNumObj.resultCode != "0000") {
      return  false
    }
    let numsResult = allPageNumObj.result
    for (let index in numsResult) { 
       this.myEmitter.emit('updateCategory',numsResult[index])
      // console.log(numsResult[index].page_num,numsResult[index].name)
    }
    return true
  }
  
  async getAccessToken() {
    let token = config.tokenFilePath + config.tokenFile
    let tokenFile = fs.readFileSync(token)
    let tokenObj = {}
    if (tokenFile.length>0) tokenObj = JSON.parse(tokenFile) 
    let millisecond = Date.now()
    let rspData

    if (Object.keys(tokenObj).length > 0) {
      switch (true) {
        //有效期内
        case millisecond - tokenObj.time < tokenObj.expires_in * 1000:
          return tokenObj.access_token
        //过期时,可刷新token时间内
        case tokenObj.refresh_token_expires > millisecond:
          rspData = await this._refreshToken(tokenObj.refresh_token)
          break;
      } 
    } else {
      rspData = await this._getToken()
    }
    let rspObj = JSON.parse(rspData)
    if (rspObj.success) {
      fs.writeFileSync(token, JSON.stringify(rspObj.result))
      return rspObj.result.access_token
    } else {
      return 'request token err'
    }
    
  }

  async _getToken() {
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
    return await this._ruquestUtil(params, url)
  }

  async _refreshToken(refresh_token) {
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
  async getPageNum() {
    let params = {
      token: await this.getAccessToken()
    }
    let url = 'https://bizapi.jd.com/api/product/getPageNum'
    return await this._ruquestUtil(params,url)
  }

  /**
   * 获取池内商品编号接口-品类商品池
   * @param {*} pageNum 商品池编号 
   * @param {*} pageNo  页码，默认取第一页；每页最多 10000 条数据，
   *                    品类商品池可能存在多页数据
   */
  async getSkuByPage( pageNum, pageNo=1) {
    let params = {
      token: await this.getAccessToken(),
      pageNum: pageNum,
      pageNo: pageNo
    }
    let url = 'https://bizapi.jd.com/api/product/getSkuByPage'
    return await this._ruquestUtil(params,url)
  }
  

  /**
   * 获取商品详细信息接口 
   * @param {*} accessToken 
   * @param {*} skuId 
   */
  async getDetail(skuId) {
    let params = {
      token: await this.getAccessToken(),
      sku: skuId
    }
    let url = 'https://bizapi.jd.com/api/product/getDetail'
    return await this._ruquestUtil(params,url)
  }

  /**
   * 获取商品上下架状态接口 
   * @param {*} accessToken 
   * @param {*} sku 
   */
  async skuState(sku) {
    let params = {
      token: await this.getAccessToken(),
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
  async skuImage(sku) {
    let params = {
      token: await this.getAccessToken(),
      sku: sku
    }
    let url = 'https://bizapi.jd.com/api/product/skuImage'
    return await this._ruquestUtil(params,url)
  }
  
  //商品相关 END

  //批量查询商品售卖价
  async getSellPrice(sku) {
    let params = {
      token: await this.getAccessToken(),
      sku: sku
    }
    let url = 'https://bizapi.jd.com/api/price/getSellPrice'
    return await this._ruquestUtil(params,url)
  }

  //库存相关 START
  //批量获取库存接口（建议订单详情页、下单使用）
  async getNewStockById(skuNums, area) {
    let params = {
      token: await this.getAccessToken(),
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
  async getStockById(sku,area) {
    let params = {
      token: await this.getAccessToken(),
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
  async submitOrder(orderParams){
    let params = {
      token: await this.getAccessToken()
    }
    Object.keys(orderParams).forEach(item => {
      params[item] = orderParams[item]
    })
    let url = 'https://bizapi.jd.com/api/order/submitOrder'
    return await this._ruquestUtil(params,url)
  }


  //确认预占库存订单接口
  async confirmOrder( jdOrderId, companyPayMoney) {
    let params = {
      token: await this.getAccessToken(),
      jdOrderId: jdOrderId,
      companyPayMoney: companyPayMoney
    }
    let url = 'https://bizapi.jd.com/api/order/confirmOrder'
    return await this._ruquestUtil(params,url)
  }

  //取消未确认订单接口
  async orderCancel(jdOrderId) {
    let params = {
      token: await this.getAccessToken(),
      jdOrderId: jdOrderId
    }
    let url = 'https://bizapi.jd.com/api/order/cancel'
    return await this._ruquestUtil(params,url)
  }

  /**
   * 发起支付接口 
   * @param {*} orderId 
   */
  async doPay(orderId) {
    
    let params = {
      token: await this.getAccessToken(),
      jdOrderId: orderId
    }
    let url = 'https://bizapi.jd.com/api/order/doPay'
    return await this._ruquestUtil(params,url)
  }

  /**
   * 获取京东预约日历 
   * @param {*} calendarParams 
   */
  async promiseCalendar(calendarParams) {
    let params = {
      token: await this.getAccessToken()
    }
    Object.keys(calendarParams).forEach(item => {
      params[item] = calendarParams[item]
    })
    let url = 'https://bizapi.jd.com/api/order/promiseCalendar'
    return await this._ruquestUtil(params,url)
  }

  //订单反查
  async selectJdOrderIdByThirdOrder() {
    let url = 'https://bizapi.jd.com/api/order/selectJdOrderIdByThirdOrder'
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
        form: params
      })
      // console.log(action)
      return action.body
    } catch (err) {
      console.log(err)
      return 'err'
    }
  }

  

  //插入或更新数据库事件处理
  async handleInsertGoodEvent(skusResult,page_num) {
    process.nextTick(async () => {
      try {
        /**
         * content introduction
         * cover imgPrePath+imagePath
         * uuid sku
         * status state
         * title name
         * type 2
         * category  page_num
         * description ''
         * stock 库存
         * */  
        skusResult.forEach(async (sku) => {
          //图书和音像没有，暂时不做，判断代码保留
          // let BookOrRadioRegExp = /^\d{8}$/
          // if (BookOrRadioRegExp.test(sku)) {
          //   console.log('BookOrRadioRegExp')
          // } else {
          //   console.log('good')
          // }
          setTimeout(async () => {
            let goods = await this.getDetail(sku)
            let goodsObj = JSON.parse(goods)
            if (goodsObj.resultCode == "0000") { 
              let goodInfo = goodsObj.result
              // console.log(goodInfo)
              let MallModel = new models.mall_model
              await MallModel.updateJDGood(goodInfo,page_num)
            }
          },this.syncGoodsInfo.delayTime)
          this.syncGoodsInfo.delayTime += this.syncGoodsInfo.intervalTime
          // console.log(typeof getDetailFunc)
        })
        // console.log(skusResult.length)
      } catch (err) {
        console.log(err)
      }
    })
  }

  /**
   * 更新分类事件
   * @param {*} jdCategory 
   */
  async hanldeUpdateCategory(jdCategory) {
    try {
      let MallModel = new models.mall_model
      await MallModel.updateJDCategory(jdCategory)
    } catch (err) {
      console.log(err)
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
//

(async () => {
  let demo = new jdUtils
  // let data = await demo.getDetail(100000016109)
  // let dataObj = JSON.parse(data)
  let data = await demo.syncGoods()
  // let data = await demo.getDetail(100001409446)
  
  console.log(data)
 
})()

module.exports = new jdUtils