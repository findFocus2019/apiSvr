const request = require('./../../request')

describe('test admin api', () => {

  it('user register', async () => {
    let ret = await request.post('admin/mall/transOutDeal', {
      body: {
        id: 3
      }
    })

    console.log(ret)
  })
})