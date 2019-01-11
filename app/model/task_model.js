const Model = require('./../../lib/model')
const dateUtils = require('./../utils/date_utils')

const {
  task,
  taskLogs,
  userInfo
} = require('./../../config/models')

class TaskModel extends Model {
  model() {
    return this.db().define('task', task[0], task[1])
  }

  logsModel() {
    return this.db().define('task_logs', taskLogs[0], taskLogs[1])
  }

  userInfoModel() {
    return this.db().define('user_info', userInfo[0], userInfo[1])
  }

  /**
   * 
   * @param {*} ctx 
   * @param {*} name 
   * @param {
   *  user_id
   *  model_id
   *  ip
   * } data 
   * @param {*} t 
   */
  async logByName(ctx, name, data, t) {
    let ret = {
      code: 0,
      message: ''
    }
    console.log(ctx.uuid, 'logByName()', name, data)

    let task = await this.getTaskByName(ctx, name)
    console.log(ctx.uuid, 'logByName() task', task)
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
    console.log(ctx.uuid, 'logByName() userInfo', userInfo)
    if (!userInfo) {
      ret.code = 1
      ret.message = '用户数据错误'
      return ret
    }

    let type = task.dataValues.type
    let limitCount = task.limit_count // 限制用户次数
    let limitIpCount = task.limit_id
    let limitIdCount = task.limit_id
    console.log(ctx.uuid, 'logByName() type', type)

    let whereLog = {}
    whereLog.type = type
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
    console.log(ctx.uuid, 'logByName() whereLog', whereLog)
    // 判断数量限制
    let count = await this.logsModel().count({
      where: whereLog
    })
    console.log(ctx.uuid, 'logByName() count', count)
    if (count >= limitCount) {
      ret.code = 1
      ret.message = '超过收益数量限制'
      return ret
    }

    // 记录
    let taskLog = this.log(ctx, data.user_id, type, task.score, task.balance, data.model_id, data.ip, t)
    if (!taskLog) {
      ret.code = 1
      ret.message = '保存记录失败'
      return ret
    }

    // 保存用户数据
    userInfo.balance = userInfo.balance + task.balance
    userInfo.score = userInfo.score + task.score

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

    console.log(ctx.uuid, 'logByName() ret', ret)
    return ret


  }

  async getTaskByName(ctx, name) {
    let task = await this.model().findOne({
      where: {
        name: name
      }
    })

    console.log(ctx.uuid, 'getTaskByName', name, task.id)
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
  async log(ctx, userId, type = 'day', score = 0, balance = 0, modelId = 0, ip = '', t = null) {
    let opts = {}
    if (t) {
      opts.transaction = t
    }
    let taskLog = await this.logsModel().create({
      user_id: userId,
      type: type,
      score: score,
      balance: balance,
      model_id: modelId,
      ip: ip,
      log_date: dateUtils.dateFormat(null, 'YYYYMMDD')
    }, opts)

    console.log('log task log :', taskLog.id)
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
}

module.exports = TaskModel