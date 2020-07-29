import { ColumnIndexer } from '../../interfaces/metadata'


export function text<TEntity = any>(text: string): ColumnIndexer<TEntity> {
  return {
    columns: [],
    index() {
      return text
    },
  }
}
