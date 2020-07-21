import { DynamoDB } from 'aws-sdk'
import { WriteRequest } from 'aws-sdk/clients/dynamodb'

import { DynamoKey, ConstructType } from '../interfaces/common'
import {
  CountParams,
  DeleteItemParams,
  DynamoCursor,
  DynamoNode,
  GetItemParams,
  PutItemParams,
  ConnectionOptions,
  ConnectionTableOption,
  QueryParams,
  QueryResult,
} from '../interfaces/connection'
import { createOptions } from '../repository/create-options'
import { Repository } from '../repository/repository'
import { fromDynamoMap } from '../utils/from-dynamo'
import { toDynamoMap, toDynamo } from '../utils/to-dynamo'
import { assertIndexableColumnType } from '../utils/type'

export class Connection {

  tableOptions = new Map<string, ConnectionTableOption>()
  definedRepos = new Map<ConstructType<any>, ConstructType<Repository<any>>>()
  cachedRepos = new Map<Function, Repository<any>>()

  constructor(public client: DynamoDB, options: ConnectionOptions) {
    if (options.tables.length === 0) {
      throw new Error('At least one table must be defined.')
    }

    this.tableOptions.set('default', options.tables[0])
    for (const tableOption of options.tables) {
      if (tableOption.aliasName) {
        this.tableOptions.set(tableOption.aliasName, tableOption)
      }
      this.tableOptions.set(tableOption.tableName, tableOption)
    }
    for (const [entity, repo] of options.repositories ?? []) {
      this.definedRepos.set(entity, repo)
    }
  }

  // TODO scan

  count(pk: DynamoKey, options: CountParams = {}): Promise<number> {
    const option = this._findOptionByAliasName(options.aliasName)
    return this.client.query({
      TableName: option.tableName,
      Select: 'COUNT',
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: {
        '#pk': option.pk.name,
      },
      ExpressionAttributeValues: {
        ':pk': toDynamo(pk),
      },
    }).promise().then(({ Count }) => Count ?? 0)
  }

  getRepository<TEntity extends object, R extends Repository<TEntity>>(entityCtor: ConstructType<TEntity>): R {
    let repository = this.cachedRepos.get(entityCtor)
    if (!repository) {
      const RepoCtor = this.definedRepos.get(entityCtor) ?? Repository
      repository = new RepoCtor(this, createOptions(entityCtor))
      this.cachedRepos.set(entityCtor, repository)
    }
    return repository as R
  }

  public query<TData extends Record<string, any>>(pk: DynamoKey, params: QueryParams = {}): Promise<QueryResult<DynamoNode<TData>>> {
    const option = this._findOptionByAliasName(params.aliasName)

    return this.client.query({
      TableName: option.tableName,
      Limit: params.limit,
      KeyConditionExpression: '#pk = :pk',
      IndexName: params.indexName,
      ExpressionAttributeNames: {
        '#pk': option.pk.name,
      },
      ExpressionAttributeValues: {
        ':pk': toDynamo(pk),
      },
      ExclusiveStartKey: params.exclusiveStartKey ? this._createDynamoKey(params.exclusiveStartKey, option) : undefined,
      ScanIndexForward: params.scanIndexForward,
    }).promise().then(({ Items, LastEvaluatedKey }) => {
      const nodes = (Items ?? []).map(item => this._createDynamoNode<TData>(item, option))
      if (LastEvaluatedKey) {
        const lastKey = fromDynamoMap(LastEvaluatedKey)
        return {
          nodes,
          lastEvaluatedKey: {
            pk: lastKey[option.pk.name],
            ...option.sk ? { sk: lastKey[option.sk.name] } : {},
          },
        }
      }
      return {
        nodes,
      }
    })
  }

  getItem<TData extends Record<string, any>>(cursor: DynamoCursor, params: GetItemParams = {}): Promise<DynamoNode<TData> | null> {
    const option = this._findOptionByAliasName(params.aliasName)

    assertIndexableColumnType(option.pk.type ?? String, cursor.pk)
    if (option.sk) {
      assertIndexableColumnType(option.sk.type ?? String, cursor.sk)
    }

    return this.client.getItem({
      TableName: option.tableName,
      Key: this._createDynamoKey(cursor, option),
    }).promise().then(({ Item }) => {
      return Item ? this._createDynamoNode<TData>(Item, option) : null
    })
  }

  getManyItems<TData extends Record<string, any>>(cursors: DynamoCursor[], params: GetItemParams = {}): Promise<DynamoNode<TData>[]> {
    if (cursors.length === 0) {
      return Promise.resolve([])
    }

    const option = this._findOptionByAliasName(params.aliasName)
    for (const cursor of cursors) {
      assertIndexableColumnType(option.pk.type ?? String, cursor.pk)
      if (option.sk) {
        assertIndexableColumnType(option.sk.type ?? String, cursor.sk)
      }
    }

    return this.client.batchGetItem({
      RequestItems: {
        [option.tableName]: {
          Keys: cursors.map((cursor) => this._createDynamoKey(cursor, option)),
        },
      },
    }).promise().then(({ Responses }) => {
      return (Responses?.[option.tableName] ?? []).map(item => this._createDynamoNode<TData>(item, option))
    })
  }

