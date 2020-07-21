import { MaybePromise } from '../interfaces/common'
import { MetadataStorage } from '../metadata/storage'

export interface ColumnParams<TEntity> {
  name?: string
  onCreate?: (entity: TEntity) => MaybePromise<any>
  onUpdate?: (entity: TEntity) => MaybePromise<any>
  metadataStorage?: MetadataStorage
}

export function Column<TEntity = Record<string, any>>(params: ColumnParams<TEntity> = {}): PropertyDecorator {
  return (target, property) => {
    const metadataColumns = (params.metadataStorage ?? MetadataStorage.getGlobalStorage()).columns
    let columns = metadataColumns.get(target.constructor)

    if (!columns) {
      columns = []
      metadataColumns.set(target.constructor, columns)
    }

    columns.push({
      target: target.constructor,
      property,
      name: params.name ?? (typeof property === 'string' ? property : property.toString()),
      onCreate: params.onCreate,
      onUpdate: params.onUpdate,
    })
  }
}
