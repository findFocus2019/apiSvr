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

  async channelByType(type = 1) {
    let sql = 'select channel as name from t_posts where type = :type group by channel '
    let rows = await this.query(sql, {
      type: type
    })

    console.log('rows', rows)
    let datas = [{
      id: 'all',
      name: '焦点资讯'
    }]
    rows.forEach(item => {
      datas.push({
        id: item.name,
        name: item.name
      })
    })
    return datas
  }

  async getViewCountByUserId(userId) {
    let count = await this.viewModel().count({
      where: {
        user_id: userId
      }
    })

    return count
  }

  async getCommentCountByUserId(userId) {
    let count = await this.commentModel().count({
      where: {
        user_id: userId
      }
    })

    return count
  }

  async getLikeCountByUserId(userId) {
    let count = await this.likeModel().count({
      where: {
        user_id: userId
      }
    })

    return count
  }

  async getCommentLikeCount(commentId) {
    let count = await this.likeModel().count({
      where: {
        comment_id: commentId
      }
    })

    return count
  }


}

module.exports = PostsModel