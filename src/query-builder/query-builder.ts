import { DynamoKey, DynamoCursor } from '../interfaces/connection'
import { KeyCondition, KeyState, OperandResolver, KeyOperator } from '../interfaces/query-builder'
import { applyMixins } from '../utils/typescript'
import { FilterBuilder } from './filter-builder'
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

export class QueryBuilder {

  keyState?: KeyState
  limitState?: number
  scanIndexForwardState?: boolean
  exclusiveStartKeyState?: DynamoCursor

  key(key: KeyCondition, indexName?: string): this {
    this.keyState = {
      pk: normalizeCondition(key.pk),
      ...key.sk ? { sk: normalizeCondition(key.sk) } : {},
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

export interface QueryBuilder extends FilterBuilder {
  keyState?: KeyState
  limitState?: number
  scanIndexForwardState?: boolean
  exclusiveStartKeyState?: DynamoCursor

  key(key: KeyCondition, indexName?: string): this
  limit(limit: number | null): this
  scanIndexForward(forward: boolean | null): this
  exclusiveStartKey(key: DynamoCursor | null): this
}

applyMixins(QueryBuilder, [FilterBuilder])
