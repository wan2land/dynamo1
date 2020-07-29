import { Connection } from '../connection/connection'
import { resolveIndex } from '../indexer/resolve-index'
import { MaybeArray } from '../interfaces/common'
import { QueryResult, DynamoNode } from '../interfaces/connection'
import { TableIndexResolver } from '../interfaces/metadata'
import { QueryBuilder, KeyCondition } from '../interfaces/query-builder'
import { RepositoryOptions } from '../interfaces/repository'
import { Compiler } from '../query-builder/compiler'
import { DefaultQueryBuilder } from '../query-builder/default-query-builder'
import { EntityQueryExecutor } from '../query-executor/entity-query-executor'

export class Repository<TEntity extends object> {

  persistEntities = new WeakSet<TEntity>()
  executor: EntityQueryExecutor<TEntity>

  constructor(
    public connection: Connection,
    public compiler: Compiler,
    public options: RepositoryOptions<TEntity>,
  ) {
    this.executor = new EntityQueryExecutor(compiler, this.connection, this.persistEntities, this.options)
  }

  createQueryBuilder(): QueryBuilder<TEntity> {
    return new DefaultQueryBuilder<TEntity>(this.executor)
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
      return entities.map<DynamoNode<any>>(entity => {
        const data = {} as any
        for (const column of this.options.columns) {
          data[column.name] = (entity as any)[column.property]
        }
        return {
          cursor: {
            hashKey: resolveIndex(entity, this.options.hashKey, this.options.separator),
            ...this.options.rangeKey ? { rangeKey: resolveIndex(entity, this.options.rangeKey, this.options.separator) } : {},
          },
          index: this.options.gsi.map((gsi) => {
            return {
              hashKey: resolveIndex(entity, gsi.hashKey, this.options.separator),
              ...gsi.rangeKey ? { rangeKey: resolveIndex(entity, gsi.rangeKey, this.options.separator) } : {},
            }
          }),
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
      hashKey: resolveIndex(entity, this.options.hashKey, this.options.separator),
      ...this.options.rangeKey ? { rangeKey: resolveIndex(entity, this.options.rangeKey, this.options.separator) } : {},
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
    return this._applyKeyCondition(this.createQueryBuilder(), conditions).limit(1).getOne()
  }

  findMany(conditions: Partial<TEntity> = {}): Promise<QueryResult<TEntity>> {
    return this._applyKeyCondition(this.createQueryBuilder(), conditions).getMany()
  }

  _applyKeyCondition(qb: QueryBuilder<TEntity>, conditions: Partial<TEntity>) {
    const conditionKeys = Object.keys(conditions) as PropertyKey[]
    const [indexer, indexName] = this._getFindableIndex(conditionKeys)
    const condition: KeyCondition = {
      hashKey: resolveIndex(conditions, indexer.hashKey, this.options.separator),
    }

    if (indexer.rangeKey) {
      let isUsingRangeKey = true
      for (const propKey of indexer.rangeKey.flatMap(({ columns }) => columns)) {
        if (!conditionKeys.includes(propKey)) {
          isUsingRangeKey = false
          break
        }
      }

      if (isUsingRangeKey) {
        condition.rangeKey = resolveIndex(conditions, indexer.rangeKey, this.options.separator)
      }
    }

    return indexName ? qb.key(condition, indexName) : qb.key(condition)
  }

  _getFindableIndex(propKeys: PropertyKey[]): [TableIndexResolver, string | null] {
    const tableRequiredPropKeys = this.options.hashKey.flatMap(({ columns }) => columns)
    try {
      for (const requiredPropKey of tableRequiredPropKeys) {
        if (!propKeys.includes(requiredPropKey)) {
          throw new Error(`Column '${typeof requiredPropKey === 'symbol' ? requiredPropKey.toString() : requiredPropKey}' is required.`)
        }
      }
      return [this.options, null]
    } catch (e) {
      let foundIndex = -1
      this.options.gsi.map(gsi => gsi.hashKey.flatMap(({ columns }) => columns)).forEach((gsiRequiredPropKeys, gsiIndex) => {
        if (foundIndex > -1) {
          return
        }
        for (const requiredPropKey of gsiRequiredPropKeys) {
          if (!propKeys.includes(requiredPropKey)) {
            return
          }
        }
        foundIndex = gsiIndex
      })
      if (this.options.gsi[foundIndex] && (this.compiler.options.gsi ?? [])[foundIndex]) {
        return [
          this.options.gsi[foundIndex],
          (this.compiler.options.gsi ?? [])[foundIndex].name,
        ]
      }
      throw e
    }
  }
}
