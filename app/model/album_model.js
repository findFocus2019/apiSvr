const Model = require('./../../lib/model')
const {
  album
} = require('./../../config/models')

class AlbumModel extends Model{
  model() {
    return this.db().define('album', album()[0], album()[1])
  }

}

module.exports = new AlbumModel()