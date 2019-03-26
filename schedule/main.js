const Controller = require('./../lib/controller')
const nodeSchedule = require('node-schedule')
const ShowApiSdk = require('./../lib/showApi')
const dateUtils = require('./../app/utils/date_utils')
const jdUtils = require('./../app/utils/jd_utils')
const config = require('./../config')
const CommonControler = require('./../app/common/common_controller')
const Op = require('sequelize').Op

class Schedule extends CommonControler {

  async _init_() {
    let scheduleModel = new this.models.schedule_model
    let schedules = await scheduleModel.model().findAll({
      where:{
        status:1
      }
    })

    this.logger.info('schedules', schedules.length)
    this.logger.info('schedules count:', schedules.length)
    schedules.forEach(schedule => {
      let scheduleName = schedule.name
      let scheduleRule = schedule.rule

      if (this[scheduleName]) {
        // this.__proto__[scheduleName](scheduleRule)
        nodeSchedule.scheduleJob(scheduleRule, () => {
          this[scheduleName](this.logger)
          this.logger.info('schedule start : ', scheduleName, scheduleRule)
        })

      }


    })
  }

  /**
   * 发货七天未确认收货自动确认
   */
  async orderConfirm(){
    let logger = arguments[0] || this.logger
    let ctx = {
      uuid: this.utils.uuid_utils.v4()
    }
    let mallModel = new this.models.mall_model
    let orderModel = mallModel.orderModel()
    let expressTime = parseInt(Date.now()/ 1000) - 7 * 24 * 3600
    logger.info('orderConfirm()', expressTime)
    let orders = await orderModel.findAll({
      where: {
        status:2,
        [Op.or]: [
          {
            express_extend_num:0,
            express_time:{
              [Op.lt]:expressTime
            }
          },
          {
            express_extend_num:1,
            express_time:{
              [Op.lt]:expressTime - 7 * 24 * 3600
            }
          }
        ]
        
      }
    })

    logger.info('orderConfirm() orders', orders.length)

    for (let index = 0; index < orders.length; index++) {
      let order = orders[index]
      let t = await mallModel.getTrans()
      let completeRet = await this._orderComplete(ctx, order , t)
      if(completeRet.code == 0){
        logger.info(`orderConfirm() success: ${order.id}`)
      }else {
        logger.info(`orderConfirm() fail: ${order.id}`)
      }
      
    }
  }

  async rabateDealDay(){
    let ctx = {
      uuid: this.utils.uuid_utils.v4()
    }
    await this._rabateDealDay(ctx)
    await this._taskLogDealByUser(ctx)
  }

  async fetchNews() {
    let logger = arguments[0] || this.logger
    logger.info('fetchNews() start')
    let count = await this._fetchNews(logger)
    logger.info('fetchNews() end success ', count)
    // console.log('fetchNews ret', ret)
    // await this._saveNewsData()
  }

  async _fetchNews() {

    let logger = arguments[0] || this.logger
    logger.info('fetchNews() config', config.newsApi)
    let showApi = ShowApiSdk({
      appId: config.newsApi.appId,
      secret: config.newsApi.secret
    })

    let ret = await showApi.getData()
    logger.info('fetchNews()', ret.showapi_res_code)
    if (ret.showapi_res_code !== 0 || !ret.showapi_res_body || ret.showapi_res_body.ret_code !== 0) {
      logger.error('fetchNews() fetch news fail')
    }

    let pagebean = ret.showapi_res_body.pagebean
    let list = pagebean.contentlist

    let success = 0
    for (let index = 0; index < list.length; index++) {
      const item = list[index]
      if (item.html && item.imageurls.length) {
        logger.info('fetchNews()', item.title)
        await this._saveNewsData(item, logger)
        success++
      }
    }

    return success

  }

  async _saveNewsData(data) {
    // let data = require('./../tests/testNewsData')
    let logger = arguments[1] || this.logger

    if(!data.nid){
      return false
    }

    let newsData = {}
    newsData.type = 1
    newsData.title = data.title
    newsData.description = data.desc
    newsData.content = data.html
    newsData.pub_date = dateUtils.getTimestamp(data.pubDate)
    newsData.cover = (data.havePic && data.imageurls.length > 0) ? data.imageurls[0].url : ''
    newsData.imgs = data.imageurls
    newsData.channel = data.channelName.replace('最新', '')
    newsData.source = data.source
    newsData.link = data.link
    newsData.uuid = data.nid

    let postsModel = (new this.models.posts_model).model()
    let find = await postsModel.findOne({
      where: {
        uuid: newsData.uuid
      }
    })

    if (find) {
      let ret = await find.update(newsData)
      logger.info('fetchNews() update id:', ret.id)
    } else {
      let ret = await postsModel.create(newsData)
      logger.info('fetchNews() insert id:', ret.id)
    }

    return true

  }

