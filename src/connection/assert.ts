
import { DynamoKeyTypeOf, DynamoIndex, DynamoCursor } from '../interfaces/connection'

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

export function assertDynamoIndex(index: DynamoIndex, data: DynamoCursor) {
  assertDynamoKeyType(index.pk.type ?? String, data.pk)
  if (index.sk) {
    assertDynamoKeyType(index.sk.type ?? String, data.sk)
  }
}
