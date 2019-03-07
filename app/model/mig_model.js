const Model = require('./../../lib/model')
const {
  user,
  userInfo,
  migUser,
  migUserBalance,
  migUserScore
} = require('./../../config/models')
const dateUtils = require('./../utils/date_utils')

class MigModel extends Model {

  model() {
    return this.db().define('user', user()[0], user()[1])
  }

  infoModel() {
    return this.db().define('user_info', userInfo()[0], userInfo()[1])
  }

  migUserModel(){
    return this.db().define('mig_user', migUser()[0], migUser()[1])
  }

  migUserBalanceModel(){
    return this.db().define('mig_user_balance', migUserBalance()[0], migUserBalance()[1])
  }

  migUserScoreModel() {
    return this.db().define('mig_user_score', migUserScore()[0], migUserScore()[1])
  }

  async migActions(){
    let users = await this.migUserModel().findAll()
    for (let index = 0; index < users.length; index++) {
      const user = users[index]
      await this.migAction(user)
    }
  }
  async migAction(user){

    // let user = await this.migUserModel().findOne()

    let balance = 0
    let score = 0
    let migUserId = user.user_id

    let migUserBalanceData = await this.migUserBalanceModel().findOne({
      where: {user_id: migUserId}
    })
    if(migUserBalanceData){
      balance = migUserBalanceData.balance / 100
    }

    let migUserScoreData = await this.migUserScoreModel().findOne({
      where: {user_id: migUserId}
    })
    if(migUserScoreData){
      score = migUserScoreData.score
    }
    console.log('mig balance:' , balance)
    console.log('mig score:' , score)

    let newUser = await this.model().create({
      mobile: user.mobile,
      create_time: dateUtils.getTimestamp(user.create_date),
      update_time: dateUtils.getTimestamp(user.update_date)
    })

    let newUserId = newUser.id
    console.log('mig user id:' , newUserId)

    let newInfo = await this.infoModel().create({
      user_id: newUserId,
      mobile: user.mobile,
      nickname: user.nickname,
      balance: balance,
      score: score
    })

    console.log('mig info id:' , newInfo.id)
  }
}

module.exports = MigModel