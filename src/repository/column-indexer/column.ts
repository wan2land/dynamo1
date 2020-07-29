import { ColumnIndexer } from '../../interfaces/metadata'


export function column<TEntity = any>(column: keyof TEntity): ColumnIndexer<TEntity> {
  return {
    columns: [column],
    index(node) {
      const value = node[column]
      return typeof value === 'string' ? value : JSON.stringify(value)
    },
  }
}
