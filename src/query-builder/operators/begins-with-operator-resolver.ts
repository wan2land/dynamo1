import { RESERVED_WORDS } from '../../constants/reserved-words'
import { DynamoScalarData, DynamoData } from '../../interfaces/connection'
import { OperatorResolver } from '../../interfaces/query-builder'


export function beginsWith(substr: DynamoScalarData) {
  return new BeginsWithOperatorResolver(substr)
}

export class BeginsWithOperatorResolver implements OperatorResolver {
  constructor(
    public substr: DynamoScalarData,
  ) {
  }

  resolveExpression(key: string, attrName: string): string {
    if (RESERVED_WORDS.includes(key.toUpperCase())) {
      return `begins_with(#${attrName}, :${attrName})`
    }
    return `begins_with(${key}, :${attrName})`
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
      [`:${attrName}`]: this.substr,
    }
  }
}
