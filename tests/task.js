process.env.NODE_ENV = 'production'

const TaskModel = require('./../app/model/task_model')
const taskModel = new TaskModel()
const config = require('./../config')
const userIds = [9108,9106,9105,9103]
;
(async () => {
  for (let index = 0; index < userIds.length; index++) {
    let userId = userIds[index]

    let t = await taskModel.getTrans()
    let ctx = {
      uuid: 'test'
    }
    taskModel.logByName(ctx, config.tasks.REGISTER, {
      user_id: userId,
      model_id: userId,
      ip: '127.0.0.1'
    }, t).then(ret => {
      console.log(ret)
      if (ret.code == 0) {
        t.commit()
      } else {
        t.rollback()
      }
    })
    
  }
  
})()