  async syncCategory() {
    let logger = arguments[0] || this.logger
    logger.info('syncCategory() start')
    await jdUtils.syncCategory()
  }

  async syncGoods() {
    let logger = arguments[0] || this.logger
    logger.info('syncGoods() start')
    await jdUtils.syncGoods()
  }

  //京东自动下单
  async submitJdOrder() {
    //先获取京东未发货订单
    let mallModel = new this.models.mall_model
    let orderModel = mallModel.orderModel()
    let queryRet = await orderModel.findAndCountAll({
      where: {
        order_type: 2,
        status: 1
      },
      order: [
        ['create_time', 'desc']
      ]
    })
    let AppMallController = require('../app/controller/app/mall_controller')
    this.logger.info('Schedule submitJdOrder queryRet: ', queryRet.rows.length)
    //有对应订单，自助下单
    if (queryRet.rows.length > 0) {
      let orderList = queryRet.rows
      for (let index in orderList) {
        let order = orderList[index]
        let orderId = order.id
        let jdOrderId = ''
        let sku = []
        let orderPriceSnap = []
        //商品准备
        order.goods_items.forEach(item => {
          sku.push({
            num: 1,
            skuId: item.uuid, 
            bNeedAnnex: false,
            bNeedGift: true,
            // price: item.price_sell,
            // yanbao: [{skuId: item.uuid}]
          })
          orderPriceSnap.push({skuId: item.uuid, price: item.price_cost})
        })
        //参数准备
        let submitOrderParams = {
          thirdOrder: order.order_no,       
          sku: JSON.stringify(sku),
          name: order.address.name,
          province: order.address.province,
          city: order.address.city,
          county: order.address.county,
          town: order.address.town,
          address: order.address.address + order.address.info,
          mobile: order.address.mobile,
          email:'wang.wy@jurenchina.net',//要加
          // invoiceState: 1,
          invoiceContent: 100,
          paymentType: 4,
          isUseBalance: 1,
          submitState: 0,
          doOrderPriceMode:  1,
          orderPriceSnap: JSON.stringify(orderPriceSnap) ,
          invoicePhone: order.address.mobile
        }
      
      this.logger.info('Schedule submitJdOrder submitorderparams: ', submitOrderParams)
      let submitOrderResult = await AppMallController.submitOrder(submitOrderParams)
      this.logger.info('Schedule submitJdOrder submitOrderResult: ', submitOrderResult)
      //错误情况
        if (!submitOrderResult.success) {
          this.logger.error('Schedule submitJdOrder submitOrderResult: err', {
            code: submitOrderResult.resultCode,
            error: submitOrderResult.resultMessage
          })
        } else {
          jdOrderId = submitOrderResult.result.jdOrderId
        }

        // 拿到京东订单后，去确认支付
        if (jdOrderId) {
          let doPayResult = await AppMallController.confirmOrder(jdOrderId)
          if (!doPayResult.success) {
            return ctx.ret.data = {
              code: -4,
              error: '京东确认订单失败'
            }
          } else {
            orderModel.update({
              express: {company: 'JD', express_no: 'JDexpressNo'}, 
              express_time: parseInt(Date.now() / 1000),
              status: 2,
              jd_order_id: jdOrderId
            }, 
            {
              where: {id: orderId}
            })
            .then(result => {
              this.logger.info('Schedule submitJdOrder update result: ', result)
              // ctx.ret.data = {code: 0}
            })
            .catch(error => {
              this.logger.error('Schedule submitJdOrder error: ', error)
              // ctx.ret.data = {code: -3, error: '更新失败'}
            })
          }
        }
        
      
      }
    }else {
      this.logger.info('Schedule submitJdOrder 无结算订单')
    }
       
    
  }
}

function start() {
  let schedule = new Schedule()
  schedule._init_()
}

// start()
module.exports = {
  start: start,
  getSchedule: () => {
    return new Schedule()
  }
}