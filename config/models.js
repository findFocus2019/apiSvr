const Sequelize = require('sequelize')

const commonFieldGet = () => {
  return {
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
    }
  }
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
      defaultValue: 0
    }
  },
  tinyInt() {
    return {
      type: Sequelize.TINYINT(2),
      defaultValue: 0
    }
  },
  defaultInt() {
    return {
      type: Sequelize.BIGINT(11),
      defaultValue: 0
    }
  },
  stringLen: len => {
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
  money: filed => {
    return {
      type: Sequelize.BIGINT,
      defaultValue: 0,
      get() {
        const val = this.getDataValue(filed) / 100
        console.log('money get ============', val)
        return val
      },
      set(val) {
        console.log('money set ============', val)
        this.setDataValue(filed, val * 100)
      }
    }
  },
  jsonObj: filed => {
    return {
      type: Sequelize.TEXT,
      defaultValue: '',
      get() {
        const val = this.getDataValue(filed)
        return val ? JSON.parse(val) : ''
      },
      set(val) {
        let str = val ? JSON.stringify(val) : ''
        this.setDataValue(filed, str)
      }
    }
  },
  jsonArr: filed => {
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
  freezeTableName: true
}

module.exports = {
  user: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(0),
        mobile: FIELDS.stringLen(16),
        password: FIELDS.stringLen(32),
        pid: FIELDS.bigInt(),
        // vip: FIELDS.tinyInt(),
        // vip_startline: FIELDS.defaultInt(),
        // vip_deadline: FIELDS.defaultInt(),
        login_type: FIELDS.tinyInt(),
        last_signin_time: FIELDS.defaultInt(),
        last_signin_ip: FIELDS.stringLen(24),
        // share_level: FIELDS.tinyInt(),
        auth_token: FIELDS.stringLen(64),
        password_trade: FIELDS.stringLen(32),
        uuid: FIELDS.uuid(),
        sign_day_num: FIELDS.defaultInt(),
        sign_day_last: FIELDS.stringLen(8)
      },
      {
        ...commonOpts,
        tableName: 't_user'
      }
    ]
  },
  userInfo: () => {
    return [{
        ...commonFieldGet(),
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
        share_level: FIELDS.tinyInt(),
        alipay: FIELDS.stringLen(32),
        openid: FIELDS.stringLen(32),
        password_trade: FIELDS.stringLen(32),
        vip: FIELDS.tinyInt(),
        startline: FIELDS.defaultInt(),
        deadline: FIELDS.defaultInt(),
      },
      {
        ...commonOpts,
        tableName: 't_user_info'
      }
    ]
  },
  userAuth: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(1),
        user_id: FIELDS.bigInt(),
        platform: FIELDS.stringLen(16),
        device: FIELDS.stringLen(64),
        token: FIELDS.stringLen(64),
        type: FIELDS.stringLen(12)
      },
      {
        ...commonOpts,
        tableName: 't_user_auth'
      }
    ]
  },
  userApply: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(0),
        user_id: FIELDS.bigInt(),
        type: FIELDS.tinyInt(),
        info: FIELDS.stringLen(1000),
        remark: FIELDS.stringLen(255)
      },
      {
        ...commonOpts,
        tableName: 't_user_apply'
      }
    ]
  },
  userAddress: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(1),
        user_id: FIELDS.bigInt(),
        info: FIELDS.stringLen(255),
        name: FIELDS.stringLen(64),
        mobile: FIELDS.stringLen(16),
        province: FIELDS.defaultInt(),
        city: FIELDS.defaultInt(),
        county: FIELDS.defaultInt(),
        town: FIELDS.defaultInt(),
        address: FIELDS.stringLen(255)
      },
      {
        ...commonOpts,
        tableName: 't_user_address'
      }
    ]
  },
  userCollection: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(1),
        user_id: FIELDS.bigInt(),
        goods_id: FIELDS.bigInt(),
        post_id: FIELDS.bigInt(),
        category: FIELDS.stringLen(12),
        type: FIELDS.tinyInt()
      },
      {
        ...commonOpts,
        tableName: 't_user_collection'
      }
    ]
  },
  userInvoice: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(1),
        user_id: FIELDS.bigInt(),
        category: FIELDS.tinyInt(),
        type: FIELDS.tinyInt(),
        title: FIELDS.stringLen(255),
        company_title: FIELDS.stringLen(255),
        company_no: FIELDS.stringLen(32),
        info: FIELDS.tinyInt()
      },
      {
        ...commonOpts,
        tableName: 't_user_invoice'
      }
    ]
  },
  userDailySign: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(1),
        user_id: FIELDS.bigInt(),
        continues_num: FIELDS.defaultInt()
      },
      {
        ...commonOpts,
        tableName: 't_user_daily_sign'
      }
    ]
  },
  userEcard: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(1),
        user_id: FIELDS.bigInt(),
        name: FIELDS.stringLen(64),
        price: FIELDS.money('price'),
        amount: FIELDS.money('amount')
      },
      {
        ...commonOpts,
        tableName: 't_user_ecard'
      }
    ]
  },
  userTransaction: () => {
    return [{
      ...commonFieldGet(),
      status: getStatusFields(0),
      user_id: FIELDS.bigInt(),
      type: FIELDS.tinyInt(),
      balance: FIELDS.money('balance'),
      amount: FIELDS.money('amount'),
      score: FIELDS.defaultInt(),
      method: FIELDS.stringLen(12),
      remark: FIELDS.stringLen(255)
    }, {
      ...commonOpts,
      tableName: 't_user_transaction'
    }]

  },
  oAuth: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(1),
        user_id: FIELDS.bigInt(),
        platform: FIELDS.stringLen(16),
        openid: FIELDS.stringLen(64),
        avatar: FIELDS.stringLen(255),
        nickname: FIELDS.stringLen(64),
        type: FIELDS.stringLen(12)
      },
      {
        ...commonOpts,
        tableName: 't_oauth'
      }
    ]
  },
  push: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(0),
        user_id: FIELDS.bigInt(),
        platform: FIELDS.stringLen(16),
        client_id: FIELDS.stringLen(64),
        token: FIELDS.stringLen(64)
      },
      {
        ...commonOpts,
        tableName: 't_push'
      }
    ]
  },
  mch: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(0),
        username: FIELDS.stringLen(64),
        email: FIELDS.stringLen(128),
        mobile: FIELDS.stringLen(16),
        password: FIELDS.stringLen(32),
        info: FIELDS.jsonObj('info')
      },
      {
        ...commonOpts,
        tableName: 't_mch'
      }
    ]
  },
  admin: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(0),
        email: FIELDS.stringLen(128),
        password: FIELDS.stringLen(32),
        pid: FIELDS.tinyInt(0),
        type: FIELDS.tinyInt(0),
        group_id: FIELDS.defaultInt()
      },
      {
        ...commonOpts,
        tableName: 't_admin'
      }
    ]
  },
  adminGroup: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(0),
        name: FIELDS.stringLen(64),
        admin_id: FIELDS.bigInt(),
        rules: FIELDS.stringLen(1000)
      },
      {
        ...commonOpts,
        tableName: 't_admin_group'
      }
    ]
  },
  adminRules: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(0),
        name: FIELDS.stringLen(64),
        pid: FIELDS.bigInt(),
        router: FIELDS.stringLen(1000),
        icon: FIELDS.stringLen(24),
        sort: FIELDS.defaultInt()
      },
      {
        ...commonOpts,
        tableName: 't_admin_rules'
      }
    ]
  },
  task: () => {
    return [{
        ...commonFieldGet(),
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
      },
      {
        ...commonOpts,
        tableName: 't_task'
      }
    ]
  },
  taskLogs: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(1),
        type: FIELDS.stringLen(12),
        balance: FIELDS.money('balance'),
        score: FIELDS.money('score'),
        user_id: FIELDS.bigInt(),
        task_id: FIELDS.bigInt(),
        model_id: FIELDS.bigInt(),
        ip: FIELDS.stringLen(32),
        log_date: FIELDS.stringLen(8)
      },
      {
        ...commonOpts,
        tableName: 't_task_logs'
      }
    ]
  },
  posts: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(1),
        title: FIELDS.stringLen(255),
        type: FIELDS.tinyInt(),
        category: FIELDS.tinyInt(),
        recommend: FIELDS.tinyInt(),
        description: FIELDS.stringLen(1000),
        info: FIELDS.text(),
        content: FIELDS.text(),
        pub_date: FIELDS.defaultInt(),
        cover: FIELDS.stringLen(255),
        video: FIELDS.stringLen(255),
        audio: FIELDS.stringLen(255),
        imgs: FIELDS.jsonArr('imgs'),
        channel: FIELDS.stringLen(32),
        source: FIELDS.stringLen(32),
        link: FIELDS.stringLen(255),
        views: FIELDS.defaultInt(),
        likes: FIELDS.defaultInt(),
        shares: FIELDS.defaultInt(),
        user_id: FIELDS.bigInt(),
        admin_id: FIELDS.bigInt(),
        goods_id: FIELDS.bigInt(),
        uuid: FIELDS.uuid()
      },
      {
        ...commonOpts,
        tableName: 't_posts'
      }
    ]
  },
  postComment: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(1),
        user_id: FIELDS.bigInt(),
        post_id: FIELDS.bigInt(),
        ip: FIELDS.stringLen(32),
        pid: FIELDS.bigInt(),
        info: FIELDS.stringLen(1000)
      },
      {
        ...commonOpts,
        tableName: 't_post_comment'
      }
    ]
  },
  postLike: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(1),
        user_id: FIELDS.bigInt(),
        post_id: FIELDS.bigInt(),
        comment_id: FIELDS.bigInt(),
        ip: FIELDS.stringLen(32)
      },
      {
        ...commonOpts,
        tableName: 't_post_like'
      }
    ]
  },
  postView: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(1),
        user_id: FIELDS.bigInt(),
        post_id: FIELDS.bigInt(),
        ip: FIELDS.stringLen(32),
        view_date: FIELDS.stringLen(8)
      },
      {
        ...commonOpts,
        tableName: 't_post_view'
      }
    ]
  },
  share: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(1),
        user_id: FIELDS.bigInt(),
        category: FIELDS.stringLen(12),
        post_id: FIELDS.bigInt(),
        goods_id: FIELDS.bigInt(),
        uuid: FIELDS.uuid()
      },
      {
        ...commonOpts,
        tableName: 't_share'
      }
    ]
  },
  goods: () => {
    return () => {
      return [{
          ...commonFieldGet(),
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
          price_market: FIELDS.money('price_market'),
          price_sell: FIELDS.money('price_sell'),
          price_vip: FIELDS.money('price_vip'),
          price_score_sell: FIELDS.money('price_score_sell'),
          price_score_vip: FIELDS.money('price_score_vip'),
          rabate_rate: FIELDS.defaultInt(),
          rabate_rate_vip: FIELDS.defaultInt(),
          uuid: FIELDS.uuid(),
          sales: FIELDS.defaultInt(),
          img_1: FIELDS.stringLen(255),
          img_2: FIELDS.stringLen(255),
          is_share: FIELDS.tinyInt(),
          price: FIELDS.money('price'),
          rabate_score: FIELDS.defaultInt()
        },
        {
          ...commonOpts,
          tableName: 't_goods'
        }
      ]
    }
  },
  order: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(0),
        order_no: FIELDS.stringLen(64),
        order_type: FIELDS.tinyInt(),
        user_id: FIELDS.bigInt(),
        payment: FIELDS.jsonObj('payment'),
        goods_ids: FIELDS.stringLen(512),
        goods_items: FIELDS.jsonArr('goods_items'),
        total: FIELDS.money('total'),
        total_vip: FIELDS.money('total_vip'),
        score: FIELDS.money('score'),
        score_vip: FIELDS.money('score_vip'),
        address: FIELDS.jsonObj('address'),
        invoice: FIELDS.jsonObj('invoice'),
        express: FIELDS.jsonObj('express'),
        express_fee: FIELDS.money('express_fee'),
        vip: FIELDS.tinyInt(),
        score_use: FIELDS.tinyInt(),
        rabate: FIELDS.tinyInt(),
        remark: FIELDS.stringLen(255),
        finish_time: FIELDS.defaultInt(),
        express_time: FIELDS.defaultInt(),
        express_extend_num: FIELDS.tinyInt(),
        jd_order_id: FIELDS.stringLen(32)
      },
      {
        ...commonOpts,
        tableName: 't_order'
      }
    ]
  },
  payment: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(0),
        order_ids: FIELDS.text(),
        user_id: FIELDS.bigInt(),
        pay_type: FIELDS.tinyInt(),
        pay_method: FIELDS.stringLen(24),
        amount: FIELDS.money('amount'),
        balance: FIELDS.money('balance'),
        ecard: FIELDS.money('ecard'),
        ecard_id: FIELDS.bigInt(),
        info: FIELDS.text(),
        uuid: FIELDS.stringLen(64),
        score: FIELDS.money('score'),
        notify_info: FIELDS.jsonObj('notify_info'),
        refund: FIELDS.jsonObj('refund')
      },
      {
        ...commonOpts,
        tableName: 't_payment'
      }
    ]
  },
  // orderRate: () => {
  //   return [{
  //       ...commonFieldGet(),
  //       status: getStatusFields(1),
  //       user_id: FIELDS.bigInt(),
  //       order_id: FIELDS.bigInt(),
  //       goods_id: FIELDS.bigInt(),
  //       level: FIELDS.tinyInt(),
  //       info: FIELDS.text()
  //     },
  //     {
  //       ...commonOpts,
  //       tableName: 't_order_rate'
  //     }
  //   ]
  // },
  orderItem: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(0),
        user_id: FIELDS.bigInt(),
        order_id: FIELDS.bigInt(),
        goods_id: FIELDS.bigInt(),
        num: FIELDS.defaultInt(),
        num_rabate: FIELDS.money('num_rabate'),
        num_rabate_share: FIELDS.money('num_rabate_share'),
        num_rabate_post: FIELDS.money('num_rabate_post'),
        num_rabate_invite: FIELDS.money('num_rabate_invite'),
        share_user_id: FIELDS.bigInt(),
        post_user_id: FIELDS.bigInt(),
        invite_user_id: FIELDS.bigInt(),
        goods_title: FIELDS.stringLen(255),
        goods_cover: FIELDS.stringLen(255),
        goods_amount: FIELDS.money('goods_amount'),
        rate_level: FIELDS.tinyInt(),
        rate_info: FIELDS.stringLen(1000),
        rate_imgs: FIELDS.jsonArr('rate_imgs'),
        rate_time: FIELDS.defaultInt(),
        order_status: FIELDS.tinyInt(),
        rabate_date: FIELDS.stringLen(8),
        profit: FIELDS.money('profit'),
        profit_over: FIELDS.money('profit_over'),
      },
      {
        ...commonOpts,
        tableName: 't_order_item'
      }
    ]
  },
  orderAfter: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(0),
        user_id: FIELDS.bigInt(),
        order_id: FIELDS.bigInt(),
        goods_ids: FIELDS.stringLen(1000),
        imgs: FIELDS.jsonArr('imgs'),
        info: FIELDS.text(),
        type: FIELDS.stringLen(64),
        category: FIELDS.stringLen(64),
        after_no: FIELDS.stringLen(64),
        total: FIELDS.money('total'),
        score: FIELDS.defaultInt(),
        items: FIELDS.jsonArr('items'),
        remark: FIELDS.stringLen(1000)
      },
      {
        ...commonOpts,
        tableName: 't_order_after'
      }
    ]
  },
  schedule: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(1),
        name: FIELDS.stringLen(32),
        title: FIELDS.stringLen(64),
        rule: FIELDS.stringLen(32)
      },
      {
        ...commonOpts,
        tableName: 't_schedule'
      }
    ]
  },
  notice: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(0),
        title: FIELDS.stringLen(64),
        info: FIELDS.stringLen(1000),
        content: FIELDS.text(),
        push: FIELDS.tinyInt(),
        cover: FIELDS.stringLen(255)
      },
      {
        ...commonOpts,
        tableName: 't_notice'
      }
    ]
  },
  config: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(0),
        name: FIELDS.stringLen(24),
        title: FIELDS.stringLen(64),
        type: FIELDS.stringLen(12),
        content: FIELDS.stringLen(1000)
      },
      {
        ...commonOpts,
        tableName: 't_config'
      }
    ]
  },
  category: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(0),
        name: FIELDS.stringLen(24),
        title: FIELDS.stringLen(64),
        type: FIELDS.stringLen(12),
        pid: FIELDS.bigInt(),
        sort: FIELDS.defaultInt(),
        jd_num: FIELDS.defaultInt()
      },
      {
        ...commonOpts,
        tableName: 't_category'
      }
    ]
  },
  album: () => {
    return [{
        ...commonFieldGet(),
        status: getStatusFields(0),
        description: FIELDS.stringLen(1000),
        type: FIELDS.stringLen(12),
        title: FIELDS.stringLen(64),
        url: FIELDS.stringLen(255),
        img: FIELDS.stringLen(255),
        thumb: FIELDS.stringLen(255),
        sort: FIELDS.defaultInt(),
        type_id: FIELDS.bigInt()
      },
      {
        ...commonOpts,
        tableName: 't_album'
      }
    ]
  },
  verifycode: () => {
    return [{
        ...commonFieldGet(),
        mobile: FIELDS.stringLen(16),
        verify_code: FIELDS.defaultInt(),
        status: FIELDS.tinyInt(),

      },
      {
        ...commonOpts,
        tableName: 't_verify_code_records'
      }
    ]
  },
  token: () => {
    return [{
        ...commonFieldGet(),
        name: FIELDS.stringLen(60),
        content: FIELDS.text(),
        status: FIELDS.tinyInt()
      },
      {
        ...commonOpts,
        tableName: 't_token'
      }
    ]
  },
  migUser: () => {
    return [{
        ...commonFieldGet(),
        user_id: FIELDS.bigInt(),
        mobile: FIELDS.stringLen(16),
        nickname: FIELDS.stringLen(64),
        create_date: FIELDS.stringLen(64),
        update_date: FIELDS.stringLen(64),
        status: FIELDS.tinyInt()
      },
      {
        ...commonOpts,
        tableName: 't_mig_user'
      }
    ]
  },
  migUserBalance: () => {
    return [{
        ...commonFieldGet(),
        user_id: FIELDS.bigInt(),
        balance: FIELDS.bigInt()
      },
      {
        ...commonOpts,
        tableName: 't_mig_user_balance'
      }
    ]
  },
  migUserScore: () => {
    return [{
        ...commonFieldGet(),
        user_id: FIELDS.bigInt(),
        score: FIELDS.bigInt()
      },
      {
        ...commonOpts,
        tableName: 't_mig_user_score'
      }
    ]
  },
  statistics: () => {
    return [{
        ...commonFieldGet(),
        registration_amount: FIELDS.defaultInt(),
        active_user: FIELDS.defaultInt(),
        active_user_composition: FIELDS.defaultInt(),
        order_quantity: FIELDS.defaultInt(),
        new_vip_user: FIELDS.defaultInt(),
        vip_user_amount: FIELDS.defaultInt(),
        user_amount: FIELDS.defaultInt(),
      },
      {
        ...commonOpts,
        tableName: 't_daily_statistics'
      }
    ]
  },
}