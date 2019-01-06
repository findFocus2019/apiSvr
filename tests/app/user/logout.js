const request = require('./../../request')

describe('test app api', () => {

  it('user logout', async () => {
    let ret = await request.post('app/user/logout', {
      body: {
        token: '4948e697-9e11-40dc-8447-e380d132'
      }
    })

    console.log(ret)
  })
})