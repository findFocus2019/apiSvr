const request = require('./../../request')

describe('test app api', () => {

  it('album list', async () => {
    let ret = await request.post('admin/album/list', {
      body: {
        token: 'b18a8dfd-3eda-495c-90f7-a5f658b10d7d',
        timestamp: Date.now()
      }
    })

    console.log(ret)
  })
})