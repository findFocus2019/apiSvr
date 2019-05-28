process.env.NODE_ENV = 'production'

const Schedule = require('../schedule/main')

let schedule = Schedule.getSchedule()

schedule.syncGoods()

// schedule.fetchNews()

// schedule.rabateDealDay()

// schedule.submitJdOrder()

// schedule.orderConfirm()

// schedule.dailyStatistics()