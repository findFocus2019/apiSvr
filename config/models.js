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
  text: () => {
    return {
      type: Sequelize.TEXT,
      defaultValue: ''
    }
  },
  uuid: () => {
    return {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4
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

  },
  jsonObj: (filed) => {
    return {
      type: Sequelize.TEXT,
      defaultValue: '',
      get() {
        const val = this.getDataValue(filed)
        return val ? JSON.parse(val) : {}
      },
      set(val) {
        let str = val ? JSON.stringify(val) : ''
        this.setDataValue(filed, str)
      }
    }
  },
  jsonArr: (filed) => {
    return {
      type: Sequelize.TEXT,
      defaultValue: '',
      get() {
        const val = this.getDataValue(filed)
        return val ? JSON.parse(val) : []
      },
      set(val) {
        let str = val ? JSON.stringify(val) : ''
        this.setDataValue(filed, str)
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
    vip_startline: FIELDS.defaultInt(),
    vip_deadline: FIELDS.defaultInt(),
    login_type: FIELDS.tinyInt(),
    last_signin_time: FIELDS.defaultInt(),
    last_signin_ip: FIELDS.stringLen(24),
    share_level: FIELDS.tinyInt(),
    auth_token: FIELDS.stringLen(64),
    password_trade: FIELDS.stringLen(32),
    uuid: FIELDS.uuid()
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
    score: FIELDS.money('score')
  }, {
    ...commonOpts,
    tableName: 't_user_info'
  }],
  userAuth: [{
    ...commonFields,
    status: getStatusFields(1),
    user_id: FIELDS.bigInt(),
    platform: FIELDS.stringLen(16),
    device: FIELDS.stringLen(64),
    token: FIELDS.stringLen(64)
  }, {
    ...commonOpts,
    tableName: 't_user_auth'
  }],
  userApply: [{
    ...commonFields,
    status: getStatusFields(0),
    user_id: FIELDS.bigInt(),
    type: FIELDS.stringLen(12),
    info: FIELDS.stringLen(1000),
    remark: FIELDS.stringLen(255)
  }, {
    ...commonOpts,
    tableName: 't_user_apply'
  }],
  userAddress: [{
    ...commonFields,
    status: getStatusFields(1),
    user_id: FIELDS.bigInt(),
    type: FIELDS.stringLen(12),
    info: FIELDS.stringLen(255),
    name: FIELDS.stringLen(64),
    mobile: FIELDS.stringLen(16)
  }, {
    ...commonOpts,
    tableName: 't_user_address'
  }],
  userDailySign: [{
    ...commonFields,
    status: getStatusFields(1),
    user_id: FIELDS.bigInt(),
    continues_num: FIELDS.defaultInt()
  }, {
    ...commonOpts,
    tableName: 't_user_daily_sign'
  }],
  userEcard: [{
    ...commonFields,
    status: getStatusFields(1),
    user_id: FIELDS.bigInt(),
    ecard_id: FIELDS.bigInt(),
    name: FIELDS.stringLen(64),
    price: FIELDS.money('price'),
    amount: FIELDS.money('amount')
  }, {
    ...commonOpts,
    tableName: 't_user_ecard'
  }],
  oAuth: [{
    ...commonFields,
    status: getStatusFields(1),
    user_id: FIELDS.bigInt(),
    platform: FIELDS.stringLen(16),
    openid: FIELDS.stringLen(64),
    avatar: FIELDS.stringLen(255),
    nickname: FIELDS.stringLen(64)
  }, {
    ...commonOpts,
    tableName: 't_oauth'
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
    task_id: FIELDS.bigInt(),
    model_id: FIELDS.bigInt(),
    ip: FIELDS.stringLen(32),
    log_date: FIELDS.stringLen(8)
  }, {
    ...commonOpts,
    tableName: 't_task_logs'
  }],
  posts: [{
    ...commonFields,
    status: getStatusFields(1),
    title: FIELDS.stringLen(255),
    type: FIELDS.tinyInt(),
    category: FIELDS.tinyInt(),
    recommend: FIELDS.tinyInt(),
    description: FIELDS.stringLen(1000),
    info: FIELDS.text(),
    content: FIELDS.text(),
    pub_date: FIELDS.defaultInt(),
    views: FIELDS.defaultInt(),
    cover: FIELDS.stringLen(255),
    video: FIELDS.stringLen(255),
    audio: FIELDS.stringLen(255),
    imgs: FIELDS.jsonArr('imgs'),
    channel: FIELDS.stringLen(32),
    source: FIELDS.stringLen(32),
    link: FIELDS.stringLen(255),
    user_id: FIELDS.bigInt(),
    admin_id: FIELDS.bigInt(),
    goods_id: FIELDS.bigInt(),
    uuid: FIELDS.uuid()
  }, {
    ...commonOpts,
    tableName: 't_posts'
  }],
  postComment: [{
    ...commonFields,
    status: getStatusFields(1),
    user_id: FIELDS.bigInt(),
    post_id: FIELDS.bigInt(),
    ip: FIELDS.stringLen(32),
    pid: FIELDS.bigInt(),
    info: FIELDS.stringLen(1000)
  }, {
    ...commonOpts,
    tableName: 't_post_comment'
  }],
  postLike: [{
    ...commonFields,
    status: getStatusFields(1),
    user_id: FIELDS.bigInt(),
    post_id: FIELDS.bigInt(),
    ip: FIELDS.stringLen(32)
  }, {
    ...commonOpts,
    tableName: 't_post_like'
  }],
  postView: [{
    ...commonFields,
    status: getStatusFields(1),
    user_id: FIELDS.bigInt(),
    post_id: FIELDS.bigInt(),
    ip: FIELDS.stringLen(32),
    view_date: FIELDS.stringLen(8)
  }, {
    ...commonOpts,
    tableName: 't_post_view'
  }],
  share: [{
    ...commonFields,
    status: getStatusFields(1),
    user_id: FIELDS.bigInt(),
    category: FIELDS.stringLen(12),
    item_id: FIELDS.bigInt(),
    uuid: FIELDS.uuid()
  }, {
    ...commonOpts,
    tableName: 't_share'
  }],
  goods: [{
    ...commonFields,
    status: getStatusFields(0),
    type: FIELDS.tinyInt(),
    category: FIELDS.stringLen(24),
    title: FIELDS.stringLen(255),
    cover: FIELDS.stringLen(255),
    description: FIELDS.stringLen(1000),
    content: FIELDS.text(),
    imgs: FIELDS.text(),
    stock: FIELDS.defaultInt(),
    price_cost: FIELDS.money('price_cost'),
    price_sell: FIELDS.money('price_sell'),
    price_vip: FIELDS.money('price_vip'),
    price_score: FIELDS.money('price_score'),
    rabate_share: FIELDS.money('rabate_share'),
    rabate_post: FIELDS.money('rabate_post'),
    uuid: FIELDS.uuid()
  }, {
    ...commonOpts,
    tableName: 't_goods'
  }],
  order: [{
    ...commonFields,
    status: getStatusFields(0),
    type: FIELDS.tinyInt(),
    category: FIELDS.stringLen(24),
    user_id: FIELDS.bigInt(),
    pay_type: FIELDS.tinyInt(),
    goods_ids: FIELDS.stringLen(512),
    goods_items: FIELDS.jsonArr('goods_items'),
    stock: FIELDS.defaultInt(),
    amount: FIELDS.money('amount'),
    balance: FIELDS.money('balance'),
    ecard: FIELDS.money('ecard'),
    score: FIELDS.money('score'),
    ecard_id: FIELDS.defaultInt(),
    address: FIELDS.jsonObj('address'),
    order_no: FIELDS.stringLen(64)
  }, {
    ...commonOpts,
    tableName: 't_order'
  }],
  payment: [],
  orderRate: [{
    ...commonFields,
    status: getStatusFields(1),
    user_id: FIELDS.bigInt(),
    order_id: FIELDS.bigInt(),
    goods_id: FIELDS.bigInt(),
    level: FIELDS.tinyInt(),
    info: FIELDS.text()
  }, {
    ...commonOpts,
    tableName: 't_order_rate'
  }],
  orderAfter: [{
    ...commonFields,
    status: getStatusFields(1),
    user_id: FIELDS.bigInt(),
    order_id: FIELDS.bigInt(),
    goods_id: FIELDS.bigInt(),
    imgs: FIELDS.jsonArr('imgs'),
    info: FIELDS.text(),
    type: FIELDS.tinyInt(),
    order_status: FIELDS.tinyInt(),
    name: FIELDS.stringLen(64),
    mobile: FIELDS.stringLen(16)
  }, {
    ...commonOpts,
    tableName: 't_order_after'
  }],
  schedule: [{
    ...commonFields,
    status: getStatusFields(1),
    name: FIELDS.stringLen(32),
    title: FIELDS.stringLen(64),
    rule: FIELDS.stringLen(32)
  }, {
    ...commonOpts,
    tableName: 't_schedule'
  }],
  notice: [{
    ...commonFields,
    status: getStatusFields(0),
    title: FIELDS.stringLen(64),
    info: FIELDS.stringLen(1000),
    push: FIELDS.tinyInt()
  }, {
    ...commonOpts,
    tableName: 't_notice'
  }],
  config: [{
    ...commonFields,
    status: getStatusFields(0),
    name: FIELDS.stringLen(24),
    title: FIELDS.stringLen(64),
    type: FIELDS.stringLen(12),
    content: FIELDS.stringLen(1000),
  }, {
    ...commonOpts,
    tableName: 't_config'
  }],
  category: [{
    ...commonFields,
    status: getStatusFields(0),
    name: FIELDS.stringLen(24),
    title: FIELDS.stringLen(64),
    type: FIELDS.stringLen(12),
    pid: FIELDS.bigInt(),
    sort: FIELDS.defaultInt()
  }, {
    ...commonOpts,
    tableName: 't_category'
  }],
}