import { RESERVED_WORDS } from '../../constants/reserved-words'
import { DynamoScalarData } from '../../interfaces/connection'
import { OperandResolver } from '../../interfaces/query-builder'


export function between(from: DynamoScalarData, to: DynamoScalarData): OperandResolver {
  return (propName: string, aliasName: string) => {
    if (RESERVED_WORDS.includes(propName.toUpperCase())) {
      return {
        expression: `#${aliasName} between :${aliasName}_from and :${aliasName}_to`,
        names: {
          [`#${aliasName}`]: propName,
        },
        values: {
          [`:${aliasName}_from`]: from,
          [`:${aliasName}_to`]: to,
        },
      }
    }
    return {
      expression: `${propName} between :${aliasName}_from and :${aliasName}_to`,
      names: {},
      values: {
        [`:${aliasName}_from`]: from,
        [`:${aliasName}_to`]: to,
      },
    }
  }
}
