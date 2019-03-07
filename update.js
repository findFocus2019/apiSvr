// const config = require('./config')
// const notes = ['测试安装更新']

const updateData = {
  ios: {
    version: '0.9.10',
    notes: [
      `优化调整`,
      `1.修复bug
2.京选商城调整`,
      `1.修复程序明显bug
2.退款，文本检验，累计登录
3.页面部分修改`,
      `1.修复评测关联商品跳转商品详情bug，
2.修复签到日历界面记录显示bug，
3.添加开机图，
4.修复一些bug及优化`,
      '修复一些bug及优化'
    ],
    url: 'https://www.pgyer.com/DFcd'
  },
  andriod: {
    version: '0.9.10',
    notes: [
      `优化调整`,
      `1.修复bug
2.京选商城调整`,
      `1.修复程序明显bug
2.退款，文本检验，累计登录
3.页面部分修改`,
      `1.修复评测关联商品跳转商品详情bug，
2.修复签到日历界面记录显示bug，
3.添加开机图，
4.修复一些bug及优化`,
      '修复一些bug及优化'
    ],
    url: 'https://www.pgyer.com/iHri'
  }
}

module.exports = (req, res) => {

  let ret = {
    status: 0
  }

  let query = req.query
  let version = query.version || ''
  let platform = query.platform || ''

  let data = updateData[platform]
  console.log('version ============================', data.version)
  if (data && version && version != data.version) {
    ret.status = 1
    ret.note = data.notes[0],
      ret.url = data.url
  }

  console.log('update ====================================================', ret)
  return res.json(ret)
}