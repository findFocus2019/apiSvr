const request = require('./request')

describe('test', () => {

  it('test user', async () => {
    let ret = await request.post('admin/user/info', {
      query: {
        id: 1
      }
    })

    console.log(ret)
  })
})