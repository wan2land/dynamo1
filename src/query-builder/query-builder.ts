import { DynamoKey, DynamoCursor } from '../interfaces/connection'
import { KeyCondition, KeyConditionState, OperatorResolver, KeyOperator, FilterCondition } from '../interfaces/query-builder'
import { SingleOperatorResolver } from './operators/single-operator-resolver'

function normalizeKeyCondition(key: DynamoKey | [KeyOperator, DynamoKey] | OperatorResolver): OperatorResolver {
  if (Array.isArray(key)) {
    return new SingleOperatorResolver(key[0], key[1])
  }
  if (typeof key === 'object' && !(key instanceof Buffer)) {
    return key
  }
  return new SingleOperatorResolver('=', key)
}

export class QueryBuilder {

  keyState?: KeyConditionState
  filterState?: OperatorResolver[]
  limitState?: number
  scanIndexForwardState?: boolean
  exclusiveStartKeyState?: DynamoCursor

  key(key: KeyCondition, indexName?: string): this {
    this.keyState = {
      pk: normalizeKeyCondition(key.pk),
      ...key.sk ? { sk: normalizeKeyCondition(key.sk) } : {},
      indexName,
    }
    return this
  }

  limit(limit: number | null): this {
    this.limitState = limit ?? undefined
    return this
  }

  scanIndexForward(forward: boolean | null): this {
    this.scanIndexForwardState = forward ?? undefined
    return this
  }

  exclusiveStartKey(key: DynamoCursor | null): this {
    this.exclusiveStartKeyState = key ?? undefined
    return this
  }
}
