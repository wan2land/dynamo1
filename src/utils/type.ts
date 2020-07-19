import { DynamoKeyType } from '../interfaces/common'

export function assertIndexableColumnType(type: DynamoKeyType, value: any) {
  const typeofValue = value instanceof Buffer ? 'buffer' : typeof value
  if (type === String && typeofValue === 'string') {
    return
  }
  if (type === Number && typeofValue === 'number') {
    return
  }
  if (type === Buffer && typeofValue === 'buffer') {
    return
  }

  throw new Error(`Expected ${type.name}, but the given is ${typeofValue}.`)
}
