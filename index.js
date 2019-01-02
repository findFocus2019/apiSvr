const express = require('express')
const app = express()

const bodyParser = require('body-parser') // 处理请求中body的内容
const methodOverride = require('method-override')
const uuid = require('uuid')

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

// 路由
app.use(require('./app/controller'))

// 错误处理

const port = process.env.PORT || 5001
app.listen(port, () => {
	console.log(`apiSvr listening on port ${port}`)
})