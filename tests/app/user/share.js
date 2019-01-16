const request = require('../../request')

describe('test app api', () => {

  it('user login', async () => {
    let ret = await request.post('app/user/shareAction', {
      body: {
        token: 'ad193e5a-64c7-4127-a3ab-247114ad1607',
        category: 'posts',
        post_id: '8893884346252976057',
        goods_id: 0
      }
    })

    console.log(ret)
  })
})