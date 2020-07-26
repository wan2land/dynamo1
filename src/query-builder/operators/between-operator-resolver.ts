import { RESERVED_WORDS } from '../../constants/reserved-words'
import { DynamoScalarData, DynamoData } from '../../interfaces/connection'
import { OperatorResolver } from '../../interfaces/query-builder'


export function between(from: DynamoScalarData, to: DynamoScalarData) {
  return new BetweenOperatorResolver(from, to)
}

export class BetweenOperatorResolver implements OperatorResolver {
  constructor(
    public from: DynamoScalarData,
    public to: DynamoScalarData,
  ) {
  }

  resolveExpression(key: string, attrName: string): string {
    if (RESERVED_WORDS.includes(key.toUpperCase())) {
      return `#${attrName} between :${attrName}_from and :${attrName}_to`
    }
    return `${key} between :${attrName}_from and :${attrName}_to`
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
      [`:${attrName}_from`]: this.from,
      [`:${attrName}_to`]: this.to,
    }
  }
}
