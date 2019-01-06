const request = require('./../../request')

describe('test app api', () => {

  it('user info', async () => {
    let ret = await request.post('app/auth/login', {
      body: {
        mobile: '18676669411',
        password: '123456'
      }
    })

    console.log(ret)
  })
})