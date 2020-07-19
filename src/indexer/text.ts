import { TableTextIndex } from '../interfaces/repository'


export function text<TEntity = any>(text: string): TableTextIndex<TEntity> {
  return {
    type: 'text',
    value: text,
  }
}
