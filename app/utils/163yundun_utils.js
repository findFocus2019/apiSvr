// 易盾内容安全服务文本在线检测接口地址


///////////////////////////  163云盾 文本检测接口 //////////////
const crypto = require('crypto')
const request = require('superagent')

const API_URL = 'https://as.dun.163yun.com/v3/text/check'


const CommonConfig = {
  //产品密钥ID，产品标识
  secretId: 'your_secret_id',
  // 产品私有密钥，服务端生成签名信息使用，请严格保管，避免泄露
  secretKey: 'your_secret_key',
  // 业务ID，易盾根据产品业务特点分配
  businessId: 'your_business_id',
  // 版本号
  version: 'v3.1'
}


/**
 * 
 * 响应结果
 响应字段如下， 响应通用字段已省略， 详细见响应通用字段：

 result 数据结构

 参数名称 类型 描述
 action Number 检测结果， 0： 通过， 1： 嫌疑， 2： 不通过
 taskId String 本次请求数据标识， 可以根据该标识查询数据最新结果
 labels json数组 分类信息
 labels 数据结构

 参数名称 类型 描述
 label Number 分类信息， 100： 色情， 200： 广告， 400： 违禁， 500： 涉政， 600： 谩骂， 700： 灌水
 level Number 分类级别， 1： 不确定， 2： 确定
 details json对象 其他信息
 details 数据结构

 参数名称 类型 描述
 hint json数组 线索信息， 用于定位文本中有问题的部分， 辅助人工审核
 请求示例
 */

module.exports = {
  signature: function (secretKey, paramsJson) {
    var sorter = function (paramsJson) {
      var sortedJson = {}
      var sortedKeys = Object.keys(paramsJson).sort()
      for (var i = 0; i < sortedKeys.length; i++) {
        sortedJson[sortedKeys[i]] = paramsJson[sortedKeys[i]]
      }
      return sortedJson
    }

    var sortedParam = sorter(paramsJson)
    var needSignatureStr = ''
    for (var key in sortedParam) {
      var value = sortedParam[key]
      needSignatureStr = needSignatureStr + key + value
    }
    
    needSignatureStr += secretKey

    return this.md5(needSignatureStr)
  },

  md5: function (data) {
    var md5er = crypto.createHash('md5') //MD5加密工具
    md5er.update(data, 'UTF-8')
    return md5er.digest('hex')
  },

  nonce: function () {
    return Math.floor(Math.random() * 999999)
  },

  buildPostData (content) {
    
    let commonParams = {
      secretId: CommonConfig.secretId,
      businessId: CommonConfig.businessId,
      version: CommonConfig.version,
      nonce: this.nonce(),
      timestamp: new Date().getTime(),
    }

    let priveParams = {
      dataId: this.md5(content) + commonParams.timestamp,
      content: content,
    }

    let params = {
      ...commonParams,
      ...priveParams,
    }

    params.signature = this.signature(CommonConfig.secretKey, params)
    return params
  },

  async check (content) {
    // let params = this.buildPostData(content)
    // return request.get(API_URL, params)
    return {
      body: {
        code: 200,
        result: {
          action: 0
        }
      }
    }
    
  }
}
