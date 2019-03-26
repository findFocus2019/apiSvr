process.env.NODE_ENV = 'production'

const TaskModel = require('./../app/model/task_model')
// const PostsModel = require('./../app/model/posts_model')
const taskModel = new TaskModel()
// const postsModel = new PostsModel()
const uuidUtils = require('./../app/utils/uuid_utils')
// const config = require('./../config')

;
(async () => {

  // let posts = await postsModel.model().findAll({
  //   where: {
  //     type : 3
  //   }
  // })
 
  let posts = [
    [9241,7111],
    [9491,7111],
    [9493,7111],
    [46932,8328],
    [76333,8328],
    [76333,8781],
    [92437,8752],
    [105778,8782],
    [112921,8782],
    [112992,8783]
  ]

  console.log(posts)

  for (const item of posts) {
    console.log(item)
    let userId = item[1]
    let modelId = item[0]

    console.log('user_id' , userId)
    console.log('model_id', modelId)
    
    let t = await taskModel.getTrans()
    let ctx = {
      uuid: uuidUtils.v4()
    }
    taskModel.logByName(ctx, 'user_post', {
      user_id: userId,
      model_id: modelId,
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