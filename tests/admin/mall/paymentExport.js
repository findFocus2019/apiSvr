const request = require('./../../request')

describe('test admin api', () => {

  it('user paymentExport', async () => {
      let ret = await request.post('admin/mall/paymentExport', {
        body: {
          // id: 5
        }
      })
      console.log(ret)
  })
})