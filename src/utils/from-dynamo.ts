import { AttributeValue, AttributeMap } from 'aws-sdk/clients/dynamodb'

export function fromDynamoMap(item: AttributeMap): Record<string, any> {
  return Object.entries(item).reduce((carry, [key, value]) => Object.assign(carry, {
    [key]: fromDynamo(value),
  }), {})
}

export function fromDynamo(item: AttributeValue): any {
  if (item.NULL) {
    return null
  }
  if (item.B) {
    return item.B
  }
  if (item.S) {
    return item.S
  }
  if (item.N) {
    return +item.N
  }
  if (typeof item.BOOL !== 'undefined') {
    return item.BOOL
  }
  if (item.L) {
    return item.L.map(fromDynamo)
  }
  if (item.M) {
    return fromDynamoMap(item.M)
  }
  throw new TypeError('Unknown Dynamo attribute value.')
}
