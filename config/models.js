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

const FIELDS = {
  bigInt() {
    return {
      type: Sequelize.BIGINT,
      defaultValue: 0,
    }
  },
  tinyInt() {
    return {
      type: Sequelize.TINYINT(2),
      defaultValue: 0,
    }
  },
  defaultInt() {
    return {
      type: Sequelize.BIGINT(11),
      defaultValue: 0,
    }

  },
  stringLen: (len) => {
    return {
      type: Sequelize.STRING(len),
      defaultValue: ''
    }

  },
  money: (filed) => {
    return {
      type: Sequelize.BIGINT,
      defaultValue: 0,
      get() {
        const val = this.getDataValue(filed)
        return val / 100
      },
      set(val) {
        this.setDataValue(filed, val * 100)
      }
    }

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
    mobile: FIELDS.stringLen(16),
    password: FIELDS.stringLen(32),
    pid: FIELDS.bigInt(),
    vip: FIELDS.tinyInt(),
    vip_deadline: FIELDS.defaultInt(),
    login_type: FIELDS.tinyInt(),
    last_signin_time: FIELDS.defaultInt(),
    last_signin_ip: FIELDS.stringLen(24),
    share_level: FIELDS.tinyInt(),
    auth_token: FIELDS.stringLen(64)
  }, {
    ...commonOpts,
    tableName: 't_user'
  }],
  userInfo: [{
    ...commonFields,
    status: getStatusFields(0),
    user_id: FIELDS.bigInt(),
    mobile: FIELDS.stringLen(16),
    nickname: FIELDS.stringLen(64),
    realname: FIELDS.stringLen(64),
    sex: FIELDS.tinyInt(),
    avatar: FIELDS.stringLen(255),
    birth: FIELDS.defaultInt(),
    // balance: FIELDS.bigInt(),
    // score: FIELDS.bigInt()
    balance: FIELDS.money('balance'),
    score: FIELDS.money('score'),
  }, {
    ...commonOpts,
    tableName: 't_user_info'
  }],
  admin: [{
    ...commonFields,
    status: getStatusFields(0)
  }, {
    ...commonOpts,
    tableName: 't_admin'
  }],
  task: [{
    ...commonFields,
    status: getStatusFields(1),
    name: FIELDS.stringLen(24),
    title: FIELDS.stringLen(32),
    description: FIELDS.stringLen(255),
    type: FIELDS.stringLen(12),
    balance: FIELDS.money('balance'),
    score: FIELDS.money('score'),
    limit_count: FIELDS.defaultInt(),
    limit_id: FIELDS.defaultInt(),
    limit_ip: FIELDS.defaultInt(),
    model: FIELDS.stringLen(24),
    display: FIELDS.tinyInt()
  }, {
    ...commonOpts,
    tableName: 't_task'
  }],
  taskLogs: [{
    ...commonFields,
    status: getStatusFields(1),
    type: FIELDS.stringLen(12),
    balance: FIELDS.money('balance'),
    score: FIELDS.money('score'),
    user_id: FIELDS.bigInt(),
    model_id: FIELDS.bigInt(),
    ip: FIELDS.stringLen(32),
    log_date: FIELDS.stringLen(8)
  }, {
    ...commonOpts,
    tableName: 't_task_logs'
  }],

}