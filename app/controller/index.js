const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
// const Uuid = require('uuid')
const cryptoUtils = require('../utils/crypto_utils')
const {
  signKey
} = require('./../../config/index')

let groups = ['admin', 'app']

let getGroupControllers = (group) => {
  let controllerPath = path.join(__dirname, './' + group)

  let files = fs.readdirSync(controllerPath)

  let controllers = {}
  files.forEach(file => {
    if (file.indexOf('_controller.js') > 0) {
      controllers[file.replace('_controller.js', '')] = require(path.join(controllerPath, file))
    }
  })

  console.log(controllers)
  return controllers
}

let groupControllers = {}
groups.forEach(group => {
  groupControllers[group] = getGroupControllers(group)
})

// let getClientIp = (req) => {
//   let ip = req.headers['x-forwarded-for'] ||
//     req.ip ||
//     req.connection.remoteAddress ||
//     req.socket.remoteAddress ||
//     req.connection.socket.remoteAddress || '';

//   ip = ip.match(/\d+.\d+.\d+.\d+/);

//   return ip ? ip.join('.') : null
// };

router.post('/:group/:module/:action', async (req, res) => {

  let {
    uuid,
    content,
    sign
  } = req.body

  // 验证签名
  console.log('sign key', signKey)
  console.log(req.body)
  let signContent = cryptoUtils.hmacMd5Obj(content, signKey)
  console.log(sign, signContent)
  if (sign != signContent) {
    return res.status(400).json({
      code: -1,
      message: `unsign err`
    })
  }

  // 主装上下文
  let ctx = {
    uuid: uuid || req.uuid || 'uuid',
    ip: req.headers['x-real-ip'] ? req.headers['x-real-ip'] : req.ip.replace(/::ffff:/, ''),
    query: content.query || {},
    body: content.body || {},
    session: content.session || {},
    token: req.query.token || req.body.token || '',
    ret: {
      code: 0,
      message: ''
    },
    // req: req,
    // res: res
  }

  let groupName = req.params.group // 组别
  let moduleName = req.params.module // 模块
  let actionName = req.params.action // 方法

  ctx.route = {
    group: groupName,
    module: moduleName,
    action: actionName
  }

  if (groups.indexOf(groupName) > -1) {

    let controllers = groupControllers[groupName]
    if (!controllers.hasOwnProperty(moduleName)) {
      return res.status(404).json({
        code: -1,
        message: `404 not found (module:${moduleName})`
      })
    }

    let controller = controllers[moduleName]

    let moduleController = new controller(ctx)
    if (typeof moduleController[actionName] == 'function') {

      if (moduleController._init_) {
        await moduleController._init_(ctx)
      }

      if (actionName[0] == '_') {
        return res.status(404).json({
          code: -1,
          message: `404 not found (action:${actionName})`
        })
      }

      if (ctx.ret.code == 0) {
        await moduleController[actionName](ctx)
      }

      return res.json(ctx.ret)
    } else {
      return res.status(404).json({
        code: -1,
        message: `404 not found (action:${actionName})`
      })
    }
  } else {
    return res.status(404).json({
      code: -1,
      message: `404 not found (group:${groupName})`
    })
  }
})

module.exports = router