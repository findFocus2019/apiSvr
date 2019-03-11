const request = require('./../../request')

describe('test admin api', () => {

  it('user orderExport', async () => {
      let ret = await request.post('admin/mall/orderExport', {
        body: {
          id: 5
        }
      })
      console.log(ret)
  })
})