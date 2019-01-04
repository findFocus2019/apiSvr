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
}

let getStatusFields = (val = 0) => {
  return {
    type: Sequelize.INTEGER(2),
    defaultValue: val
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
    status: getStatusFields(0),
    mobile: {
      type: Sequelize.STRING(16),
      defaultValue: ''
    }
  }, {
    ...commonOpts,
    tableName: 't_user'
  }],
  admin: [{
    ...commonFields,
    status: getStatusFields(0),
    mobile: {
      type: Sequelize.STRING(16),
      defaultValue: ''
    }
  }, {
    ...commonOpts,
    tableName: 't_admin'
  }],
}