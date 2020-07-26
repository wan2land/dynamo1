import { RESERVED_WORDS } from '../../constants/reserved-words'
import { DynamoScalarData, DynamoData } from '../../interfaces/connection'
import { OperandResolver } from '../../interfaces/query-builder'


export function beginsWith(substr: DynamoScalarData) {
  return createFunctionOperandResolver('begins_with', [substr])
}

export function createFunctionOperandResolver(func: string, args: DynamoScalarData[]): OperandResolver {
  return (key: string, attrName: string) => {
    let argsPart = ''
    let values = {}
    if (args.length === 1) {
      argsPart = `, :${attrName}`
      values = {
        [`:${attrName}`]: args[0],
      }
    } else if (args.length > 1) {
      argsPart = args.map((_, argIndex) => `, :${attrName}_${argIndex}`).join('')
      values = args.reduce<Record<string, DynamoData>>((carry, arg, argIndex) => {
        carry[`:${attrName}_${argIndex}`] = arg
        return carry
      }, {})
    }
    if (RESERVED_WORDS.includes(key.toUpperCase())) {
      return {
        expression: `${func}(#${attrName}${argsPart})`,
        names: {
          [`#${attrName}`]: key,
        },
        values,
      }
    }
    return {
      expression: `${func}(${key}${argsPart})`,
      names: {},
      values,
    }
  }
}
