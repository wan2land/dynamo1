import { Connection } from '../../src/connection/connection'
import { Repository } from '../../src/repository/repository'
import { Article } from '../stubs/article'
import { ArticleRepository } from '../stubs/article-repository'
import { User } from '../stubs/user'
import { range } from '../../src/utils/array'

async function createSafeConnection(tableName: string): Promise<Connection> {
  const ddb = await global.createDynamoClient()
  const connection = new Connection(ddb, {
    tables: [{
      tableName,
      hashKey: { name: 'hash_key' },
      rangeKey: { name: 'range_key' },
      gsi: [
        {
          name: 'gsi0',
          hashKey: { name: 'gsi0_hash_key' },
        },
      ],
    }],
    repositories: [
      [Article, ArticleRepository],
    ],
  })
  const tableNames = await ddb.listTables().promise().then(({ TableNames }) => TableNames ?? [])
  if (tableNames.includes(tableName)) {
    await ddb.deleteTable({ TableName: tableName }).promise()
  }
  await ddb.createTable({
    TableName: tableName,
    KeySchema: [
      { AttributeName: 'hash_key', KeyType: 'HASH' },
      { AttributeName: 'range_key', KeyType: 'RANGE' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'gsi0',
        KeySchema: [
          { AttributeName: 'gsi0_hash_key', KeyType: 'HASH' },
        ],
        Projection: {
          ProjectionType: 'KEYS_ONLY',
        },
      },
    ],
    AttributeDefinitions: [
      { AttributeName: 'hash_key', AttributeType: 'S' },
      { AttributeName: 'range_key', AttributeType: 'S' },
      { AttributeName: 'gsi0_hash_key', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  }).promise()
  return connection
}

describe('testsuite of connection/connection', () => {

  const TableName = 'dynamo1_connection_tests'
  const connectionPromise = createSafeConnection(TableName)

  it('test getRepository', async () => {
    const connection = await connectionPromise

    const userRepo = connection.getRepository(User)
    expect(userRepo).toBeInstanceOf(Repository)
    expect(connection.getRepository(User)).toBe(userRepo)

    const articleRepo = connection.getRepository(Article)
    expect(articleRepo).toBeInstanceOf(Repository)
    expect(articleRepo).toBeInstanceOf(ArticleRepository)
    expect(connection.getRepository(Article)).toBe(articleRepo)
  })

  it('test getItem', async () => {
    const connection = await connectionPromise

    await expect(connection.getItem({ hashKey: 'users-0', rangeKey: 'users-0_0' })).resolves.toEqual(null)

    await connection.client.putItem({
      TableName,
      Item: {
        hash_key: { S: 'users-0' },
        range_key: { S: 'users-0_0' },
        value: { S: 'this is test getItem' },
      },
    }).promise()

    await expect(connection.getItem({ hashKey: 'users-0', rangeKey: 'users-0_0' })).resolves.toEqual({
      cursor: {
        hashKey: 'users-0',
        rangeKey: 'users-0_0',
      },
      data: {
        value: 'this is test getItem',
      },
    })
  })

  it('test getManyItems', async () => {
    const connection = await connectionPromise

    expect(await connection.getManyItems([
      { hashKey: 'users-1', rangeKey: 'users-1_0' },
      { hashKey: 'users-1', rangeKey: 'users-1_1' },
      { hashKey: 'users-1', rangeKey: 'users-1_2' },
    ])).toEqual([])

    await connection.client.putItem({
      TableName,
      Item: {
        hash_key: { S: 'users-1' },
        range_key: { S: 'users-1_0' },
        value: { S: 'this is test getManyItems 0' },
      },
    }).promise()
    await connection.client.putItem({
      TableName,
      Item: {
        hash_key: { S: 'users-1' },
        range_key: { S: 'users-1_1' },
        value: { S: 'this is test getManyItems 1' },
      },
    }).promise()
    await connection.client.putItem({
      TableName,
      Item: {
        hash_key: { S: 'users-1' },
        range_key: { S: 'users-1_2' },
        value: { S: 'this is test getManyItems 2' },
      },
    }).promise()

    const rows = await connection.getManyItems([
      { hashKey: 'users-1', rangeKey: 'users-1_0' },
      { hashKey: 'users-1', rangeKey: 'users-1_1' },
      { hashKey: 'users-1', rangeKey: 'users-1_2' },
    ])
    expect(rows.sort((a, b) => JSON.stringify(a.cursor) > JSON.stringify(b.cursor) ? 1 : -1)).toEqual([
      { cursor: { hashKey: 'users-1', rangeKey: 'users-1_0' }, data: { value: 'this is test getManyItems 0' } },
      { cursor: { hashKey: 'users-1', rangeKey: 'users-1_1' }, data: { value: 'this is test getManyItems 1' } },
      { cursor: { hashKey: 'users-1', rangeKey: 'users-1_2' }, data: { value: 'this is test getManyItems 2' } },
    ])
  })

  it('test putItem', async () => {
    const connection = await connectionPromise

    await expect(connection.getItem({ hashKey: 'users-2', rangeKey: 'users-2_0' })).resolves.toEqual(null)

    await expect(connection.putItem({
      cursor: {
        hashKey: 'users-2',
        rangeKey: 'users-2_0',
      },
      index: [
        { hashKey: 'users-idx0' },
      ],
      data: {
        value: 'this is test putItem',
      },
    })).resolves.toBeNull()

    await expect(connection.getItem({ hashKey: 'users-2', rangeKey: 'users-2_0' })).resolves.toEqual({
      cursor: {
        hashKey: 'users-2',
        rangeKey: 'users-2_0',
      },
      index: [
        { hashKey: 'users-idx0' },
      ],
      data: {
        value: 'this is test putItem',
      },
    })
  })

  it('test putManyItems', async () => {
    const connection = await connectionPromise

    await expect(connection.putManyItems([])).resolves.toEqual([])
    await expect(connection.putManyItems([
      {
        cursor: { hashKey: 'users-3', rangeKey: 'users-3_0' },
        index: [
          { hashKey: 'users-idx-003001' },
        ],
        data: {
          value: 'this is test putManyItems 0',
        },
      },
      {
        cursor: { hashKey: 'users-3', rangeKey: 'users-3_1' },
        index: [
          { hashKey: 'users-idx-003002' },
        ],
        data: {
          value: 'this is test putManyItems 1',
        },
      },
      {
        cursor: { hashKey: 'users-3', rangeKey: 'users-3_2' },
        data: {
          value: 'this is test putManyItems 2',
        },
      },
    ])).resolves.toEqual([true, true, true])

    await expect(connection.getItem({ hashKey: 'users-3', rangeKey: 'users-3_0' })).resolves.toEqual({
      cursor: { hashKey: 'users-3', rangeKey: 'users-3_0' },
      index: [{ hashKey: 'users-idx-003001' }],
      data: {
        value: 'this is test putManyItems 0',
      },
    })
    await expect(connection.getItem({ hashKey: 'users-3', rangeKey: 'users-3_1' })).resolves.toEqual({
      cursor: { hashKey: 'users-3', rangeKey: 'users-3_1' },
      index: [{ hashKey: 'users-idx-003002' }],
      data: {
        value: 'this is test putManyItems 1',
      },
    })
    await expect(connection.getItem({ hashKey: 'users-3', rangeKey: 'users-3_2' })).resolves.toEqual({
      cursor: { hashKey: 'users-3', rangeKey: 'users-3_2' },
      data: {
        value: 'this is test putManyItems 2',
      },
    })

    const items = range(50).map(index => ({
      cursor: { hashKey: 'users-3_4', rangeKey: `users-3_4_${index}` },
      index: [
        { hashKey: `users-idx-00301${index}` },
      ],
      data: {
        value: `this is test putManyItems ${index}`,
      },
    }))
    await connection.putManyItems(items)

    for (const item of items) {
      await expect(connection.getItem({ hashKey: item.cursor.hashKey, rangeKey: item.cursor.rangeKey })).resolves.toEqual(item)
    }
  })

  it('test deleteItem', async () => {
    const connection = await connectionPromise

    await connection.putItem({
      cursor: {
        hashKey: 'users-4',
        rangeKey: 'users-4_0',
      },
      data: {
        value: 'this is test deleteItem',
      },
    })

    await expect(connection.getItem({ hashKey: 'users-4', rangeKey: 'users-4_0' })).resolves.toEqual({
      cursor: {
        hashKey: 'users-4',
        rangeKey: 'users-4_0',
      },
      data: {
        value: 'this is test deleteItem',
      },
    })

    await expect(connection.deleteItem({ hashKey: 'users-4', rangeKey: 'users-4_0' })).resolves.toBeNull()

    await expect(connection.getItem({ hashKey: 'users-4', rangeKey: 'users-4_0' })).resolves.toEqual(null)
  })


  it('test deleteManyItems', async () => {
    const connection = await connectionPromise

    await expect(connection.putManyItems([])).resolves.toEqual([])
    await expect(connection.putManyItems([
      {
        cursor: { hashKey: 'users-5', rangeKey: 'users-5_0' },
        data: {
          value: 'this is test deleteManyItems 0',
        },
      },
      {
        cursor: { hashKey: 'users-5', rangeKey: 'users-5_1' },
        data: {
          value: 'this is test deleteManyItems 1',
        },
      },
      {
        cursor: { hashKey: 'users-5', rangeKey: 'users-5_2' },
        data: {
          value: 'this is test deleteManyItems 2',
        },
      },
    ])).resolves.toEqual([true, true, true])

    await expect(connection.getItem({ hashKey: 'users-5', rangeKey: 'users-5_0' })).resolves.toEqual({
      cursor: { hashKey: 'users-5', rangeKey: 'users-5_0' },
      data: {
        value: 'this is test deleteManyItems 0',
      },
    })
    await expect(connection.getItem({ hashKey: 'users-5', rangeKey: 'users-5_1' })).resolves.toEqual({
      cursor: { hashKey: 'users-5', rangeKey: 'users-5_1' },
      data: {
        value: 'this is test deleteManyItems 1',
      },
    })
    await expect(connection.getItem({ hashKey: 'users-5', rangeKey: 'users-5_2' })).resolves.toEqual({
      cursor: { hashKey: 'users-5', rangeKey: 'users-5_2' },
      data: {
        value: 'this is test deleteManyItems 2',
      },
    })

    await expect(connection.deleteManyItems([
      { hashKey: 'users-5', rangeKey: 'users-5_0' },
      { hashKey: 'users-5', rangeKey: 'users-5_1' },
      { hashKey: 'users-5', rangeKey: 'users-5_2' },
    ])).resolves.toEqual([true, true, true])

    await expect(connection.getItem({ hashKey: 'users-5', rangeKey: 'users-5_0' })).resolves.toBeNull()
    await expect(connection.getItem({ hashKey: 'users-5', rangeKey: 'users-5_1' })).resolves.toBeNull()
    await expect(connection.getItem({ hashKey: 'users-5', rangeKey: 'users-5_2' })).resolves.toBeNull()
  })

  it('test count', async () => {
    const connection = await connectionPromise

    await expect(connection.count({
      keyCondition: 'hash_key = :hash_key',
      values: {
        ':hash_key': 'count-users',
      },
    })).resolves.toEqual(0)

    for (let i = 0; i < 10; i++) {
      await connection.putItem({
        cursor: { hashKey: 'count-users', rangeKey: `count-users_${i}` },
        data: {
          value: `this is test count ${i}`,
        },
      })
    }

    await expect(connection.count({
      keyCondition: 'hash_key = :hash_key',
      values: {
        ':hash_key': 'count-users',
      },
    })).resolves.toEqual(10)
  })

  it('test query', async () => {
    const connection = await connectionPromise

    await expect(connection.query({
      keyCondition: 'hash_key = :hash_key',
      values: {
        ':hash_key': 'query-users',
      },
    })).resolves.toEqual({
      nodes: [],
    })

    for (let i = 0; i < 10; i++) {
      await connection.putItem({
        cursor: { hashKey: 'query-users', rangeKey: `query-users_${i}` },
        data: {
          value: `this is test query ${i}`,
        },
      })
    }

    const result1 = await connection.query({
      keyCondition: 'hash_key = :hash_key',
      values: {
        ':hash_key': 'query-users',
      },
      limit: 5,
    })
    expect(result1).toEqual({
      lastEvaluatedKey: {
        hash_key: 'query-users',
        range_key: 'query-users_4',
      },
      nodes: [
        {
          cursor: { hashKey: 'query-users', rangeKey: 'query-users_0' },
          data: {
            value: 'this is test query 0',
          },
        },
        {
          cursor: { hashKey: 'query-users', rangeKey: 'query-users_1' },
          data: {
            value: 'this is test query 1',
          },
        },
        {
          cursor: { hashKey: 'query-users', rangeKey: 'query-users_2' },
          data: {
            value: 'this is test query 2',
          },
        },
        {
          cursor: { hashKey: 'query-users', rangeKey: 'query-users_3' },
          data: {
            value: 'this is test query 3',
          },
        },
        {
          cursor: { hashKey: 'query-users', rangeKey: 'query-users_4' },
          data: {
            value: 'this is test query 4',
          },
        },
      ],
    })


    const result2 = await connection.query({
      keyCondition: 'hash_key = :hash_key',
      values: {
        ':hash_key': 'query-users',
      },
      limit: 5,
      exclusiveStartKey: result1.lastEvaluatedKey,
    })
    expect(result2).toEqual({
      lastEvaluatedKey: {
        hash_key: 'query-users',
        range_key: 'query-users_9',
      },
      nodes: [
        {
          cursor: { hashKey: 'query-users', rangeKey: 'query-users_5' },
          data: {
            value: 'this is test query 5',
          },
        },
        {
          cursor: { hashKey: 'query-users', rangeKey: 'query-users_6' },
          data: {
            value: 'this is test query 6',
          },
        },
        {
          cursor: { hashKey: 'query-users', rangeKey: 'query-users_7' },
          data: {
            value: 'this is test query 7',
          },
        },
        {
          cursor: { hashKey: 'query-users', rangeKey: 'query-users_8' },
          data: {
            value: 'this is test query 8',
          },
        },
        {
          cursor: { hashKey: 'query-users', rangeKey: 'query-users_9' },
          data: {
            value: 'this is test query 9',
          },
        },
      ],
    })
    const result3 = await connection.query({
      keyCondition: 'hash_key = :hash_key',
      values: {
        ':hash_key': 'query-users',
      },
      limit: 5,
      exclusiveStartKey: result2.lastEvaluatedKey,
    })
    expect(result3).toEqual({
      nodes: [],
    })
  })
})
