const express = require('express')
const app = express()

const bodyParser = require('body-parser') // 处理请求中body的内容
const methodOverride = require('method-override')
// const uuid = require('uuid')
const config = require('./config')

// parse request bodies (req.body)
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())
app.use(bodyParser.raw({
  type: 'application/xml'
}))
app.use(bodyParser.text({
  type: 'text/xml'
}))

// allow overriding methods in query (?_method=put)
app.use(methodOverride('_method'))

// 请求处理
app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Cache-Control,XMLHttpRequest')
  res.header('Access-Control-Allow-Credentials', 'true')

  next()
})

app.use('/update' , require('./update'))
app.use('/upload', require('./lib/upload'))

// 路由
app.use(require('./app/controller'))

// 错误处理
let logErrors = (err, req, res, next) => {
  console.error(err.stack)
  next(err)
}
let clientErrorHandler = (err, req, res, next) => {
  if (req.xhr) {
    res.status(500).send({
      error: 'Something failed!'
    })
  } else {
    next(err)
  }
}
let errorHandler = (err, req, res, next) => {
  res.status(500)
  res.render('error', {
    error: err
  })
}
app.use(logErrors)
app.use(clientErrorHandler)
app.use(errorHandler)

let port = config.port || process.env.PORT || 5001
if (process.env.NODE_ENV == 'production'){
  port = '8080'
}
app.listen(port, () => {
  console.log(`apiSvr listening on port ${port}`)
})