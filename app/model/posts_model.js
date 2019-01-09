const Model = require('./../../lib/model')
const {
  posts
} = require('./../../config/models')

class PostsModel extends Model {

  model() {
    return this.db().define('posts', posts[0], posts[1])
  }

}

module.exports = PostsModel