
import { DynamoKeyTypeOf, DynamoIndexOption, DynamoIndex } from '../interfaces/connection'

export function assertDynamoKeyType(type: DynamoKeyTypeOf, value: any) {
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

export function assertDynamoIndex(index: DynamoIndexOption, data: DynamoIndex) {
  assertDynamoKeyType(index.hashKey.type ?? String, data.hashKey)
  if (index.rangeKey) {
    assertDynamoKeyType(index.rangeKey.type ?? String, data.rangeKey)
  }
}
