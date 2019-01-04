const Sequelize = require('sequelize')
const commonFields = {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  create_time: {
    type: Sequelize.BIGINT(11),
    defaultValue: parseInt(Date.now() / 1000)
  },
  update_time: {
    type: Sequelize.BIGINT(11),
    defaultValue: parseInt(Date.now() / 1000)
  },
  status: {
    type: Sequelize.INTEGER(2),
    defaultValue: 1
  }
}
const commonOpts = {
  timestamps: true,
  createdAt: 'create_time',
  updatedAt: 'update_time',
  freezeTableName: true,
}

module.exports = {
  user: [{
    ...commonFields,
    mobile: {
      type: Sequelize.STRING(16),
      defaultValue: ''
    }
  }, {
    ...commonOpts,
    tableName: 't_user'
  }]
}