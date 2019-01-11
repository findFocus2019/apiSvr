const Controller = require('./../../../lib/controller')

class PubController extends Controller {

  /**
   * 系统公告
   * @param {*} ctx 
   */
  async notices(ctx) {

    this.logger.info(ctx.uuid, 'notices()', 'body', ctx.body, 'query', ctx.query)

    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10

    let noticeModel = this.models.notice_model

    let queryRet = await noticeModel.findAndCountAll({
      where: {
        status: 1
      },
      offset: (page - 1) * limit,
      limit: limit,
      order: [
        ['create_time', 'desc']
      ]
    })

    ctx.ret.data = {
      rows: queryRet.rows,
      count: queryRet.count,
      page: page
    }

    return ctx.ret
  }
}

module.exports = PubController