const Model = require('./../../lib/model')
const {
  push
} = require('./../../config/models')

class NoticeModel extends Model {

  model() {
    return this.db().define('push', push()[0], push()[1])
  }

  async infoByClient(clientId, info = null){

    let data = await this.model().findOne({
      where: {client_id : clientId}
    })

    if(data){
      if(info){
        if(info.user_id){
          data.user_id = info.user_id
        }
        if(info.token){
          data.token = info.token || ''
        }
        data.platform = info.platform || 'ios'
        data.status =  info.status        
        await data.save()
      }

      return data
    }else {
      let insert = {
        client_id: clientId
      }
      if(info){
        insert.user_id = info.user_id || 0
        insert.platform = info.platform || 'ios'
        insert.status =  info.status || 1
        insert.token = info.token
      }
      data = await this.model().create(insert)
      return data
    }
  }
}

module.exports = NoticeModel