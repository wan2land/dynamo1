import { createOptions } from '../../src/repository/create-options'
import { User } from '../stubs/user'


describe('testsuite of repository/create-options', () => {
  it('test createOptions of User', () => {
    expect(createOptions(User)).toEqual({
      target: User,
      name: 'users',
      aliasName: 'default',
      separator: '#',
      pk: [{ type: 'text', value: 'users' }],
      sk: [{ type: 'column', value: 'id' }],
      gsi: [],
      columns: [
        {
          target: User,
          property: 'id',
          name: 'user_id',
          onCreate: expect.any(Function),
        },
        {
          target: User,
          property: 'username',
          name: 'username',
        },
        {
          target: User,
          property: 'email',
          name: 'email',
        },
        {
          target: User,
          property: 'createdAt',
          name: 'createdAt',
          onCreate: expect.any(Function),
        },
        {
          target: User,
          property: 'updatedAt',
          name: 'updatedAt',
          onCreate: expect.any(Function),
          onUpdate: expect.any(Function),
        },
      ],
    })
  })
})
