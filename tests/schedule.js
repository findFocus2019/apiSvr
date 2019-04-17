process.env.NODE_ENV = 'dev'

const Schedule = require('../schedule/main')

let schedule = Schedule.getSchedule()

schedule.fetchNews()

// schedule.rabateDealDay()

// schedule.submitJdOrder()

// schedule.orderConfirm()

// schedule.dailyStatistics()