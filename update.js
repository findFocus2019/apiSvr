// const config = require('./config')
// const notes = ['测试安装更新']

const updateData = {
  ios:{
    version:'0.9.2',
    notes: ['修复一些bug及优化'],
    url: 'https://www.pgyer.com/DFcd'
  },
  andriod: {
    version:'0.9.2',
    notes: ['修复一些bug及优化'],
    url: 'https://www.pgyer.com/iHri'
  }
}

module.exports = (req , res) => {

  let ret = {
    status: 0
  }

  let query = req.query
  let version = query.version || ''
  let platform = query.platform || ''

  let data = updateData[platform]
  console.log('version ============================' , data.version)
  if(data && version && version != data.version){
    ret.status = 1
    ret.note = data.notes[0],
    ret.url = data.url
  }

  console.log('update ====================================================' ,ret)
  return res.json(ret)
}