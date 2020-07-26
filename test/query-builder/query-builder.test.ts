import { Compiler } from '../../src/query-builder/compiler'
import { between } from '../../src/query-builder/operand/between'
import { beginsWith } from '../../src/query-builder/operand/function'
import { QueryBuilder } from '../../src/query-builder/query-builder'


describe('testsuite of query-builder/query-builder', () => {
  const compiler = new Compiler({
    tableName: 'table_name',
    pk: { name: 'table_pk' },
    sk: { name: 'table_sk' },
    gsi: [
      {
        name: 'gsi0',
        pk: { name: 'gsi0_pk' },
        sk: { name: 'gsi0_sk' },
      },
    ],
  })

  it('test key equal operator', () => {
    expect(compiler.compile(new QueryBuilder().key({
      pk: 'users',
      sk: 10,
    }))).toEqual({
      TableName: 'table_name',
      KeyConditionExpression: 'table_pk = :pk and table_sk = :sk',
      ExpressionAttributeNames: {
      },
      ExpressionAttributeValues: {
        ':pk': { S: 'users' },
        ':sk': { N: '10' },
      },
    })

    expect(compiler.compile(new QueryBuilder().key({
      pk: 'users',
      sk: ['=', 10],
    }))).toEqual({
      TableName: 'table_name',
      KeyConditionExpression: 'table_pk = :pk and table_sk = :sk',
      ExpressionAttributeNames: {
      },
      ExpressionAttributeValues: {
        ':pk': { S: 'users' },
        ':sk': { N: '10' },
      },
    })
  })

  it('test key comparision operator', () => {
    const operators = ['>', '>=', '<', '<='] as ('>' | '>=' | '<' | '<=')[]
    for (const operator of operators) {
      expect(compiler.compile(new QueryBuilder().key({
        pk: 'users',
        sk: [operator, 10],
      }))).toEqual({
        TableName: 'table_name',
        KeyConditionExpression: `table_pk = :pk and table_sk ${operator} :sk`,
        ExpressionAttributeNames: {
        },
        ExpressionAttributeValues: {
          ':pk': { S: 'users' },
          ':sk': { N: '10' },
        },
      })
    }
  })

  it('test key beginsWith operator', () => {
    expect(compiler.compile(new QueryBuilder().key({
      pk: 'users',
      sk: beginsWith('wan2land-'),
    }))).toEqual({
      TableName: 'table_name',
      KeyConditionExpression: 'table_pk = :pk and begins_with(table_sk, :sk)',
      ExpressionAttributeNames: {
      },
      ExpressionAttributeValues: {
        ':pk': { S: 'users' },
        ':sk': { S: 'wan2land-' },
      },
    })
  })

  it('test key between operator', () => {
    expect(compiler.compile(new QueryBuilder().key({
      pk: 'users',
      sk: between('id_0000', 'id_0100'),
    }))).toEqual({
      TableName: 'table_name',
      KeyConditionExpression: 'table_pk = :pk and table_sk between :sk_from and :sk_to',
      ExpressionAttributeNames: {
      },
      ExpressionAttributeValues: {
        ':pk': { S: 'users' },
        ':sk_from': { S: 'id_0000' },
        ':sk_to': { S: 'id_0100' },
      },
    })
  })

  it('test key by index name', () => {
    expect(compiler.compile(new QueryBuilder().key({
      pk: 'users',
      sk: 10,
    }, 'gsi0'))).toEqual({
      TableName: 'table_name',
      KeyConditionExpression: 'gsi0_pk = :pk and gsi0_sk = :sk',
      ExpressionAttributeNames: {
      },
      IndexName: 'gsi0',
      ExpressionAttributeValues: {
        ':pk': { S: 'users' },
        ':sk': { N: '10' },
      },
    })
  })

  it('test filter simple', () => {
    const qb = new QueryBuilder()
    qb.filter('users', 10)
      .orFilter('col1', 20)
      .andFilter('col2', 30)
      .orFilter('col3', '>', 40)
      .andFilter('col4', '<', 50)
      .orFilter('col5', between(10, 20))
      .andFilter('col6', beginsWith('category1_'))
      .filterNot('col7', 11)
      .orFilterNot('col8', '>', 12)
      .andFilterNot('col9', '<', 13)

    expect(compiler.compile(qb)).toEqual({
      TableName: 'table_name',
      FilterExpression: '#filter_0 = :filter_0 or col1 = :filter_1 and col2 = :filter_2 or col3 > :filter_3 and col4 < :filter_4 or col5 between :filter_5_from and :filter_5_to and begins_with(col6, :filter_6) and not (col7 = :filter_7) or not (col8 > :filter_8) and not (col9 < :filter_9)',
      ExpressionAttributeNames: {
        '#filter_0': 'users',
      },
      ExpressionAttributeValues: {
        ':filter_0': { N: '10' },
        ':filter_1': { N: '20' },
        ':filter_2': { N: '30' },
        ':filter_3': { N: '40' },
        ':filter_4': { N: '50' },
        ':filter_5_from': { N: '10' },
        ':filter_5_to': { N: '20' },
        ':filter_6': { S: 'category1_' },
        ':filter_7': { N: '11' },
        ':filter_8': { N: '12' },
        ':filter_9': { N: '13' },
      },
    })
  })

  it('test filter brace', () => {
    const qb = new QueryBuilder()
      .filter((qb) => qb.filter('col1', 10).orFilter('col1', 20).orFilter((qb) => qb.filter('col1', 30).orFilter('col1', 40)))
      .orFilter((qb) => qb.filter('col2', 11).orFilter('col2', 21))
      .andFilter((qb) => qb.filter('col3', 12).orFilter('col3', 22))
      .filterNot((qb) => qb.filter('col4', 13).orFilter('col4', 23))
      .orFilterNot((qb) => qb.filter('col5', 14).orFilter('col5', 24))
      .andFilterNot((qb) => qb.filter('col6', 15).orFilter('col6', 25))

    expect(compiler.compile(qb)).toEqual({
      TableName: 'table_name',
      FilterExpression: [
        '(col1 = :filter_0_0 or col1 = :filter_0_1 or (col1 = :filter_0_2_0 or col1 = :filter_0_2_1))',
        'or (col2 = :filter_1_0 or col2 = :filter_1_1)',
        'and (col3 = :filter_2_0 or col3 = :filter_2_1)',
        'and not (col4 = :filter_3_0 or col4 = :filter_3_1)',
        'or not (col5 = :filter_4_0 or col5 = :filter_4_1)',
        'and not (col6 = :filter_5_0 or col6 = :filter_5_1)',
      ].join(' '),
      ExpressionAttributeNames: {
      },
      ExpressionAttributeValues: {
        ':filter_0_0': { N: '10' },
        ':filter_0_1': { N: '20' },
        ':filter_0_2_0': { N: '30' },
        ':filter_0_2_1': { N: '40' },
        ':filter_1_0': { N: '11' },
        ':filter_1_1': { N: '21' },
        ':filter_2_0': { N: '12' },
        ':filter_2_1': { N: '22' },
        ':filter_3_0': { N: '13' },
        ':filter_3_1': { N: '23' },
        ':filter_4_0': { N: '14' },
        ':filter_4_1': { N: '24' },
        ':filter_5_0': { N: '15' },
        ':filter_5_1': { N: '25' },
      },
    })
  })

  it('test limit', () => {
    expect(compiler.compile(new QueryBuilder().limit(10))).toEqual({
      TableName: 'table_name',
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
      Limit: 10,
    })

    expect(compiler.compile(new QueryBuilder().limit(null))).toEqual({
      TableName: 'table_name',
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
    })
  })

  it('test scanIndexForward', () => {
    expect(compiler.compile(new QueryBuilder().scanIndexForward(true))).toEqual({
      TableName: 'table_name',
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
      ScanIndexForward: true,
    })

    expect(compiler.compile(new QueryBuilder().scanIndexForward(false))).toEqual({
      TableName: 'table_name',
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
      ScanIndexForward: false,
    })

    expect(compiler.compile(new QueryBuilder().scanIndexForward(null))).toEqual({
      TableName: 'table_name',
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
    })
  })

  it('test scanIndexForward', () => {
    expect(compiler.compile(new QueryBuilder().scanIndexForward(true))).toEqual({
      TableName: 'table_name',
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
      ScanIndexForward: true,
    })

    expect(compiler.compile(new QueryBuilder().scanIndexForward(false))).toEqual({
      TableName: 'table_name',
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
      ScanIndexForward: false,
    })

    expect(compiler.compile(new QueryBuilder().scanIndexForward(null))).toEqual({
      TableName: 'table_name',
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
    })
  })

  it('test exclusiveStartKey', () => {
    expect(compiler.compile(new QueryBuilder().exclusiveStartKey({ pk: 'users', sk: 100 }))).toEqual({
      TableName: 'table_name',
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
      ExclusiveStartKey: {
        pk: { S: 'users' },
        sk: { N: '100' },
      },
    })
  })
})
