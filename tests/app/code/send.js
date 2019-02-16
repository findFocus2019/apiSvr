const request = require('./../../request')

describe('test app api', () => {

  it('app code send', async () => {
    let ret = await request.post('app/pub/sendSmsCode', {
      body: {
        token: 'b18a8dfd-3eda-495c-90f7-a5f658b10d7d',
        mobile: '13433856321',
        code: 4202
        // info: '板凳.......'
      }
    })

    console.log(ret)
  })
})