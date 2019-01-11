module.exports = {
  port: 5001,
  signKey: '123456',
  db: {
    host: '59939c0a9a983.gz.cdb.myqcloud.com',
    port: 5579,
    dbname: '2019_find_focus',
    username: 'root',
    password: 'Lc19890512',
    maxLimit: 1000,
  },

  tasks: {
    REGISTER: 'register', // 用户注册
    POSTS_VIEW: 'posts_view', //文章阅读
  },
  taskType: {
    day: '每日任务',
    one: '一次性任务'
  },
  taskTypeVals: {
    DAY: 'day',
    ONE: 'one'
  },

  newsApi: {
    appId: '85387',
    secret: '5e62271be7b8464ab05d44e078ce8064'
  },

  postListAttributes: {
    exclude: ['info', 'content']
  },

  shareCategory: {
    POSTS: 'posts',
    GOODS: 'goods'
  },

  userApplyTypes: {
    SHARE_LEVEL: 'share_level'
  },

  userAddressCountLimit: 5
}