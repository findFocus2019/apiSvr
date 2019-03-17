const Model = require('./../../lib/model')
const {
  admin,
  adminGroup,
  adminRules
} = require('./../../config/models')
const Op = require('sequelize').Op

class AdminModel extends Model {

  model() {
    return this.db().define('admin', admin()[0], admin()[1])
  }

  groupModel() {
    return this.db().define('admin_group', adminGroup()[0], adminGroup()[1])
  }

  rulesModel() {
    return this.db().define('admin_rules', adminRules()[0], adminRules()[1])
  }

  async getGroupInfo(groupId = 0){

    let rules = []
    let group
    if(groupId){
      group = await this.groupModel().findByPk(groupId)
      let ruleIds = group.rules.split(',')

      rules = await this.rulesModel().findAll({
        where: {
          id: {
            [Op.in]: ruleIds
          },
          status:1
        }
      })
    }else if (groupId === 0){
      group = {id: 0 , name: '超级管理'}
      rules = await this.rulesModel().findAll({
        where:{
          status:1
        }
      })
      
    }

    let result = []
    rules.forEach(rule => {
      if(rule.pid == 0){
        result.push(rule)
      }
    })

    console.log('result ============' , JSON.stringify(result))
    result.forEach(item => {
      let pid = item.id
      item.dataValues.childs = []
      rules.forEach(rule => {
        if(rule.pid == pid){
          item.dataValues.childs.push(rule)
        }
      })
    })

    console.log('result ============' , JSON.stringify(result))
    return {
      group: group,
      rules: result
    }
     
  }
}

module.exports = AdminModel