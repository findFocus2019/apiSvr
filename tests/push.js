const pushUtils = require('./../app/utils/getui_utils')

let data = {
  title: '测试',
  text:'test.....',
  // content : JSON.stringify({
  //   title: '测试test',
  //   page:'/pages/plus/plus'
  // })
  content: '测试内容'
}
pushUtils.notificationApp(data).then(ret => {
  console.log(ret)
})