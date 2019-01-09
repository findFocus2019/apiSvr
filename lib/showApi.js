//推荐使用npm安装使用sdk: npm install --save showapi-sdk
// 'use strict'

const showapiSdk = require('showapi-sdk')

class ShowApiSdk {
  constructor(opts) {
    this.appId = opts.appId
    this.secret = opts.secret
    this.url = opts.url || 'http://route.showapi.com/109-35'

    showapiSdk.setting({
      url: this.url, //你要调用的API对应接入点的地址,注意需要先订购了相关套餐才能调
      appId: this.appId, //你的应用id
      secret: this.secret, //你的密钥
      timeout: 5000, //http超时设置
      options: { //默认请求参数,极少用到
        testParam: 'test'
      }
    })

  }

  getData() {
    var request = showapiSdk.request()
    // request.appendText('channelId', obj.channelId)
    // request.appendText('channelName', obj.channelName)
    // request.appendText('title', obj.title)
    request.appendText('page', '1')
    request.appendText('needContent', '1')
    request.appendText('needHtml', '1')
    request.appendText('needAllList', '0')
    request.appendText('maxResult', '100')
    // request.appendText('id', '')

    return new Promise((r, j) => {
      request.post((data) => {
        console.info(data)
        r(data)
      })
    })

  }
}

module.exports = (opts) => {
  return new ShowApiSdk(opts)
}

//设置你测试用的appId和secret,img
// var appId = ''
// var secret = ''
// //开启debug
// //showapiSdk.debug(true)
// if (!(appId && secret)) {
//   console.error('请先设置appId等测试参数,详见样例代码内注释!')
//   return
// }
// //全局默认设置
// showapiSdk.setting({
//   url: 'http://route.showapi.com/109-35', //你要调用的API对应接入点的地址,注意需要先订购了相关套餐才能调
//   appId: appId, //你的应用id
//   secret: secret, //你的密钥
//   timeout: 5000, //http超时设置
//   options: { //默认请求参数,极少用到
//     testParam: 'test'
//   }
// })

// var request = showapiSdk.request()
// request.appendText('channelId', '')
// request.appendText('channelName', '')
// request.appendText('title', '足球')
// request.appendText('page', '1')
// request.appendText('needContent', '0')
// request.appendText('needHtml', '0')
// request.appendText('needAllList', '0')
// request.appendText('maxResult', '20')
// request.appendText('id', '')
// request.post(function (data) {
//   console.info(data)
// })