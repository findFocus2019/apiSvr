const request = require('superagent')
const config = require('./../config')
const cryptoUtils = require('./../app/utils/crypto_utils')
const uuid = require('uuid')

class Request {

  async post(url, data) {
    let content = {
      query: data.query || {},
      body: data.body || {},
      session: data.session || {}
    }
    let sign = this.sign(content)
    let body = {
      uuid: uuid.v4(),
      content: content,
      sign: sign
    }

    let ret = await request.post(`http://127.0.0.1:${config.port}/` + url).type('json').send(body)

    return ret.body
  }

  sign(data) {
    return cryptoUtils.hmacMd5Obj(data, config.signKey)
  }
}

module.exports = new Request