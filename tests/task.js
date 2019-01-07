const TaskModel = require('./../app/model/task_model')
const taskModel = new TaskModel()
const config = require('./../config')

;
(async () => {
  let t = await taskModel.getTrans()
  let ctx = {
    uuid: 'test'
  }
  taskModel.logByName(ctx, config.tasks.POSTS_VIEW, {
    user_id: 1,
    model_id: 1,
    ip: '127.0.0.1'
  }, t).then(ret => {
    console.log(ret)
    if (ret.code == 0) {
      t.commit()
    } else {
      t.rollback()
    }
  })
})()