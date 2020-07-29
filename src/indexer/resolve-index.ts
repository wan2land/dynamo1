import { ColumnIndexer } from '../interfaces/metadata'

export function resolveIndex<TEntity>(entity: TEntity, indexers: ColumnIndexer<TEntity>[], separator: string): string {
  return indexers.map(indexer => indexer.index(entity)).join(separator)
}
