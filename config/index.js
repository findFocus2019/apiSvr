const alipay = require('./alipay')

module.exports = {
  DEBUG: true,
  version: '2.0.1',
  apkUrl: 'http://img-juren.oss-cn-shenzhen.aliyuncs.com/app/android_debug.apk',
  domain: 'https://api.faxianjiaodian.com',

  port: 5001,
  signKey: '123456',
  // db: {
  //   host: '59939c0a9a983.gz.cdb.myqcloud.com',
  //   port: 5579,
  //   dbname: '2019_find_focus',
  //   username: 'root',
  //   password: 'Lc19890512',
  //   maxLimit: 1000,
  // },

  db: {
    // host: 'rm-wz9d95e80363zmcjjdo.mysql.rds.aliyuncs.com',
    host:'rm-wz9d95e80363zmcjj.mysql.rds.aliyuncs.com',
    port: 3306,
    dbname: 'find_focus_2019',
    username: 'find_focus_2019',
    password: 'find_focus_2019',
    maxLimit: 1000,
  },

  tasks: {
    REGISTER: 'register', // 用户注册
    DAILY_SIGN: 'daily_sign',
    DAILY_SIGN_7: 'daily_sign_7', // 连续7天签到
    POSTS_VIEW: 'posts_view', //文章阅读
    USER_INVITE: 'user_invite', // 邀请任务获得积分
  },
  taskType: {
    day: '每日任务',
    one: '一次性任务'
  },
  taskTypeVals: {
    DAY: 'day',
    ONE: 'one'
  },

  categoryType: {
    GOODS: 'goods',
    POSTS: 'posts'
  },

  newsApi: {
    appId: '85387',
    secret: '5e62271be7b8464ab05d44e078ce8064'
  },

  postListAttributes: {
    exclude: ['info', 'content']
  },

  goodsListAttributes: {
    exclude: ['content']
  },

  shareCategory: {
    POSTS: 'posts',
    GOODS: 'goods'
  },

  userApplyTypes: {
    SHARE_LEVEL: 'share_level'
  },

  userAddressCountLimit: 5,

  oss: {
    region: 'oss-cn-shenzhen',
    accessKeyId: 'LTAIrRZ0BeRJpB0l',
    accessKeySecret: 'kaLkYLuDm5zc6PCzGtxKILqJgqGf3s',
    bucket: 'img-juren',
  },

  postChannels: [
    '国内',
    '国际',
    '娱乐',
    '体育',
    '军事',
    '社会',
    '财经',
    '科技',
    '游戏',
    '教育',
    '女人'
  ],

  miniApp: {
    // appId: 'wx2e40960c5cfb7723',
    // appSecret: '0908b751cef2388e00847eb29e8303ad'
    appId: 'wxbdffe470695eab18',
    appSecret: '331af3040b5b3709a87db7a4813aba40',
    mch_id: '1526321551',
    key: 'e10adc3949ba59abbe56e057f20f883e',
  },

  alipay: alipay,

  wxpay: {
    app_id: 'wx41b753c9ce99ea27',
    key: 'e10adc3949ba59abbe56e057f20f883e',
    mch_id: '1522398771',
    notify_url: '/notify/wxpay'
  },

  // 默认邀请人id
  defaultInivteUserId: 1,

  scoreExchangeNum: 6000,

  getui:{
    host: 'https://api.getui.com/apiex.htm',
    appId:'j3F91JomB6AbpkCuDefJAA',
    appKey:'WeOHgklYJcALNyRa0W6dS5',
    appSecret:'akpv6EDmor8pOpBBNIMmC1',
    masterSecret:'hW3SrajAkuAhg5kGrnEfQ6'
  }
}