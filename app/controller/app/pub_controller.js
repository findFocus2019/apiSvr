const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op
const request = require('superagent')
const jdUtils = require('../../utils/jd_utils')

class PubController extends Controller {

  /**
   * 系统公告
   * @param {*} ctx 
   */
  async notices(ctx) {

    this.logger.info(ctx.uuid, 'notices()', 'body', ctx.body, 'query', ctx.query)

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10

    let noticeModel = new this.models.notice_model

    let queryRet = await noticeModel.model().findAndCountAll({
      where: {
        status: 1
      },
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ]
    })

    queryRet.rows.forEach(row => {
      row.dataValues.create_date = this.utils.date_utils.dateFormat(row.create_time, 'YYYY-MM-DD HH:mm')
    })
    ctx.ret.data = {
      rows: queryRet.rows,
      count: queryRet.count,
      page: page
    }

    return ctx.ret
  }

  async configs(ctx) {
    this.logger.info(ctx.uuid, 'configs()', 'body', ctx.body, 'query', ctx.query)
    let configModel = new this.models.config_model
    let rows = await configModel.model().findAll({
      where: {
        status: 1
      }
    })

    let config = {}
    rows.forEach(row => {
      config[row.name] = row.content
    })

    ctx.ret.data = config
    return ctx.ret
  }

  async codeToSession(ctx) {
    this.logger.info(ctx.uuid, 'codeToSession()', 'body', ctx.body, 'query', ctx.query)
    let miniApp = this.config.miniApp
    let jscode = ctx.body.jscode
    let url = `https://api.weixin.qq.com/sns/jscode2session?appid=${miniApp.appId}&secret=${miniApp.appSecret}&js_code=${jscode}&grant_type=authorization_code`
    let json = await request.get(url).type('json')
    // console.log(json.text)
    this.logger.info(ctx.uuid, 'codeToSession()', 'json', json)
    ctx.ret.data = JSON.parse(json.text)
    return ctx.ret
  }

  async searchPosts(ctx) {

    let type = ctx.body.type || 0
    let keyword = ctx.body.keyword

    let postsModel = new this.models.posts_model

    let where = {}
    where.status = 1
    if (type) {
      where.type = type
    }
    where.title = {
      [Op.like]: '%' + keyword + '%'
    }

    let rows = await postsModel.model().findAll({
      where: where,
      offset: 0,
      limit: 1,
      order: [
        ['create_time', 'desc']
      ],
      attributes: this.config.postListAttributes
    })

    ctx.ret.data = {
      rows: rows
    }

    return ctx.ret
  }

  async searchGoods(ctx) {
    let keyword = ctx.body.keyword
    let mallModel = new this.models.mall_model

    let where = {}
    where.status = 1
    where.title = {
      [Op.like]: '%' + keyword + '%'
    }

    let rows = await mallModel.goodsModel().findAll({
      where: where,
      offset: 0,
      limit: 1,
      order: [
        ['create_time', 'desc']
      ],
      attributes: this.config.goodsListAttributes
    })

    ctx.ret.data = {
      rows: rows
    }

    return ctx.ret
  }

  async sendSmsCode(ctx) {
    let mobile = ctx.body.mobile
    let verifyModel = new this.models.verifycode_model
    let retMsg = await verifyModel.send(mobile)
    if(retMsg.code != 0){
      this._fail(ctx, retMsg.message)
    }
    return ctx.ret
  }

  // async verifyCode(ctx) {
  //   let { mobile, code } = ctx.body
  //   let verifyModel = new this.models.verifycode_model
  //   ctx.ret = await verifyModel.verify(mobile, code)
  //   return ctx.ret
  // }

  async albums(ctx) {
    let type = ctx.body.type || 'banner'
    let typeId = ctx.body.type_id || 0

    let where = {}
    where.type = type
    where.status = 1
    if (typeId) {
      where.type_id = typeId
    }

    this.logger.info(ctx.uuid , 'albums' , where)
    let albumModel = new this.models.album_model
    let rows = await albumModel.model().findAll({
      where: where,
      order: [
        ['sort', 'asc'],
        ['id', 'DESC']
      ],
      offset: 0,
      limit: 5
    })

    ctx.ret.data = {
      rows: rows
    }

    return ctx.ret

  }

  async getPushInfo(ctx){

    this.logger.info(ctx.uuid , 'pushInfo()' , ctx.body)
    let body = ctx.body

    let clientId = body.client_id
    let info = {
      platform: body.platform,
      status: body.status,
      token: body.push_token
    }

    let pushModel = new this.models.push_model
    let pushRet = await pushModel.infoByClient(clientId, info)
    this.logger.info(ctx.uuid , 'pushInfo() pushRet' , pushRet)
    if(!pushRet){
      ctx.ret.code = 1
      ctx.ret.message = '推送设备登记失败'
      
    }else{
      ctx.ret.data = {
        id: pushRet.id
      }
    }

    return ctx.ret

  }

  //获取京东联级地址
  async getAddress(ctx) {
    let type = ctx.body.type || ''
    let id = ctx.body.id || 0
    let data,dataObj,result=[]
    switch (type) {
      case 'city':
        data = await jdUtils.getCity(id)
        break;
      case 'county':
        data = await jdUtils.getCounty(id)
        break;
      case 'town':
        data = await jdUtils.getTown(id)
        break;
      default:
        data = await jdUtils.getProvince()
    }
    dataObj = JSON.parse(data)
    if (dataObj.success) {
      Object.keys(dataObj.result).forEach(item => {
        result.push({ id: dataObj.result[item], value: item })
      })
    }
    return result
  }
}

module.exports = PubController