const request = require('./../../request')

describe('test app api', () => {

  it('app code send', async () => {
    let ret = await request.post('app/code/verify', {
      body: {
        token: 'b18a8dfd-3eda-495c-90f7-a5f658b10d7d',
        mobile: '17666136141',
        code:6868
        // info: '板凳.......'
      }
    })

    console.log(ret)
  })
})