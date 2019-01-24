const Model = require('./../../lib/model')
const {
  posts,
  postComment,
  postView,
  postLike
} = require('./../../config/models')

class PostsModel extends Model {

  model() {
    return this.db().define('posts', posts()[0], posts()[1])
  }

  commentModel() {
    return this.db().define('post_comment', postComment()[0], postComment()[1])
  }

  viewModel() {
    return this.db().define('post_view', postView()[0], postView()[1])
  }

  likeModel() {
    return this.db().define('post_like', postLike()[0], postLike()[1])
  }

}

module.exports = PostsModel