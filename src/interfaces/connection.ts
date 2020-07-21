import { DynamoKey, DynamoKeyType } from './common'

export interface ConnectionOptions {
  tables: ConnectionTableOption[]
}

export interface IndexType {
  name: string
  type?: DynamoKeyType
}

export interface ConnectionTableIndex {
  name: string
  pk: IndexType
  sk?: IndexType
}

export interface ConnectionTableOption {
  tableName: string
  aliasName?: string
  pk: IndexType
  sk?: IndexType
  gsi?: ConnectionTableIndex[]
  // repositories: [Function, Function][]
}

export interface QueryParams {
  aliasName?: string
  limit?: number
  indexName?: string
  exclusiveStartKey?: DynamoCursor
  scanIndexForward?: boolean
}

export interface QueryResult<TNode> {
  nodes: TNode[]
  lastEvaluatedKey?: DynamoCursor
}

export interface CountParams {
  aliasName?: string
}

export interface GetItemParams {
  aliasName?: string
}

export interface PutItemParams {
  aliasName?: string
}

export interface DeleteItemParams {
  aliasName?: string
}

export interface DynamoNode<P> {
  cursor: DynamoCursor
  data: P
}

export interface DynamoCursor {
  pk: DynamoKey
  sk?: DynamoKey
}
