import { TableIndex } from '../interfaces/repository'

export function resolveIndex<TEntity>(entity: TEntity, indexes: TableIndex<TEntity>[], separator: string): string {
  return indexes.map(index => {
    switch (index.type) {
      case 'text': {
        return index.value
      }
      case 'column': {
        return entity[index.value]
      }
    }
    return '' // fallback
  }).join(separator)
}
