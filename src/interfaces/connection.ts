import { Repository } from '../repository/repository'
import { DynamoKey, DynamoKeyType, ConstructType } from './common'

export type RepositoryPair<TEntity extends object> = [ConstructType<TEntity>, ConstructType<Repository<TEntity>>]

export interface ConnectionOptions {
  tables: ConnectionTableOption[]
  repositories?: RepositoryPair<any>[]
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
