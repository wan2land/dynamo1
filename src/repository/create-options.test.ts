import { createOptions } from './create-options'
import { User } from '../../stubs/user'


describe('testsuite of repository/create-options', () => {
  it('test createOptions of User', () => {
    expect(createOptions(User)).toEqual({
      name: 'user',
      ctor: User,
      id: {
        property: 'id',
        sourceKey: 'user_id',
      },
      generatedValues: [
        {
          property: 'id',
          strategy: 'uuid',
        },
      ],
      indexes: [
        {
          name: 'created',
          indexer: expect.any(Function),
        },
      ],
      columns: [
        {
          property: 'id',
          sourceKey: 'user_id',
          type: 'string',
          nullable: false,
        },
        {
          property: 'username',
          sourceKey: 'username',
          type: 'string',
          nullable: false,
        },
        {
          property: 'email',
          sourceKey: 'email',
          type: 'string',
          nullable: false,
        },
        {
          property: 'createdAt',
          sourceKey: 'created_at',
          type: 'string',
          nullable: false,
        },
      ],
      relations: [],
    })
  })
})