  putItem<TData extends Record<string, any>>(node: DynamoNode<TData>, params: PutItemParams = {}): Promise<DynamoNode<TData> | null> {
    const option = this._findOptionByAliasName(params.aliasName)

    assertIndexableColumnType(option.pk.type ?? String, node.cursor.pk)
    if (option.sk) {
      assertIndexableColumnType(option.sk.type ?? String, node.cursor.sk)
    }

    return this.client.putItem({
      TableName: option.tableName,
      Item: toDynamoMap({
        [option.pk.name]: node.cursor.pk,
        ...option.sk ? { [option.sk.name]: node.cursor.sk } : {},
        ...node.data,
      }),
      // TODO ConditionExpression
      // TODO ReturnValues:
    }).promise().then(({ Attributes }) => {
      return Attributes ? this._createDynamoNode<TData>(Attributes, option) : null
    })
  }

  putManyItems<TData extends Record<string, any>>(nodes: DynamoNode<TData>[] = [], params: PutItemParams = {}): Promise<boolean[]> {
    if (nodes.length === 0) {
      return Promise.resolve([])
    }

    const option = this._findOptionByAliasName(params.aliasName)
    for (const node of nodes) {
      assertIndexableColumnType(option.pk.type ?? String, node.cursor.pk)
      if (option.sk) {
        assertIndexableColumnType(option.sk.type ?? String, node.cursor.sk)
      }
    }

    return this.client.batchWriteItem({
      RequestItems: {
        [option.tableName]: nodes.map(({ cursor, data }): WriteRequest => ({
          PutRequest: {
            Item: toDynamoMap({
              [option.pk.name]: cursor.pk,
              ...option.sk ? { [option.sk.name]: cursor.sk } : {},
              ...data,
            }),
          },
        })),
      },
    }).promise().then<boolean[]>(({ UnprocessedItems }) => {
      const unprocessedItems = (UnprocessedItems?.[option.tableName] ?? [])
        .filter(({ PutRequest }) => PutRequest)
        .map(({ PutRequest }) => fromDynamoMap(PutRequest!.Item))

      const pk = option.pk
      if (option.sk) {
        const optionSk = option.sk
        return nodes.map(({ cursor }) => !unprocessedItems.find((item) => item[pk.name] === cursor.pk && item[optionSk.name] === cursor.sk))
      }
      return nodes.map(({ cursor }) => !unprocessedItems.find((item) => item[pk.name] === cursor.pk))
    })
  }

  public deleteItem<TData extends Record<string, any>>(cursor: DynamoCursor, params: DeleteItemParams = {}): Promise<DynamoNode<TData> | null> {
    const option = this._findOptionByAliasName(params.aliasName)

    assertIndexableColumnType(option.pk.type ?? String, cursor.pk)
    if (option.sk) {
      assertIndexableColumnType(option.sk.type ?? String, cursor.sk)
    }

    return this.client.deleteItem({
      TableName: option.tableName,
      Key: this._createDynamoKey(cursor, option),
      // @TODO ReturnValues
    }).promise().then(({ Attributes }) => {
      return Attributes ? this._createDynamoNode<TData>(Attributes, option) : null
    })
  }

  public deleteManyItems(cursors: DynamoCursor[], params: DeleteItemParams = {}): Promise<boolean[]> {
    if (cursors.length === 0) {
      return Promise.resolve([])
    }

    const option = this._findOptionByAliasName(params.aliasName)
    for (const cursor of cursors) {
      assertIndexableColumnType(option.pk.type ?? String, cursor.pk)
      if (option.sk) {
        assertIndexableColumnType(option.sk.type ?? String, cursor.sk)
      }
    }

    return this.client.batchWriteItem({
      RequestItems: {
        [option.tableName]: cursors.map((cursor): WriteRequest => {
          return {
            DeleteRequest: {
              Key: this._createDynamoKey(cursor, option),
            },
          }
        }),
      },
    }).promise().then(({ UnprocessedItems }) => {
      const unprocessedKeys = (UnprocessedItems?.[option.tableName] ?? [])
        .filter(({ DeleteRequest }) => DeleteRequest)
        .map(({ DeleteRequest }) => fromDynamoMap(DeleteRequest!.Key))

      if (option.sk) {
        const optionSk = option.sk
        return cursors.map((cursor) => !unprocessedKeys.find((item) => item[option.pk.name] === cursor.pk && item[optionSk.name] === cursor.sk))
      }
      return cursors.map((cursor) => !unprocessedKeys.find((item) => item[option.pk.name] === cursor.pk))
    })
  }

  _createDynamoKey(cursor: DynamoCursor, option: ConnectionTableOption): DynamoDB.Key {
    return toDynamoMap({
      [option.pk.name]: cursor.pk,
      ...option.sk ? { [option.sk.name]: cursor.sk } : {},
    })
  }

  _createDynamoNode<TData>(data: DynamoDB.AttributeMap, option: ConnectionTableOption): DynamoNode<TData> {
    const parsed = fromDynamoMap(data)

    const cursor = { pk: parsed[option.pk.name] } as DynamoCursor
    delete parsed[option.pk.name]

    if (option.sk && option.sk.name in parsed) {
      cursor.sk = parsed[option.sk.name]
      delete parsed[option.sk.name]
    }
    return { cursor, data: parsed as TData }
  }

  _findOptionByAliasName(aliasName?: string): ConnectionTableOption {
    return this.tableOptions.get(aliasName ?? 'default') ?? this.tableOptions.entries().next().value
  }
}
