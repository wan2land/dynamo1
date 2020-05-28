import { AttributeValue, AttributeMap } from 'aws-sdk/clients/dynamodb'

export function toDynamoMap(item: Record<string, any>): AttributeMap {
  return Object.entries(item).reduce((carry, [key, value]) => Object.assign(carry, {
    [key]: toDynamo(value),
  }), {})
}

export function toDynamo(item: any): AttributeValue {
  if (item === null || typeof item === 'undefined' || item === '') {
    return { NULL: true }
  }
  if (item instanceof Buffer) {
    return { B: item }
  }
  switch (typeof item) {
    case 'string':
      return { S: item }
    case 'number':
      return { N: `${item}` }
    case 'boolean':
      return { BOOL: item }
  }
  if (Array.isArray(item)) {
    return { L: item.map(toDynamo) }
  }
  return { M: toDynamoMap(item) }
}
