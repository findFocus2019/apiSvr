const config = require('./config')
const notes = []

module.exports = (req , res) => {

  let ret = {
    status: 0,
    note:notes[0],
    url:config.apkUrl
  }

  let query = req.query
  let version = query.version
  if(version && version != config.version){
    ret.status = 1
  }

  return res.json(ret)
}