const Controller = require('./../lib/controller')
const nodeSchedule = require('node-schedule')
const ShowApiSdk = require('./../lib/showApi')
const dateUtils = require('./../app/utils/date_utils')
const config = require('./../config')

class Schedule extends Controller {

  async _init_() {
    let scheduleModel = new this.models.schedule_model
    let schedules = await scheduleModel.model().findAll({
      status: 1
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