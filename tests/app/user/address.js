const request = require('../../request')

describe('test app api', () => {

  // it('user addressUpdate', async () => {
  //   let ret = await request.post('app/user/addressUpdate', {
  //     body: {
  //       token: 'ad193e5a-64c7-4127-a3ab-247114ad1607',
  //       id: '1',
  //       name: '鲁聪',
  //       mobile: '18676669411',
  //       info: '详细地址.......3'
  //     }
  //   })

  //   console.log(ret)
  // })

  it('user addressDelete', async () => {
    let ret = await request.post('app/user/addressDelete', {
      body: {
        token: 'ad193e5a-64c7-4127-a3ab-247114ad1607',
        address_id: 1
      }
    })

    console.log(ret)
  })

  // it('user addressList', async () => {
  //   let ret = await request.post('app/user/address', {
  //     body: {
  //       token: 'ad193e5a-64c7-4127-a3ab-247114ad1607'
  //     }
  //   })

  //   console.log(ret)
  // })
})