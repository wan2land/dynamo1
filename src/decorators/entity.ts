import { MetadataStorage } from '../metadata/storage'
import { TableIndex } from '../interfaces/repository'
import { MaybeArray } from '../interfaces/common'
import { strictArray } from '../utils/array'

export interface EntityParams<TEntity> {
  name?: string
  aliasName?: string
  separator?: string
  pk: MaybeArray<TableIndex<TEntity>>
  sk: MaybeArray<TableIndex<TEntity>>
  gsi?: MaybeArray<{
    pk: MaybeArray<TableIndex<TEntity>>,
    sk: MaybeArray<TableIndex<TEntity>>,
  }>
  metadataStorage?: MetadataStorage
}

export function Entity<TEntity = any>(params: EntityParams<TEntity>): ClassDecorator {
  return (target) => {
    const metadataEntities = (params.metadataStorage ?? MetadataStorage.getGlobalStorage()).entities

    if (metadataEntities.get(target)) {
      throw new Error('entity decoartor must be one')
    }

    metadataEntities.set(target, {
      target,
      name: params.name ?? target.name,
      aliasName: params.aliasName ?? 'default',
      separator: params.separator ?? '#',
      pk: strictArray(params.pk),
      sk: strictArray(params.sk),
      gsi: strictArray(params.gsi ?? []).map(index => ({
        pk: strictArray(index.pk),
        sk: strictArray(index.sk),
      })),
    })
  }
}
