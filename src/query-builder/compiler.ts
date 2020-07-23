import { DynamoDB } from 'aws-sdk'

import { toDynamoMap } from '../connection/transformer'
import { TableOption, DynamoIndex } from '../interfaces/connection'
import { QueryBuilder } from './query-builder'


export class Compiler {
  constructor(public options: TableOption) {
  }

  compile(builder: QueryBuilder): DynamoDB.QueryInput {
    const result: DynamoDB.QueryInput = {
      TableName: this.options.tableName,
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
    }

    if (builder.keyState) {
      let index: DynamoIndex = this.options
      if (builder.keyState.indexName) {
        const indexName = builder.keyState.indexName
        const gsi = (this.options.gsi ?? []).find(({ name }) => name === indexName)
        if (!gsi) {
          throw new Error(`Unknown index name(${indexName}).`)
        }
        index = gsi
      }

      const keyConditionExprParts = [builder.keyState.pk.resolveExpression(index.pk.name, 'pk')]
      Object.assign(result.ExpressionAttributeNames, builder.keyState.pk.resolveAttrNames(index.pk.name, 'pk'))
      Object.assign(result.ExpressionAttributeValues, toDynamoMap(builder.keyState.pk.resolveAttrValues(index.pk.name, 'pk')))

      if (index.sk && builder.keyState.sk) {
        keyConditionExprParts.push(builder.keyState.sk.resolveExpression(index.sk.name, 'sk'))
        Object.assign(result.ExpressionAttributeNames, builder.keyState.sk.resolveAttrNames(index.sk.name, 'sk'))
        Object.assign(result.ExpressionAttributeValues, toDynamoMap(builder.keyState.sk.resolveAttrValues(index.sk.name, 'sk')))
      }

      result.KeyConditionExpression = keyConditionExprParts.join(' and ')
    }

    return result
  }
}
