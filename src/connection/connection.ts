import { DynamoDB } from 'aws-sdk'
import { WriteRequest } from 'aws-sdk/clients/dynamodb'

import { ConstructType } from '../interfaces/common'
import {
  DynamoKey,
  CountParams,
  DeleteItemParams,
  DynamoCursor,
  DynamoNode,
  GetItemParams,
  PutItemParams,
  ConnectionOptions,
  TableOption,
  QueryParams,
  QueryResult,
  DynamoIndex,
} from '../interfaces/connection'
import { Compiler } from '../query-builder/compiler'
import { createOptions } from '../repository/create-options'
import { Repository } from '../repository/repository'
import { isNotEmptyObject } from '../utils/object'
import { assertDynamoIndex } from './assert'
import { fromDynamoMap, toDynamo, attrsToDynamoNode, dynamoNodeToAttrs, dynamoCursorToKey, toDynamoMap } from './transformer'

export class Connection {

  tableOptions = new Map<string, TableOption>()
  compilers = new Map<TableOption, Compiler>()
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
        this.compilers.set(tableOption, new Compiler(tableOption))
      }
      this.tableOptions.set(tableOption.tableName, tableOption)
      this.compilers.set(tableOption, new Compiler(tableOption))
    }
    for (const [entity, repo] of options.repositories ?? []) {
      this.definedRepos.set(entity, repo)
    }
  }

  getRepository<TEntity extends object, R extends Repository<TEntity>>(entityCtor: ConstructType<TEntity>): R {
    let repository = this.cachedRepos.get(entityCtor)
    if (!repository) {
      const RepoCtor = this.definedRepos.get(entityCtor) ?? Repository
      const repoOptions = createOptions(entityCtor)
      const tableOption = this._findOption(repoOptions)
      repository = new RepoCtor(this, this.compilers.get(tableOption), repoOptions)
      this.cachedRepos.set(entityCtor, repository)
    }
    return repository as R
  }

  count(params: CountParams = {}): Promise<number> {
    const option = this._findOption(params)
    return this.client.query({
      TableName: option.tableName,
      Select: 'COUNT',
      IndexName: params.indexName,
      KeyConditionExpression: params.keyCondition,
      FilterExpression: params.filter,
      ExpressionAttributeNames: isNotEmptyObject(params.names) ? params.names : undefined,
      ExpressionAttributeValues: isNotEmptyObject(params.values) ? toDynamoMap(params.values) : undefined,
    }).promise().then(({ Count }) => Count ?? 0)
  }

  query<TData extends Record<string, any>>(params: QueryParams = {}): Promise<QueryResult<DynamoNode<TData>>> {
    const option = this._findOption(params)
    return this.client.query({
      TableName: option.tableName,
      IndexName: params.indexName,
      KeyConditionExpression: params.keyCondition,
      FilterExpression: params.filter,
      ExpressionAttributeNames: isNotEmptyObject(params.names) ? params.names : undefined,
      ExpressionAttributeValues: isNotEmptyObject(params.values) ? toDynamoMap(params.values) : undefined,
      ExclusiveStartKey: isNotEmptyObject(params.exclusiveStartKey) ? toDynamoMap(params.exclusiveStartKey) : undefined,
      ScanIndexForward: params.scanIndexForward,
      Limit: params.limit,
    }).promise().then(({ Items, LastEvaluatedKey }) => {
      const nodes = (Items ?? []).map(item => attrsToDynamoNode<TData>(item, option))
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
    const option = this._findOption(params)
    assertDynamoIndex(option, cursor)

    return this.client.getItem({
      TableName: option.tableName,
      Key: dynamoCursorToKey(cursor, option),
    }).promise().then(({ Item }) => {
      return Item ? attrsToDynamoNode<TData>(Item, option) : null
    })
  }

  getManyItems<TData extends Record<string, any>>(cursors: DynamoCursor[], params: GetItemParams = {}): Promise<DynamoNode<TData>[]> {
    if (cursors.length === 0) {
      return Promise.resolve([])
    }

    const option = this._findOption(params)
    for (const cursor of cursors) {
      assertDynamoIndex(option, cursor)
    }

    return this.client.batchGetItem({
      RequestItems: {
        [option.tableName]: {
          Keys: cursors.map((cursor) => dynamoCursorToKey(cursor, option)),
        },
      },
    }).promise().then(({ Responses }) => {
      return (Responses?.[option.tableName] ?? []).map(item => attrsToDynamoNode<TData>(item, option))
    })
  }

  putItem<TData extends Record<string, any>>(node: DynamoNode<TData>, params: PutItemParams = {}): Promise<DynamoNode<TData> | null> {
    const option = this._findOption(params)
    assertDynamoIndex(option, node.cursor)

    return this.client.putItem({
      TableName: option.tableName,
      Item: dynamoNodeToAttrs(node, option),
    }).promise().then(({ Attributes }) => {
      return Attributes ? attrsToDynamoNode<TData>(Attributes, option) : null
    })
  }

  putManyItems<TData extends Record<string, any>>(nodes: DynamoNode<TData>[] = [], params: PutItemParams = {}): Promise<boolean[]> {
    if (nodes.length === 0) {
      return Promise.resolve([])
    }

    const option = this._findOption(params)
    for (const node of nodes) {
      assertDynamoIndex(option, node.cursor)
    }

    return this.client.batchWriteItem({
      RequestItems: {
        [option.tableName]: nodes.map<WriteRequest>(node => ({
          PutRequest: {
            Item: dynamoNodeToAttrs(node, option),
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
    const option = this._findOption(params)
    assertDynamoIndex(option, cursor)

    return this.client.deleteItem({
      TableName: option.tableName,
      Key: dynamoCursorToKey(cursor, option),
    }).promise().then(({ Attributes }) => {
      return Attributes ? attrsToDynamoNode<TData>(Attributes, option) : null
    })
  }

  public deleteManyItems(cursors: DynamoCursor[], params: DeleteItemParams = {}): Promise<boolean[]> {
    if (cursors.length === 0) {
      return Promise.resolve([])
    }

    const option = this._findOption(params)
    for (const cursor of cursors) {
      assertDynamoIndex(option, cursor)
    }

    return this.client.batchWriteItem({
      RequestItems: {
        [option.tableName]: cursors.map((cursor): WriteRequest => {
          return {
            DeleteRequest: {
              Key: dynamoCursorToKey(cursor, option),
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

  _findOption(params: { aliasName?: string }): TableOption {
    return this.tableOptions.get(params.aliasName ?? 'default') ?? [...this.tableOptions.entries()][0][1]
  }

  _findOptionAndIndex(params: { aliasName?: string, indexName?: string }): [TableOption, DynamoIndex] {
    const option = this._findOption(params)
    if (!params.indexName) {
      return [option, option]
    }
    const gsi = (option.gsi ?? []).find(({ name }) => name === params.indexName)
    if (gsi) {
      return [option, gsi]
    }
    throw new Error(`Unknown GSI name(${params.indexName}).`)
  }
}
