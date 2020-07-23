import { DynamoKey, DynamoData } from './connection'

export type KeyOperator = '=' | '<' | '<=' | '>' | '>='


export interface KeyCondition {
  pk: DynamoKey | [KeyOperator, DynamoKey] | OperatorResolver
  sk?: DynamoKey | [KeyOperator, DynamoKey] | OperatorResolver
}

export interface KeyConditionState {
  pk: OperatorResolver
  sk?: OperatorResolver
  indexName?: string
}

export interface OperatorResolver {
  resolveExpression(key: string, attrName: string): string
  resolveAttrNames(key: string, attrName: string): Record<string, string>
  resolveAttrValues(key: string, attrName: string): Record<string, DynamoData>
}
