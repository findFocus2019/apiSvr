const request = require('./../../request')

describe('test app api', () => {

  it('user register', async () => {
    let ret = await request.post('app/auth/register', {
      body: {
        mobile: '18676669417',
        password: '123456',
        verify_code: '0512',
        type: 0
      }
    })

    console.log(ret)
  })
})