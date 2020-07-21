import faker from 'faker'

import { Connection } from '../../src/connection/connection'
import { createOptions } from '../../src/repository/create-options'
import { Repository } from '../../src/repository/repository'
import { Something } from '../stubs/something'
import { User } from '../stubs/user'


async function createSafeConnection(tableName: string): Promise<Connection> {
  const ddb = await global.createDynamoClient()
  const connection = new Connection(ddb, {
    tables: [{
      tableName,
      pk: { name: 'pk' },
      sk: { name: 'sk' },
    }],
  })
  const tableNames = await ddb.listTables().promise().then(({ TableNames }) => TableNames ?? [])
  if (tableNames.includes(tableName)) {
    await ddb.deleteTable({ TableName: tableName }).promise()
  }
  await ddb.createTable({
    TableName: tableName,
    KeySchema: [
      { AttributeName: 'pk', KeyType: 'HASH' },
      { AttributeName: 'sk', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'pk', AttributeType: 'S' },
      { AttributeName: 'sk', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  }).promise()
  return connection
}


function range(count: number): number[] {
  return [...new Array(count).keys()]
}

function sortBy<T>(key: keyof T) {
  return (a: T, b: T) => {
    if (a[key] === b[key]) {
      return 0
    }
    return a[key] > b[key] ? 1 : -1
  }
}

describe('testsuite of repository/repository', () => {

  const TableName = 'dynamo1_repository_tests'
  const connectionPromise = createSafeConnection(TableName)

  it('test create', async () => {
    const connection = await connectionPromise
    const repository = new Repository(connection, createOptions(User))

    const user1 = repository.create()

    expect(user1).toEqual({
      id: null,
      username: null,
      email: null,
      updatedAt: null,
      createdAt: null,
    })
    expect(user1).toBeInstanceOf(User)


    const fakeUser = {
      username: faker.internet.userName(),
      email: faker.internet.email(),
    }

    const user2 = repository.create(fakeUser)

    expect(user2).toEqual({
      id: null,
      username: fakeUser.username,
      email: fakeUser.email,
      updatedAt: null,
      createdAt: null,
    })
    expect(user2).toBeInstanceOf(User)
  })

  it('test create and persist (onCreate)', async () => {
    const connection = await connectionPromise
    const repository = new Repository(connection, createOptions(User))

    const now = new Date().getTime()

    const fakeUser = {
      username: faker.internet.userName(),
      email: faker.internet.email(),
    }

    const user = await repository.persist(repository.create(fakeUser))

    expect(user.id).toHaveLength(36) // uuid
    expect(user.createdAt).toBeGreaterThanOrEqual(now)
    expect(user.createdAt).toBeLessThan(now + 1000)
    expect(user.updatedAt).toBeGreaterThanOrEqual(now)
    expect(user.updatedAt).toBeLessThan(now + 1000)

    expect(user).toEqual({
      id: user.id,
      username: fakeUser.username,
      email: fakeUser.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    expect(user).toBeInstanceOf(User)

    await expect(connection.getItem({ pk: 'users', sk: user.id })).resolves.toEqual({
      cursor: {
        pk: 'users',
        sk: user.id,
      },
      data: {
        user_id: user.id,
        username: fakeUser.username,
        email: fakeUser.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  })

  it('test transform all data types', async () => {
    const connection = await connectionPromise
    const repository = connection.getRepository(Something)

    const node1 = await repository.persist(repository.create({
      typeNull: null,
      typeUndefined: undefined,
      typeString: 'string',
      typeEmptyString: '',
      typeNumber: 10,
      typeTrue: true,
      typeFalse: false,
      typeArray: [null, undefined, 'string', '', 10, true, false],
      typeEmptyArray: [],
      typeObject: {
        typeNull: null,
        typeUndefined: undefined,
        typeString: 'string',
        typeEmptyString: '',
        typeNumber: 10,
        typeTrue: true,
        typeFalse: false,
        typeArray: [null, undefined, 'string', '', 10, true, false],
        typeObject: {},
      },
    }))

    await expect(repository.findOne({ id: node1.id })).resolves.toEqual({
      id: node1.id,
      typeNull: null,
      typeUndefined: null, // undefined -> null
      typeString: 'string',
      typeEmptyString: null, // empty string -> null
      typeNumber: 10,
      typeTrue: true,
      typeFalse: false,
      typeArray: [null, null, 'string', null, 10, true, false],
      typeEmptyArray: [],
      typeObject: {
        typeNull: null,
        typeUndefined: null,
        typeString: 'string',
        typeEmptyString: null,
        typeNumber: 10,
        typeTrue: true,
        typeFalse: false,
        typeArray: [null, null, 'string', null, 10, true, false],
        typeObject: {},
      },
    })
  })

  it('test assign', async () => {
    const connection = await connectionPromise
    const repository = new Repository(connection, createOptions(User))

    const fakeUser = {
      username: faker.internet.userName(),
      email: faker.internet.email(),
    }

    const user = repository.create()
    repository.assign(user, fakeUser)

    expect(user).toEqual({
      id: null,
      username: fakeUser.username,
      email: fakeUser.email,
      updatedAt: null,
      createdAt: null,
    })
    expect(user).toBeInstanceOf(User)
  })


  it('test assign and persist (onUpdate)', async () => {
    const connection = await connectionPromise
    const repository = new Repository(connection, createOptions(User))

    await connection.putItem({
      cursor: { pk: 'users', sk: '0000-0000-0000-0000' },
      data: {
        user_id: '0000-0000-0000-0000',
        username: 'wan2land',
        email: 'wan2land@gmail.com',
        createdAt: 1577836800000,
        updatedAt: 1577836800000,
      },
    })

    const user = (await repository.findOne({ id: '0000-0000-0000-0000' }))!

    repository.assign(user, {
      email: 'wan3land@gmail.com',
    })

    expect(user.createdAt).toEqual(1577836800000)
    expect(user.updatedAt).toEqual(1577836800000)

    const updatedUser = await repository.persist(user)

    expect(updatedUser).toBe(user)

    expect(user.createdAt).toEqual(1577836800000)
    expect(user.updatedAt).not.toEqual(1577836800000) // onUpdate!
  })


  it('test findOne', async () => {
    const connection = await createSafeConnection(TableName)
    const repository = new Repository(connection, createOptions(User))
    const fakeUser = {
      username: faker.internet.userName(),
      email: faker.internet.email(),
    }

    const user = await repository.persist(repository.create(fakeUser))

    const foundUser = await repository.findOne({ id: user.id })

    expect(user).toEqual(foundUser)
    expect(foundUser).toBeInstanceOf(User)
  })


  it('test findMany', async () => {
    const connection = await createSafeConnection(TableName)
    const repository = new Repository(connection, createOptions(User))

    const users = await repository.persist(range(10).map(_ => repository.create({
      username: faker.internet.userName(),
      email: faker.internet.email(),
    })))

    const foundUsers = await repository.findMany()

    expect(foundUsers.nodes.length).toEqual(10)
    expect(users.sort(sortBy('id'))).toEqual(foundUsers.nodes.sort(sortBy('id')))
    for (const foundUser of foundUsers.nodes) {
      expect(foundUser).toBeInstanceOf(User)
    }
  })

  it('test remove', async () => {
    const connection = await createSafeConnection(TableName)
    const repository = new Repository(connection, createOptions(User))
    const fakeUser = {
      username: faker.internet.userName(),
      email: faker.internet.email(),
    }

    const user = await repository.persist(repository.create(fakeUser))

    await expect(repository.findOne({ id: user.id })).resolves.toEqual(user) // exists

    await expect(repository.remove(user)).resolves.toEqual(user) // return void

    await expect(repository.findOne({ id: user.id })).resolves.toBeNull()
  })
})
