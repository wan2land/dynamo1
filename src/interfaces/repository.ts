import { MetadataEntity, MetadataColumn } from './metadata'

export interface RepositoryOptions<TEntity> extends MetadataEntity {
  columns: MetadataColumn[]
}
