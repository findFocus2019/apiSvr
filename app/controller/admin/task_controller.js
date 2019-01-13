const Controller = require('./../../../lib/controller')
const Op = require('sequelize').Op

class TaskController extends Controller {

  async list(ctx) {
    this.logger.info(ctx.uuid, 'list()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)

    let taskModel = new this.models.task_model
    let rows = await taskModel.model().findAll({
      where: {
        status: {
          [Op.gte]: 0
        }
      },
      attributes: {
        excludes: ['update_time']
      }
    })

    ctx.ret.data = {
      rows: rows
    }
    return ctx.ret
  }

  async info(ctx) {
    this.logger.info(ctx.uuid, 'info()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)
    let taskModel = new this.models.task_model
    let id = ctx.body.id
    let info = await taskModel.model().findByPk(id)

    ctx.ret.data = {
      info: info
    }
    this.logger.info(ctx.uuid, 'info()', 'ret', ctx.ret)
    return ctx.ret
  }

  async update(ctx) {
    this.logger.info(ctx.uuid, 'update()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.sesssion)
    let taskModel = new this.models.task_model

    let data = ctx.body
    let task
    if (data.id) {
      task = await taskModel.model().findByPk(data.id)
      await task.update(data)
    } else {
      task = await taskModel.model().create(data)
    }

    ctx.ret.data = {
      info: task
    }
    this.logger.info(ctx.uuid, 'update()', 'ret', ctx.ret)
    return ctx.ret

  }
}

module.exports = TaskController