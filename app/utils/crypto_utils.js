const crypto = require('crypto')

class CryptUtils {

  hmacMd5(str, key) {
    let hash = crypto.createHmac('md5', key)
    hash.update(str)
    let signStr = hash.digest('hex')

    return signStr.toUpperCase()
  }

  /**
   * md5加盐加密
   * @param {*} obj 
   * @param {*} key 
   */
  hmacMd5Obj(obj = {}, key) {
    console.log('hmacObj', obj)
    let sortStr = this.objSortToBase64(obj)
    console.log('base64SortStr:', sortStr)
    let hash = crypto.createHmac('sha256', key)
    hash.update(sortStr)
    let signStr = hash.digest('hex')

    return signStr.toUpperCase()
  }

  objSortToBase64(obj) {
    let sdic = Object.keys(obj).sort()
    let json = {}
    for (let k in sdic) {
      if (obj[sdic[k]] !== '') {
        // strArr.push(sdic[k] + '=' + obj[sdic[k]])
        json[sdic[k]] = obj[sdic[k]]
      }
    }

    return Buffer.from(JSON.stringify(json)).toString('base64')
  }
  /**
   * 对象排序成字符串
   * @param {*} obj 
   */
  objSortToStr(obj) {
    let sdic = Object.keys(obj).sort()
    let strArr = []
    for (let k in sdic) {
      if (obj[sdic[k]] !== '') {
        strArr.push(sdic[k] + '=' + obj[sdic[k]])
      }
    }
    return strArr.join('&')
  }

  /**
   * 公钥解签
   * @param {*} obj 
   * @param {*} sign 
   * @param {*} key 
   */
  verify(str, signature, publicKey) {
    var verify = crypto.createVerify('RSA-SHA256')
    verify.update(str)
    return verify.verify(publicKey, signature, 'hex')
  }

  /**
   * 私钥签名
   * @param {*} str 
   * @param {*} privateKey 
   */
  sign(str, privateKey) {
    var sign = crypto.createSign('RSA-SHA256')
    sign.update(str)
    var signature = sign.sign(privateKey, 'hex')
    return signature
  }

}

module.exports = new CryptUtils