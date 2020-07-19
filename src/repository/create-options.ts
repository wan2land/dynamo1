import { ConstructType } from '../interfaces/common'
import { RepositoryOptions } from '../interfaces/repository'
import { MetadataStorage } from '../metadata/storage'


export function createOptions<Entity>(ctor: ConstructType<Entity>, meatadataStorage?: MetadataStorage): RepositoryOptions<Entity> {
  meatadataStorage = meatadataStorage ?? MetadataStorage.getGlobalStorage()
  const entity = meatadataStorage.entities.get(ctor)
  if (!entity) {
    throw new Error('not defined entity')
  }

  return {
    ...entity,
    columns: meatadataStorage.columns.get(ctor) ?? [],
  }
}
