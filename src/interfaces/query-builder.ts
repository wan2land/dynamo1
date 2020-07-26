// @refs https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.OperatorsAndFunctions.html

import { DynamoKey, DynamoData } from './connection'

export type KeyOperator = '=' | '<' | '<=' | '>' | '>='
export type Comparator = '=' | '<>' | '<' | '<=' | '>' | '>='

export interface KeyCondition {
  pk: DynamoKey | [KeyOperator, DynamoKey] | OperandResolver
  sk?: DynamoKey | [KeyOperator, DynamoKey] | OperandResolver
}

export interface KeyState {
  pk: OperandResolver
  sk?: OperandResolver
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

export type OperandResolver = (propName: string, aliasName: string) => RawState

export interface RawState {
  expression: string
  names: Record<string, any>
  values: Record<string, DynamoData>
}
