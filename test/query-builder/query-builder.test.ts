import { QueryBuilder } from '../../src/interfaces/query-builder'
import { Compiler } from '../../src/query-builder/compiler'
import { DefaultQueryBuilder } from '../../src/query-builder/default-query-builder'
import { between } from '../../src/query-builder/operand/between'
import { beginsWith } from '../../src/query-builder/operand/function'


describe('testsuite of query-builder/query-builder', () => {
  const compiler = new Compiler({
    tableName: 'table_name',
    hashKey: { name: 'table_hash_key' },
    rangeKey: { name: 'table_range_key' },
    gsi: [
      {
        name: 'gsi0',
        hashKey: { name: 'gsi0_hash_key' },
        rangeKey: { name: 'gsi0_range_key' },
      },
    ],
  })

  it('test key equal operator', () => {
    expect(compiler.compile(new DefaultQueryBuilder().key({
      hashKey: 'users',
      rangeKey: 10,
    }).stateRoot)).toEqual({
      keyCondition: 'table_hash_key = :hashkey and table_range_key = :rangekey',
      names: {
      },
      values: {
        ':hashkey': 'users',
        ':rangekey': 10,
      },
    })

    expect(compiler.compile(new DefaultQueryBuilder().key({
      hashKey: 'users',
      rangeKey: ['=', 10],
    }).stateRoot)).toEqual({
      keyCondition: 'table_hash_key = :hashkey and table_range_key = :rangekey',
      names: {
      },
      values: {
        ':hashkey': 'users',
        ':rangekey': 10,
      },
    })
  })

  it('test key comparision operator', () => {
    const operators = ['>', '>=', '<', '<='] as ('>' | '>=' | '<' | '<=')[]
    for (const operator of operators) {
      expect(compiler.compile(new DefaultQueryBuilder().key({
        hashKey: 'users',
        rangeKey: [operator, 10],
      }).stateRoot)).toEqual({
        keyCondition: `table_hash_key = :hashkey and table_range_key ${operator} :rangekey`,
        names: {
        },
        values: {
          ':hashkey': 'users',
          ':rangekey': 10,
        },
      })
    }
  })

  it('test key beginsWith operator', () => {
    expect(compiler.compile(new DefaultQueryBuilder().key({
      hashKey: 'users',
      rangeKey: beginsWith('wan2land-'),
    }).stateRoot)).toEqual({
      keyCondition: 'table_hash_key = :hashkey and begins_with(table_range_key, :rangekey)',
      names: {
      },
      values: {
        ':hashkey': 'users',
        ':rangekey': 'wan2land-',
      },
    })
  })

  it('test key between operator', () => {
    expect(compiler.compile(new DefaultQueryBuilder().key({
      hashKey: 'users',
      rangeKey: between('id_0000', 'id_0100'),
    }).stateRoot)).toEqual({
      keyCondition: 'table_hash_key = :hashkey and table_range_key between :rangekey_from and :rangekey_to',
      names: {
      },
      values: {
        ':hashkey': 'users',
        ':rangekey_from': 'id_0000',
        ':rangekey_to': 'id_0100',
      },
    })
  })

  it('test key by index name', () => {
    expect(compiler.compile(new DefaultQueryBuilder().key({
      hashKey: 'users',
      rangeKey: 10,
    }, 'gsi0').stateRoot)).toEqual({
      keyCondition: 'gsi0_hash_key = :hashkey and gsi0_range_key = :rangekey',
      names: {
      },
      indexName: 'gsi0',
      values: {
        ':hashkey': 'users',
        ':rangekey': 10,
      },
    })
  })

  it('test filter simple', () => {
    const qb = new DefaultQueryBuilder()
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

    expect(compiler.compile(qb.stateRoot)).toEqual({
      filter: '#filter_0 = :filter_0 or col1 = :filter_1 and col2 = :filter_2 or col3 > :filter_3 and col4 < :filter_4 or col5 between :filter_5_from and :filter_5_to and begins_with(col6, :filter_6) and not (col7 = :filter_7) or not (col8 > :filter_8) and not (col9 < :filter_9)',
      names: {
        '#filter_0': 'users',
      },
      values: {
        ':filter_0': 10,
        ':filter_1': 20,
        ':filter_2': 30,
        ':filter_3': 40,
        ':filter_4': 50,
        ':filter_5_from': 10,
        ':filter_5_to': 20,
        ':filter_6': 'category1_',
        ':filter_7': 11,
        ':filter_8': 12,
        ':filter_9': 13,
      },
    })
  })

  it('test filter brace', () => {
    const qb = new DefaultQueryBuilder()
    ;(qb as QueryBuilder<object>).filter((qb) => qb.filter('col1', 10).orFilter('col1', 20).orFilter((qb) => qb.filter('col1', 30).orFilter('col1', 40)))
      .orFilter((qb) => qb.filter('col2', 11).orFilter('col2', 21))
      .andFilter((qb) => qb.filter('col3', 12).orFilter('col3', 22))
      .filterNot((qb) => qb.filter('col4', 13).orFilter('col4', 23))
      .orFilterNot((qb) => qb.filter('col5', 14).orFilter('col5', 24))
      .andFilterNot((qb) => qb.filter('col6', 15).orFilter('col6', 25))

    expect(compiler.compile(qb.stateRoot)).toEqual({
      filter: [
        '(col1 = :filter_0_0 or col1 = :filter_0_1 or (col1 = :filter_0_2_0 or col1 = :filter_0_2_1))',
        'or (col2 = :filter_1_0 or col2 = :filter_1_1)',
        'and (col3 = :filter_2_0 or col3 = :filter_2_1)',
        'and not (col4 = :filter_3_0 or col4 = :filter_3_1)',
        'or not (col5 = :filter_4_0 or col5 = :filter_4_1)',
        'and not (col6 = :filter_5_0 or col6 = :filter_5_1)',
      ].join(' '),
      names: {
      },
      values: {
        ':filter_0_0': 10,
        ':filter_0_1': 20,
        ':filter_0_2_0': 30,
        ':filter_0_2_1': 40,
        ':filter_1_0': 11,
        ':filter_1_1': 21,
        ':filter_2_0': 12,
        ':filter_2_1': 22,
        ':filter_3_0': 13,
        ':filter_3_1': 23,
        ':filter_4_0': 14,
        ':filter_4_1': 24,
        ':filter_5_0': 15,
        ':filter_5_1': 25,
      },
    })
  })

  it('test limit', () => {
    expect(compiler.compile(new DefaultQueryBuilder().limit(10).stateRoot)).toEqual({
      names: {},
      values: {},
      limit: 10,
    })

    expect(compiler.compile(new DefaultQueryBuilder().limit(null).stateRoot)).toEqual({
      names: {},
      values: {},
    })
  })

  it('test scanIndexForward', () => {
    expect(compiler.compile(new DefaultQueryBuilder().scanIndexForward(true).stateRoot)).toEqual({
      names: {},
      values: {},
      scanIndexForward: true,
    })

    expect(compiler.compile(new DefaultQueryBuilder().scanIndexForward(false).stateRoot)).toEqual({
      names: {},
      values: {},
      scanIndexForward: false,
    })

    expect(compiler.compile(new DefaultQueryBuilder().scanIndexForward(null).stateRoot)).toEqual({
      names: {},
      values: {},
    })
  })

  it('test scanIndexForward', () => {
    expect(compiler.compile(new DefaultQueryBuilder().scanIndexForward(true).stateRoot)).toEqual({
      names: {},
      values: {},
      scanIndexForward: true,
    })

    expect(compiler.compile(new DefaultQueryBuilder().scanIndexForward(false).stateRoot)).toEqual({
      names: {},
      values: {},
      scanIndexForward: false,
    })

    expect(compiler.compile(new DefaultQueryBuilder().scanIndexForward(null).stateRoot)).toEqual({
      names: {},
      values: {},
    })
  })

  it('test exclusiveStartKey', () => {
    expect(compiler.compile(new DefaultQueryBuilder().exclusiveStartKey({ hashKey: 'users', rangeKey: 100 }).stateRoot)).toEqual({
      names: {},
      values: {},
      exclusiveStartKey: {
        hashKey: 'users',
        rangeKey: 100,
      },
    })
  })
})
