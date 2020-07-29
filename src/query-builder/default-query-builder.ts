import { DynamoKey, DynamoIndex, QueryResult } from '../interfaces/connection'
import { KeyCondition, OperandResolver, KeyOperator, QueryBuilderState, QueryBuilder, FilterState } from '../interfaces/query-builder'
import { QueryExecutor } from '../interfaces/query-executor'
import { BaseFilterBuilder } from './base-filter-builder'
import { createComparatorOperandResolver } from './operand/comparator'

function normalizeCondition(key: DynamoKey | [KeyOperator, DynamoKey] | OperandResolver): OperandResolver {
  if (typeof key === 'function') {
    return key
  }
  if (Array.isArray(key)) {
    return createComparatorOperandResolver(key[0], key[1])
  }
  return createComparatorOperandResolver('=', key)
}

export class DefaultQueryBuilder<TNode = any> extends BaseFilterBuilder implements QueryBuilder<TNode> {

  stateRoot: QueryBuilderState = {}

  constructor(
    public executor?: QueryExecutor<TNode>,
  ) {
    super()
  }

  getFilterStates(): FilterState[] {
    return (this.stateRoot.filter = this.stateRoot.filter ?? [])
  }

  key(key: KeyCondition, indexName?: string): this {
    this.stateRoot.key = {
      hashKey: normalizeCondition(key.hashKey),
      ...key.rangeKey ? { rangeKey: normalizeCondition(key.rangeKey) } : {},
      indexName,
    }
    return this
  }

  limit(limit: number | null): this {
    this.stateRoot.limit = limit ?? undefined
    return this
  }

  scanIndexForward(forward: boolean | null): this {
    this.stateRoot.scanIndexForward = forward ?? undefined
    return this
  }

  exclusiveStartKey(key: DynamoIndex | null): this {
    this.stateRoot.exclusiveStartKey = key ?? undefined
    return this
  }

  getOne(): Promise<TNode | null> {
    if (!this.executor) {
      throw new Error('not defined executor')
    }
    return this.executor.execute(this.limit(1).stateRoot).then(({ nodes }) => nodes[0] ?? null)
  }

  getMany(): Promise<QueryResult<TNode>> {
    if (!this.executor) {
      throw new Error('not defined executor')
    }
    return this.executor.execute(this.stateRoot)
  }
}
