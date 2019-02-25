const config = require('./../../config').getui
const GeTui = require('./../../vendor/getui/GT.push')
const NotificationTemplate = require('./../../vendor/getui/getui/template/NotificationTemplate')
const AppMessage = require('./../../vendor/getui/getui/message/AppMessage')
const APNPayload = require('./../../vendor/getui/payload/APNPayload')
const SimpleAlertMsg = require('./../../vendor/getui/payload/SimpleAlertMsg')
class GetuiUtils {

  constructor(){
    this.host = config.host
    this.appId = config.appId
    this.appKey = config.appKey
    this.masterSecret = config.masterSecret

    this.GT = new GeTui(this.host, this.appKey, this.masterSecret)
  }

  /**
   * 
   * @param {*} data 
   */
  notificationApp(data){
    let template = new NotificationTemplate({
      appId: this.appId,
      appKey: this.appKey,
      title: data.title || '',
      text: data.text || '',
      logoUrl: 'http://img-juren.oss-cn-shenzhen.aliyuncs.com/assets/images/logo.png',
      isRing: true,
      isVibrate: true,
      isClearable: true,
      transmissionType: 2,
      transmissionContent: data.content
    })

    var payload = new APNPayload()
    var alertMsg = new SimpleAlertMsg()
    alertMsg.alertMsg= data.title
    payload.alertMsg = alertMsg
    // payload.badge=5;
    // payload.contentAvailable =1;
    // payload.category="";
    // payload.sound="";
    // payload.customMsg.payload1=""
    template.setApnInfo(payload)

    let message = new AppMessage({
      isOffline: false,
      offlineExpireTime: 3600 * 12 * 1000,
      data: template,
      appIdList: [this.appId],
      //        phoneTypeList: ['IOS'],
      //        provinceList: ['浙江'],
      //tagList: ['阿百川']
      speed: 10000
    })

    return new Promise((r,j) => {
      this.GT.pushMessageToApp(message, null, function (err, res) {
        console.log(res)
        if(err){
          j(err)
        }else {
          r(res)
        }
        
      });
    })
    
  }

  


}

module.exports = new GetuiUtils