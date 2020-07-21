import { MetadataEntity, MetadataColumn } from './metadata'


export type TableIndex<TEntity> = TableColumnIndex<TEntity> | TableTextIndex<TEntity>

export interface TableColumnIndex<TEntity> {
  type: 'column'
  value: keyof TEntity
}

export interface TableTextIndex<TEntity> {
  type: 'text'
  value: string
}

export interface RepositoryOptions<TEntity> extends MetadataEntity {
  columns: MetadataColumn[]
}
