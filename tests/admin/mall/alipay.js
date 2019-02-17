const request = require('./../../request')

describe('test admin api', () => {

  it('user transOutDeal', async () => {
    let ret = await request.post('admin/mall/transOutDeal', {
      body: {
        id: 5
      }
    })

    console.log(ret)
  })
})