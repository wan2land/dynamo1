import { DynamoDB } from 'aws-sdk'
import { WriteRequest } from 'aws-sdk/clients/dynamodb'

import { IndexableColumnType } from '../interfaces/common'
import { DynamoCursor, DynamoNode } from '../interfaces/connection'
import { Repository } from '../repository/repository'
import { fromDynamoMap } from '../utils/from-dynamo'
import { toDynamoMap } from '../utils/to-dynamo'
import { assertIndexableColumnType } from '../utils/type'

export interface ConnectionOptions {
  [aliasName: string]: {
    tableName: string,
    partitionKey: string,
    partitionKeyType?: IndexableColumnType,
    sortKey?: string,
    sortKeyType?: IndexableColumnType,
  }
}

export interface TableOption {
  tableName: string
  partitionKey: string
  partitionKeyType: IndexableColumnType
  sortKey?: string
  sortKeyType?: IndexableColumnType
}

export class Connection {

  public options: Map<string, TableOption>

  public repositories = new Map<Function, Repository<any>>()

  public constructor(
    public client: DynamoDB,
    options: ConnectionOptions,
  ) {
    this.options = new Map()
    for (const [aliasName, option] of Object.entries(options)) {
      this.options.set(aliasName, {
        tableName: option.tableName,
        partitionKey: option.partitionKey,
        partitionKeyType: option.partitionKeyType ?? String,
        sortKey: option.sortKey,
        sortKeyType: option.sortKey && !option.sortKeyType ? String : undefined,
      })
    }
  }

  getItem<TResult extends Record<string, any>>(cursor: DynamoCursor, options: { aliasName?: string } = {}): Promise<DynamoNode<TResult> | null> {
    const option = this._getOptionByAliasName(options.aliasName)

    assertIndexableColumnType(option.partitionKeyType, cursor.pk)
    if (option.sortKeyType) {
      assertIndexableColumnType(option.sortKeyType, cursor.sk)
    }

    return this.client.getItem({
      TableName: option.tableName,
      Key: this._createDynamoKey(cursor, option),
    }).promise().then<DynamoNode<TResult> | null>(({ Item }) => {
      return Item ? this._createDynamoNode(Item, option) : null
    })
  }

  getManyItems<TResult extends Record<string, any>>(cursors: DynamoCursor[], options: { aliasName?: string } = {}): Promise<DynamoNode<TResult>[]> {
    if (cursors.length === 0) {
      return Promise.resolve([])
    }

    const option = this._getOptionByAliasName(options.aliasName)
    for (const cursor of cursors) {
      assertIndexableColumnType(option.partitionKeyType, cursor.pk)
      if (option.sortKeyType) {
        assertIndexableColumnType(option.sortKeyType, cursor.sk)
      }
    }

    return this.client.batchGetItem({
      RequestItems: {
        [option.tableName]: {
          Keys: cursors.map((cursor) => this._createDynamoKey(cursor, option)),
        },
      },
    }).promise().then(({ Responses }) => {
      return (Responses?.[option.tableName] ?? []).map(item => this._createDynamoNode(item, option))
    })
  }

  putItem<TData extends Record<string, any>>(node: DynamoNode<TData>, options: { aliasName?: string } = {}): Promise<DynamoNode<TData> | null> {
    const option = this._getOptionByAliasName(options.aliasName)

    assertIndexableColumnType(option.partitionKeyType, node.cursor.pk)
    if (option.sortKeyType) {
      assertIndexableColumnType(option.sortKeyType, node.cursor.sk)
    }

    return this.client.putItem({
      TableName: option.tableName,
      Item: toDynamoMap({
        [option.partitionKey]: node.cursor.pk,
        ...option.sortKey ? { [option.sortKey]: node.cursor.sk } : {},
        ...node.data,
      }),
      // TODO ConditionExpression
      // TODO ReturnValues:
    }).promise().then<DynamoNode<TData> | null>(({ Attributes }) => {
      return Attributes ? this._createDynamoNode(Attributes, option) : null
    })
  }

