import { DynamoDB } from 'aws-sdk'

import { DynamoNode, TableOption, DynamoIndex, DynamoIndexOption } from '../interfaces/connection'


export function toDynamoMap(item: Record<string, any>): DynamoDB.AttributeMap {
  return Object.entries(item).reduce((carry, [key, value]) => Object.assign(carry, {
    [key]: toDynamo(value),
  }), {})
}

export function toDynamo(item: any): DynamoDB.AttributeValue {
  if (item === null || typeof item === 'undefined') {
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


export function fromDynamoMap(item: DynamoDB.AttributeMap): Record<string, any> {
  return Object.entries(item).reduce((carry, [key, value]) => Object.assign(carry, {
    [key]: fromDynamo(value),
  }), {})
}

export function fromDynamo(item: DynamoDB.AttributeValue): any {
  if (item.NULL) {
    return null
  }
  if (item.B) {
    return item.B
  }
  if ('S' in item) {
    return item.S
  }
  if (item.N) {
    return +item.N
  }
  if ('BOOL' in item) {
    return item.BOOL
  }
  if (item.L) {
    return item.L.map(fromDynamo)
  }
  if (item.M) {
    return fromDynamoMap(item.M)
  }
  throw new TypeError(`Unknown Dynamo attribute value. (item=${JSON.stringify(item)})`)
}

export function dynamoCursorToKey(cursor: DynamoIndex, index: DynamoIndexOption): DynamoDB.Key {
  return toDynamoMap({
    [index.hashKey.name]: cursor.hashKey,
    ...index.rangeKey ? { [index.rangeKey.name]: cursor.rangeKey } : {},
  })
}

export function dynamoNodeToAttrs<TData>({ cursor, index, data }: DynamoNode<TData>, option: TableOption): DynamoDB.AttributeMap {
  const node: Record<string, any> = {
    [option.hashKey.name]: cursor.hashKey,
    ...option.rangeKey ? { [option.rangeKey.name]: cursor.rangeKey } : {},
  }
  if (index) {
    (option.gsi ?? []).forEach((gsi, gsiIndex) => {
      if (index[gsiIndex] && index[gsiIndex].hashKey) {
        node[gsi.hashKey.name] = index[gsiIndex].hashKey
        if (gsi.rangeKey) {
          node[gsi.rangeKey.name] = index[gsiIndex].rangeKey ?? null
        }
      }
    })
  }
  return toDynamoMap({ ...node, ...data })
}

export function attrsToDynamoNode<TData>(data: DynamoDB.AttributeMap, option: TableOption): DynamoNode<TData> {
  const parsed = fromDynamoMap(data)

  const cursor: DynamoIndex = { hashKey: parsed[option.hashKey.name] }
  delete parsed[option.hashKey.name]

  if (option.rangeKey && option.rangeKey.name in parsed) {
    cursor.rangeKey = parsed[option.rangeKey.name]
    delete parsed[option.rangeKey.name]
  }

  const index: DynamoIndex[] = []
  ;(option.gsi ?? []).forEach((gsi, gsiIndex) => {
    if (gsi.hashKey.name in parsed) {
      index[gsiIndex] = { hashKey: parsed[gsi.hashKey.name] }
      delete parsed[gsi.hashKey.name]
      if (gsi.rangeKey && gsi.rangeKey.name in parsed) {
        cursor.rangeKey = parsed[gsi.rangeKey.name]
        delete parsed[gsi.rangeKey.name]
      }
    }
  })

  return {
    cursor,
    ...index.length > 0 ? { index } : {},
    data: parsed as TData,
  }
}
