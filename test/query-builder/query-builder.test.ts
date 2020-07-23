import { Compiler } from '../../src/query-builder/compiler'
import { beginsWith } from '../../src/query-builder/operators/begins-with-operator-resolver'
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

  it('test key', () => {
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
})
