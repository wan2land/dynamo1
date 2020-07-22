import { Connection } from '../connection/connection'
import { resolveIndex } from '../indexer/resolve-index'
import { MaybeArray } from '../interfaces/common'
import { QueryResult } from '../interfaces/connection'
import { RepositoryOptions } from '../interfaces/repository'

export class Repository<TEntity extends object> {

  persistEntities = new WeakSet<TEntity>()

  constructor(
    public connection: Connection,
    public options: RepositoryOptions<TEntity>,
  ) {
  }

  create(): TEntity
  create(entityLike: Partial<TEntity>): TEntity
  create(entityLike: Partial<TEntity> = {}): TEntity {
    const entity = {} as any
    Object.setPrototypeOf(entity, this.options.target.prototype)
    for (const column of this.options.columns) {
      entity[column.property] = (entityLike as any)[column.property] ?? null
    }
    return entity
  }

  assign(entity: TEntity, ...entityLikes: Partial<TEntity>[]): TEntity {
    Object.assign(entity, ...entityLikes)
    return entity
  }

  persist(entity: TEntity): Promise<TEntity>
  persist(entities: TEntity[]): Promise<TEntity[]>
  persist(entity: MaybeArray<TEntity>): Promise<MaybeArray<TEntity>> {
    if (!Array.isArray(entity)) {
      return this.persist([entity]).then(entities => entities[0])
    }

    const entities = entity
    return Promise.all(entities.map(async (entity) => {
      if (this.persistEntities.has(entity)) {
        return Promise.all(this.options.columns.map(column => {
          return column.onUpdate ? Promise.resolve(column.onUpdate(entity)).then((value) => { (entity as any)[column.property] = value }) : Promise.resolve()
        }))
      }
      return Promise.all(this.options.columns.map(column => {
        return column.onCreate ? Promise.resolve(column.onCreate(entity)).then((value) => { (entity as any)[column.property] = value }) : Promise.resolve()
      }))
    })).then(() => {
      return entities.map(entity => {
        const data = {} as any
        for (const column of this.options.columns) {
          data[column.name] = (entity as any)[column.property]
        }
        return {
          cursor: {
            pk: resolveIndex(entity, this.options.pk, this.options.separator),
            sk: resolveIndex(entity, this.options.sk, this.options.separator),
          },
          data,
        }
      })
    }).then(nodes => {
      return this.connection.putManyItems(nodes, {
        aliasName: this.options.aliasName,
      })
    }).then(() => {
      entity.forEach(entity => this.persistEntities.add(entity)) // persist
      return Promise.resolve(entity)
    })
  }

  remove(entities: TEntity[]): Promise<TEntity[]>
  remove(entity: TEntity): Promise<TEntity>
  async remove(entity: MaybeArray<TEntity>): Promise<MaybeArray<TEntity>> {
    if (!Array.isArray(entity)) {
      return this.remove([entity]).then(entities => entities[0])
    }
    const entities = entity
    return this.connection.deleteManyItems(entities.map(entity => ({
      pk: resolveIndex(entity, this.options.pk, this.options.separator),
      sk: resolveIndex(entity, this.options.sk, this.options.separator),
    })), { aliasName: this.options.aliasName }).then((results) => {
      results.forEach((result, resultIndex) => {
        if (result) {
          this.persistEntities.delete(entities[resultIndex])
        }
      })
      return Promise.resolve(entities)
    })
  }

  findOne(conditions: Partial<TEntity> = {}): Promise<TEntity | null> {
    const requiredColumns = [
      ...this.options.pk.filter(index => index.type === 'column').map(({ value }) => value),
      ...this.options.sk.filter(index => index.type === 'column').map(({ value }) => value),
    ]
    for (const requiredColumn of requiredColumns) {
      if (!(requiredColumn in conditions)) {
        throw new Error(`Column '${typeof requiredColumn === 'symbol' ? requiredColumn.toString() : requiredColumn}' is required.`)
      }
    }
    return this.connection.getItem({
      pk: resolveIndex(conditions, this.options.pk, this.options.separator),
      sk: resolveIndex(conditions, this.options.sk, this.options.separator),
    }, { aliasName: this.options.aliasName }).then((node) => {
      if (!node) {
        return node ?? null
      }
      const entity = {} as any
      Object.setPrototypeOf(entity, this.options.target.prototype)
      for (const column of this.options.columns) {
        entity[column.property] = (node.data as any)[column.name] ?? null
      }

      this.persistEntities.add(entity)
      return entity as TEntity
    })
  }

  findMany(conditions: Partial<TEntity> = {}): Promise<QueryResult<TEntity>> {
    const requiredColumns = [
      ...this.options.pk.filter(index => index.type === 'column').map(({ value }) => value),
    ]
    for (const requiredColumn of requiredColumns) {
      if (!(requiredColumn in conditions)) {
        throw new Error(`Column '${typeof requiredColumn === 'symbol' ? requiredColumn.toString() : requiredColumn}' is required.`)
      }
    }
    return this.connection.query(
      resolveIndex(conditions, this.options.pk, this.options.separator),
      { aliasName: this.options.aliasName },
    ).then(({ nodes, lastEvaluatedKey }) => {
      return {
        nodes: nodes.map((node) => {
          const entity = {} as any
          Object.setPrototypeOf(entity, this.options.target.prototype)
          for (const column of this.options.columns) {
            entity[column.property] = (node.data as any)[column.name] ?? null
          }
          this.persistEntities.add(entity)
          return entity as TEntity
        }),
        lastEvaluatedKey,
      }
    })
  }
}
