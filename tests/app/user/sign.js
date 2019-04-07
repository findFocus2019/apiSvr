const request = require('./../../request')

describe('test app api', () => {

  it('user sign', async () => {
    let ret = await request.post('app/auth/sign', {
      body: {
        mobile: '18676669417',
        verify_code: '0512'
      }
    })

    console.log(ret)
  })
})