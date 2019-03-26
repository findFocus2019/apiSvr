const Schedule = require('../schedule/main')
process.env.NODE_ENV = 'production'
let schedule = Schedule.getSchedule()

// schedule.fetchNews()

// schedule.rabateDealDay()

// schedule.submitJdOrder()

schedule.orderConfirm()