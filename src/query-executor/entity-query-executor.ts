import { Connection } from '../connection/connection'
import { QueryResult } from '../interfaces/connection'
import { QueryBuilderState } from '../interfaces/query-builder'
import { QueryExecutor } from '../interfaces/query-executor'
import { RepositoryOptions } from '../interfaces/repository'
import { Compiler } from '../query-builder/compiler'

export class EntityQueryExecutor<TEntity extends object> implements QueryExecutor<TEntity> {

  constructor(
    public compiler: Compiler,
    public connection: Connection,
    public persistEntities: WeakSet<TEntity>,
    public options: RepositoryOptions<TEntity>,
  ) {
  }

  hydrate(data: Record<string, any>): TEntity {
    const entity = {} as any
    Object.setPrototypeOf(entity, this.options.target.prototype)
    for (const column of this.options.columns) {
      entity[column.property] = data[column.name] ?? null
    }
    this.persistEntities.add(entity)
    return entity as TEntity
  }

  execute(state: QueryBuilderState): Promise<QueryResult<TEntity>> {
    return this.connection.query(this.compiler.compile(state)).then(({ nodes, lastEvaluatedKey }) => {
      return {
        nodes: nodes.map((node) => this.hydrate(node.data)),
        lastEvaluatedKey,
      }
    })
  }
}
