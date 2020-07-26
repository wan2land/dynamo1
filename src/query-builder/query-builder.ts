import { DynamoKey, DynamoCursor, DynamoData } from '../interfaces/connection'
import { KeyCondition, KeyState, OperandResolver, KeyOperator, FilterState, Comparator } from '../interfaces/query-builder'
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
  filterStates?: FilterState[]
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

  filter(name: string, value: DynamoData): this
  filter(name: string, operand: OperandResolver): this
  filter(name: string, comparator: Comparator, value: DynamoData): this
  filter(name: string, valueOrOperand: DynamoData | Comparator | OperandResolver, value?: DynamoData): this {
    return this.addFilter('and', name, valueOrOperand as any, value as any)
  }

  orFilter(name: string, value: DynamoData): this
  orFilter(name: string, operand: OperandResolver): this
  orFilter(name: string, comparator: Comparator, value: DynamoData): this
  orFilter(name: string, valueOrOperand: DynamoData | Comparator | OperandResolver, value?: DynamoData): this {
    return this.addFilter('or', name, valueOrOperand as any, value as any)
  }

  andFilter(name: string, value: DynamoData): this
  andFilter(name: string, operand: OperandResolver): this
  andFilter(name: string, comparator: Comparator, value: DynamoData): this
  andFilter(name: string, valueOrOperand: DynamoData | Comparator | OperandResolver, value?: DynamoData): this {
    return this.addFilter('and', name, valueOrOperand as any, value as any)
  }

  addFilter(logic: 'and' | 'or', name: string, value: DynamoData): this
  addFilter(logic: 'and' | 'or', name: string, operand: OperandResolver): this
  addFilter(logic: 'and' | 'or', name: string, comparator: Comparator, value: DynamoData): this
  addFilter(logic: 'and' | 'or', name: string, valueOrOperand: DynamoData | Comparator | OperandResolver, value?: DynamoData): this {
    this.filterStates = this.filterStates ?? []
    this.filterStates.push({
      logic,
      condition: {
        name,
        resolver: value
          ? createComparatorOperandResolver(valueOrOperand as Comparator, value)
          : typeof valueOrOperand === 'function'
            ? valueOrOperand
            : createComparatorOperandResolver('=', valueOrOperand),
      },
    })
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
