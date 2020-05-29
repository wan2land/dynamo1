import { DynamoKey } from './common'


export interface CountOptions {
  tableName?: string
}

export interface GetItemOptions {
  tableName?: string
}

export interface PutItemOptions {
  tableName?: string
}

export interface DeleteItemOptions {
  tableName?: string
}

export interface DynamoNode<P> {
  cursor: DynamoCursor
  data: P
}

export interface DynamoCursor {
  pk: DynamoKey
  sk?: DynamoKey
}
