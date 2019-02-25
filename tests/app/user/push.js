const request = require('./../../request')

describe('test app api', () => {

  it('user login', async () => {
    let ret = await request.post('app/pub/getPushInfo', {
      body: {
        token: '42d94b7a-ca97-4a4e-8171-df0e50c6'
      }
    })

    console.log(ret)
  })
})