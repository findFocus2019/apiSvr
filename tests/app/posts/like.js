const request = require('./../../request')

describe('test app api', () => {

  it('user posts view', async () => {
    let ret = await request.post('app/posts/likeAction', {
      body: {
        token: 'b18a8dfd-3eda-495c-90f7-a5f658b10d7d',
        post_id: '8893884346252976057'
      }
    })

    console.log(ret)
  })
})