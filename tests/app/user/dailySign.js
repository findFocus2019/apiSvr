const request = require('../../request')

describe('test app api', () => {

  it('user login', async () => {
    let ret = await request.post('app/user/dailySign', {
      body: {
        token: 'ad193e5a-64c7-4127-a3ab-247114ad1607'
      }
    })

    console.log(ret)
  })
})