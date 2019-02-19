const config = require('./config')
const notes = ['测试安装更新']

module.exports = (req , res) => {

  let ret = {
    status: 0,
    note:notes[0],
    url:config.apkUrl
  }

  let query = req.query
  let version = query.version || ''
  console.log('version ============================' , version)
  if(version && version != config.version){
    ret.status = 1
  }

  console.log('update ====================================================' ,ret)
  return res.json(ret)
}