import { Repository } from '../repository/repository'
import { ConstructType } from './common'

export type DynamoKey = string | number | Buffer
export type DynamoKeyTypeOf = StringConstructor | NumberConstructor | typeof Buffer

export type DynamoData = DynamoScalarData | DynamoComplexData
export type DynamoScalarData = string | number | boolean | null | Buffer
export type DynamoComplexData = DynamoScalarData[] | Record<string, DynamoScalarData>


export type RepositoryPair<TEntity extends object> = [ConstructType<TEntity>, ConstructType<Repository<TEntity>>]

export interface DynamoKeyOption {
  name: string
  type?: DynamoKeyTypeOf
}

export interface DynamoIndexOption {
  hashKey: DynamoKeyOption
  rangeKey?: DynamoKeyOption
}

export interface DynamoIndex {
  hashKey: DynamoKey
  rangeKey?: DynamoKey
}

export interface Gsi extends DynamoIndexOption {
  name: string
}

export interface TableOption extends DynamoIndexOption {
  tableName: string
  aliasName?: string
  gsi?: Gsi[]
}

export interface ConnectionOptions {
  tables: TableOption[]
  repositories?: RepositoryPair<any>[]
}

export interface CountParams {
  aliasName?: string
  keyCondition?: string
  filter?: string
  names?: Record<string, any>
  values?: Record<string, DynamoData>
  indexName?: string
}

export interface QueryParams {
  aliasName?: string
  keyCondition?: string
  filter?: string
  names?: Record<string, any>
  values?: Record<string, DynamoData>
  indexName?: string
  limit?: number
  scanIndexForward?: boolean
  exclusiveStartKey?: Record<string, any>
}

export interface QueryResult<TNode> {
  nodes: TNode[]
  lastEvaluatedKey?: Record<string, any>
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
  cursor: DynamoIndex
  index?: DynamoIndex[]
  data: P
}
