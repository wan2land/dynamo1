import { TableColumnIndex } from '../interfaces/repository'


export function column<TEntity = any>(column: keyof TEntity): TableColumnIndex<TEntity> {
  return {
    type: 'column',
    value: column,
  }
}