  putManyItems<TData extends Record<string, any>>(nodes: DynamoNode<TData>[] = [], options: { aliasName?: string } = {}): Promise<boolean[]> {
    if (nodes.length === 0) {
      return Promise.resolve([])
    }

    const option = this._getOptionByAliasName(options.aliasName)
    for (const node of nodes) {
      assertIndexableColumnType(option.partitionKeyType, node.cursor.pk)
      if (option.sortKeyType) {
        assertIndexableColumnType(option.sortKeyType, node.cursor.sk)
      }
    }

    return this.client.batchWriteItem({
      RequestItems: {
        [option.tableName]: nodes.map(({ cursor, data }): WriteRequest => ({
          PutRequest: {
            Item: toDynamoMap({
              [option.partitionKey]: cursor.pk,
              ...option.sortKey ? { [option.sortKey]: cursor.sk } : {},
              ...data,
            }),
          },
        })),
      },
    }).promise().then<boolean[]>(({ UnprocessedItems }) => {
      const unprocessedItems = (UnprocessedItems?.[option.tableName] ?? [])
        .filter(({ PutRequest }) => PutRequest)
        .map(({ PutRequest }) => fromDynamoMap(PutRequest!.Item))

      const pk = option.partitionKey
      if (option.sortKey) {
        const sk = option.sortKey
        return nodes.map(({ cursor }) => !unprocessedItems.find((item) => item[pk] === cursor.pk && item[sk] === cursor.sk))
      }
      return nodes.map(({ cursor }) => !unprocessedItems.find((item) => item[pk] === cursor.pk))
    })
  }

  public deleteItem<TResult extends Record<string, any>>(cursor: DynamoCursor, options: { aliasName?: string } = {}): Promise<DynamoNode<TResult> | null> {
    const option = this._getOptionByAliasName(options.aliasName)

    assertIndexableColumnType(option.partitionKeyType, cursor.pk)
    if (option.sortKeyType) {
      assertIndexableColumnType(option.sortKeyType, cursor.sk)
    }

    return this.client.deleteItem({
      TableName: option.tableName,
      Key: this._createDynamoKey(cursor, option),
      // ReturnValues // @TODO
    }).promise().then(({ Attributes }) => {
      return Attributes ? this._createDynamoNode(Attributes, option) : null
    })
  }

  public deleteManyItems(cursors: DynamoCursor[], options: { aliasName?: string } = {}): Promise<boolean[]> {
    if (cursors.length === 0) {
      return Promise.resolve([])
    }

    const option = this._getOptionByAliasName(options.aliasName)
    for (const cursor of cursors) {
      assertIndexableColumnType(option.partitionKeyType, cursor.pk)
      if (option.sortKeyType) {
        assertIndexableColumnType(option.sortKeyType, cursor.sk)
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

      const pk = option.partitionKey
      if (option.sortKey) {
        const sk = option.sortKey
        return cursors.map((cursor) => !unprocessedKeys.find((item) => item[pk] === cursor.pk && item[sk] === cursor.sk))
      }
      return cursors.map((cursor) => !unprocessedKeys.find((item) => item[pk] === cursor.pk))
    })
  }

  _createDynamoKey(cursor: DynamoCursor, option: TableOption): DynamoDB.Key {
    return toDynamoMap({
      [option.partitionKey]: cursor.pk,
      ...option.sortKey ? { [option.sortKey]: cursor.sk } : {},
    })
  }

  _createDynamoNode<TResult>(data: DynamoDB.AttributeMap, option: TableOption): DynamoNode<TResult> {
    const parsed = fromDynamoMap(data)

    const cursor = { pk: parsed[option.partitionKey] } as DynamoCursor
    delete parsed[option.partitionKey]

    if (option.sortKey && option.sortKey in parsed) {
      cursor.sk = parsed[option.sortKey]
      delete parsed[option.sortKey]
    }
    return { cursor, data: parsed as TResult }
  }

  _getOptionByAliasName(aliasName?: string): TableOption {
    return this.options.get(aliasName ?? 'default') ?? this.options.entries().next().value
  }
}
