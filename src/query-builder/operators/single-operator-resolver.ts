import { RESERVED_WORDS } from '../../constants/reserved-words'
import { DynamoData, DynamoKey } from '../../interfaces/connection'
import { OperatorResolver, KeyOperator } from '../../interfaces/query-builder'


export class SingleOperatorResolver implements OperatorResolver {
  constructor(
    public operator: KeyOperator,
    public value: DynamoKey,
  ) {
  }

  resolveExpression(key: string, attrName: string): string {
    if (RESERVED_WORDS.includes(key.toUpperCase())) {
      return `#${attrName} ${this.operator} :${attrName}`
    }
    return `${key} ${this.operator} :${attrName}`
  }

  resolveAttrNames(key: string, attrName: string): Record<string, string> {
    if (RESERVED_WORDS.includes(key.toUpperCase())) {
      return {
        [`#${attrName}`]: key,
      }
    }
    return {}
  }

  resolveAttrValues(key: string, attrName: string): Record<string, DynamoData> {
    return {
      [`:${attrName}`]: this.value,
    }
  }
}
