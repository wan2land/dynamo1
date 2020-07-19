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
  pk: DynamoKey
  tableName?: string
  limit?: number
  // offset?: number
  // after?: DynamoCursor
  scanIndexForward?: boolean
}

export interface CountOptions {
  aliasName?: string
}

export interface GetItemOptions {
  aliasName?: string
}

export interface PutItemOptions {
  aliasName?: string
}

export interface DeleteItemOptions {
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
