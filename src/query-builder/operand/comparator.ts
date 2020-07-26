import { RESERVED_WORDS } from '../../constants/reserved-words'
import { DynamoData } from '../../interfaces/connection'
import { OperandResolver, Comparator } from '../../interfaces/query-builder'


export function createComparatorOperandResolver(comparator: Comparator, value: DynamoData): OperandResolver {
  return (key: string, attrName: string) => {
    if (RESERVED_WORDS.includes(key.toUpperCase())) {
      return {
        expression: `#${attrName} ${comparator} :${attrName}`,
        names: {
          [`#${attrName}`]: key,
        },
        values: {
          [`:${attrName}`]: value,
        },
      }
    }
    return {
      expression: `${key} ${comparator} :${attrName}`,
      names: {},
      values: {
        [`:${attrName}`]: value,
      },
    }
  }
}
