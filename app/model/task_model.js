const Model = require('./../../lib/model')
const dateUtils = require('./../utils/date_utils')
const Log = require('./../../lib/log')('task_model')

const {
  task,
  taskLogs,
  userInfo,
  config
} = require('./../../config/models')

class TaskModel extends Model {
  model() {
    return this.db().define('task', task()[0], task()[1])
  }

  logsModel() {
    return this.db().define('task_logs', taskLogs()[0], taskLogs()[1])
  }

  userInfoModel() {
    return this.db().define('user_info', userInfo()[0], userInfo()[1])
  }

  configModel() {
    return this.db().define('notice', config()[0], config()[1])
  }

  /**
   * 
   * @param {*} ctx 
   * @param {*} name 
   * @param {
   *  user_id
   *  model_id
   *  ip,
   *  ext_num: 0 // 额外数量，比如签到,商品购买
   * } data 
   * @param {*} t 
   */
  async logByName(ctx, name, data, t) {
    let ret = {
      code: 0,
      message: ''
    }
    Log.info(ctx.uuid, 'logByName()', name, data)

    let task = await this.getTaskByName(ctx, name)
    Log.info(ctx.uuid, 'logByName() task', task)
    if (!task) {
      ret.code = 1
      ret.message = 'task name err'
      return ret
    }


    let userInfo = await this.userInfoModel().findOne({
      where: {
        user_id: data.user_id
      }
    })
    Log.info(ctx.uuid, 'logByName() userInfo', userInfo)
    if (!userInfo) {
      ret.code = 1
      ret.message = '用户数据错误'
      return ret
    }
    let now = parseInt(Date.now() / 1000)
    // let isVip = false
    let vipNum = 1
    if (userInfo.vip && userInfo.startline <= now && userInfo.deadline >= now) {
      // isVip = true
      let vipNumConfig = await this.configModel().findOne({
        where: {
          name: 'vip_score_num'
        }
      })
      vipNum = parseInt(vipNumConfig.content) || 1
    } 

    let type = task.dataValues.type
    let limitCount = task.limit_count // 限制用户次数
    let limitIpCount = task.limit_ip
    let limitIdCount = task.limit_id
    Log.info(ctx.uuid, 'logByName() type', type)

    let whereLog = {}
    whereLog.type = type
    whereLog.task_id = task.id
    whereLog.user_id = data.user_id
    if (type == 'day') {
      whereLog.log_date = dateUtils.dateFormat(null, 'YYYYMMDD')
    }
    if (limitIdCount) {
      whereLog.model_id = data.model_id
      // 限制id了，限制数量就为limitIpCount
      limitCount = limitIdCount
    }
    if (limitIpCount) {
      whereLog.ip = data.ip
      // 限制ip了，限制数量就为limitIpCount
      limitCount = limitIpCount
    }
    Log.info(ctx.uuid, 'logByName() whereLog', whereLog)
    // 判断数量限制
    let count = await this.logsModel().count({
      where: whereLog
    })
    Log.info(ctx.uuid, 'logByName() count', count)
    if (count >= limitCount && limitCount > 0) {
      ret.code = 1
      ret.message = '超过收益数量限制'
      return ret
    }

    // 记录
    let extNum = data.ext_num || 0
    let score = task.score * vipNum + extNum
    let taskLog = this.log(ctx, data.user_id, task.id, type, score, task.balance, data.model_id, data.ip, t)
    if (!taskLog) {
      ret.code = 1
      ret.message = '保存记录失败'
      return ret
    }

    // 保存用户数据
    // userInfo.balance = userInfo.balance + task.balance // 用户收益不直接到用户账户，vip带可以提取
    userInfo.score = userInfo.score + score

    let userInfoSaveOpts = {}
    if (t) {
      userInfoSaveOpts.transaction = t
    }
    let userInfoSaveRet = await userInfo.save(userInfoSaveOpts)
    if (!userInfoSaveRet) {
      ret.code = 1
      ret.message = '更新用户资产失败'
      return ret
    }

    ret.data = {
      score: score,
      balance: task.balance
    }

    Log.info(ctx.uuid, 'logByName() ret', ret)
    return ret


  }

  async getTaskByName(ctx, name) {
    let task = await this.model().findOne({
      where: {
        name: name
      }
    })

    Log.info(ctx.uuid, 'getTaskByName', name, task.id)
    return task
  }


  /**
   * 任务记录
   * @param {*} userId 
   * @param {*} type 
   * @param {*} score 
   * @param {*} balance 
   * @param {*} modelId 
   * @param {*} ip 
   * @param {*} t 
   */
  async log(ctx, userId, taskId, type = 'day', score = 0, balance = 0, modelId = 0, ip = '', t = null) {
    let opts = {}
    if (t) {
      opts.transaction = t
    }

    let status = balance ? 0 : 1
    let taskLog = await this.logsModel().create({
      user_id: userId,
      type: type,
      score: score,
      balance: balance,
      model_id: modelId,
      ip: ip,
      log_date: dateUtils.dateFormat(null, 'YYYYMMDD'),
      task_id: taskId,
      status: status
    }, opts)

    Log.info('log task log :', taskLog.id)
    return taskLog
  }

  /**
   * 获取用户当日完成数
   * @param {*} ctx 
   * @param {*} userId 
   * @param {*} type 
   */
  async getTodayCount(ctx, userId, type) {
    let logDate = dateUtils.dateFormat(null, 'YYYYMMDD')

    let count = await this.logsModel().count({
      where: {
        user_id: userId,
        type: type,
        log_date: logDate
      }
    })

    return count
  }

  /**
   * 获取现金总收益
   * @param {*} userId 
   * @param {*} status 
   */
  async getBalanceSumByUserId(userId, taskId = 0, status = null) {
    let where = {}
    where.user_id = userId

    if (taskId) {
      where.task_id = taskId
    }
    if (status !== null) {
      where.status = status
    }

    let sum = await this.logsModel().sum('balance', {
      where: where
    })

    return (sum / 100) || 0
  }

  /**
   * 获取积分中收益
   * @param {*} userId 
   * @param {*} taskId 
   * @param {*} status 
   */
  async getScoreSumByTypeAndUser(userId, taskId = 0, status = null) {
    let where = {}
    where.user_id = userId

    if (status !== null) {
      where.status = status
    }

    if (taskId) {
      where.task_id = taskId
    }

    let sum = await this.logsModel().sum('score', {
      where: where
    })

    return (sum / 100) || 0
  }
}

module.exports = TaskModel