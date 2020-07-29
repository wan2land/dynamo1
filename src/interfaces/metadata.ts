import { MaybePromise } from './common'

export interface TableIndexResolver {
  hashKey: ColumnIndexer<any>[]
  rangeKey?: ColumnIndexer<any>[]
}

export interface ColumnIndexer<TEntity> {
  columns: (keyof TEntity)[]
  index(entity: TEntity): string
}

export interface MetadataEntity extends TableIndexResolver {
  target: Function
  name: string
  aliasName: string
  separator: string
  gsi: TableIndexResolver[]
}

export interface MetadataColumn {
  target: Function
  property: string | symbol
  name: string
  onCreate?: (entity: any) => MaybePromise<any>
  onUpdate?: (entity: any) => MaybePromise<any>
}
