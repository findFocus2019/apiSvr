const config = require('./../../config').getui
const GeTui = require('./../../vendor/getui/GT.push')

class GetuiUtils {

  constructor(){
    this.host = config.host
    this.appId = config.appId
    this.appKey = config.appKey
    this.masterSecret = config.masterSecret

    this.GT = new GeTui(this.host, this.appKey, this.masterSecret)
  }


}

module.exports = new GetuiUtils