// @refs https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.OperatorsAndFunctions.html

import { DynamoKey, DynamoData, DynamoIndex, QueryResult } from './connection'

export type KeyOperator = '=' | '<' | '<=' | '>' | '>='
export type Comparator = '=' | '<>' | '<' | '<=' | '>' | '>='

export interface KeyCondition {
  hashKey: DynamoKey | [KeyOperator, DynamoKey] | OperandResolver
  rangeKey?: DynamoKey | [KeyOperator, DynamoKey] | OperandResolver
}

export interface KeyState {
  hashKey: OperandResolver
  rangeKey?: OperandResolver
  indexName?: string
}

export interface FilterState {
  logic: 'and' | 'or'
  condition: FilterCondition
}

export type FilterCondition = FilterSingleCondition | FilterNotCondition | FilterBraceCondition

export interface FilterSingleCondition {
  name: string
  resolver: OperandResolver
}

export interface FilterNotCondition {
  not: FilterCondition
}

export interface FilterBraceCondition {
  brace: FilterState[]
}

export type OperandResolver = (propName: string, aliasName: string) => Expression

export interface Expression {
  expression: string
  names: Record<string, any>
  values: Record<string, DynamoData>
}

export interface QueryBuilderState {
  key?: KeyState
  filter?: FilterState[]
  limit?: number
  scanIndexForward?: boolean
  exclusiveStartKey?: DynamoIndex
}

export interface FilterBuilder {
  filter(handler: (builder: FilterBuilder) => any): this
  filter(name: string, value: DynamoData): this
  filter(name: string, operand: OperandResolver): this
  filter(name: string, comparator: Comparator, value: DynamoData): this

  filterNot(handler: (builder: FilterBuilder) => any): this
  filterNot(name: string, value: DynamoData): this
  filterNot(name: string, operand: OperandResolver): this
  filterNot(name: string, comparator: Comparator, value: DynamoData): this

  orFilter(handler: (builder: FilterBuilder) => any): this
  orFilter(name: string, value: DynamoData): this
  orFilter(name: string, operand: OperandResolver): this
  orFilter(name: string, comparator: Comparator, value: DynamoData): this

  orFilterNot(handler: (builder: FilterBuilder) => any): this
  orFilterNot(name: string, value: DynamoData): this
  orFilterNot(name: string, operand: OperandResolver): this
  orFilterNot(name: string, comparator: Comparator, value: DynamoData): this

  andFilter(handler: (builder: FilterBuilder) => any): this
  andFilter(name: string, value: DynamoData): this
  andFilter(name: string, operand: OperandResolver): this
  andFilter(name: string, comparator: Comparator, value: DynamoData): this

  andFilterNot(handler: (builder: FilterBuilder) => any): this
  andFilterNot(name: string, value: DynamoData): this
  andFilterNot(name: string, operand: OperandResolver): this
  andFilterNot(name: string, comparator: Comparator, value: DynamoData): this
}

export interface QueryBuilder<TNode> extends FilterBuilder {

  key(key: KeyCondition, indexName?: string): this
  limit(limit: number | null): this
  scanIndexForward(forward: boolean | null): this
  exclusiveStartKey(key: DynamoIndex | null): this

  getOne(): Promise<TNode | null>
  getMany(): Promise<QueryResult<TNode>>
}
