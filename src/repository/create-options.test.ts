import { User } from '../../stubs/user'
import { createOptions } from './create-options'


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
          type: String,
          nullable: false,
          onCreate: expect.any(Function),
        },
        {
          target: User,
          property: 'username',
          name: 'username',
          type: String,
          nullable: false,
        },
        {
          target: User,
          property: 'email',
          name: 'email',
          type: String,
          nullable: true,
        },
        {
          target: User,
          property: 'createdAt',
          name: 'createdAt',
          type: Number,
          nullable: false,
          onCreate: expect.any(Function),
        },
        {
          target: User,
          property: 'updatedAt',
          name: 'updatedAt',
          type: Number,
          nullable: false,
          onCreate: expect.any(Function),
          onUpdate: expect.any(Function),
        },
      ],
    })
  })
})
