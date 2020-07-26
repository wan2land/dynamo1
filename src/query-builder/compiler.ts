import { DynamoDB } from 'aws-sdk'

import { toDynamoMap } from '../connection/transformer'
import { TableOption, DynamoIndex } from '../interfaces/connection'
import { FilterState, FilterCondition, RawState } from '../interfaces/query-builder'
import { QueryBuilder } from './query-builder'

export class Compiler {
  constructor(public options: TableOption) {
  }

  compileFilterCondition(state: FilterCondition, aliasName: string): RawState | null {
    if ('brace' in state) {
      const compiled = this.compileFilterStates(state.brace, aliasName)
      return compiled ? {
        expression: `(${compiled.expression})`,
        names: compiled.names,
        values: compiled.values,
      } : null
    }
    if ('not' in state) {
      const compiled = this.compileFilterCondition(state.not, aliasName)
      return compiled ? {
        expression: compiled.expression.startsWith('(') && compiled.expression.endsWith(')')
          ? `not ${compiled.expression}`
          : `not (${compiled.expression})`,
        names: compiled.names,
        values: compiled.values,
      } : null
    }

    return state.resolver(state.name, aliasName)
  }

  compileFilterStates(states: FilterState[], aliasName: string): RawState | null {
    if (states.length === 0) {
      return null
    }
    const compiledStates = states.map((state, stateIndex) => ({
      logic: state.logic,
      compiled: this.compileFilterCondition(state.condition, `${aliasName}_${stateIndex}`),
    })).filter(({ compiled }) => compiled) as { logic: 'and' | 'or', compiled: RawState }[]

    if (compiledStates.length === 1) {
      return compiledStates[0].compiled
    }

    let expression = ''
    const names = {} as Record<string, any>
    const values = {} as Record<string, any>
    compiledStates.forEach(({ logic, compiled }, stateIndex) => {
      expression += stateIndex === 0 ? compiled.expression : ` ${logic} ${compiled.expression}`
      Object.assign(names, compiled.names)
      Object.assign(values, compiled.values)
    })

    return {
      expression,
      names,
      values,
    }
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
        result.IndexName = gsi.name
        index = gsi
      }

      const compiledPk = builder.keyState.pk(index.pk.name, 'pk')
      const keyConditionExprParts = [compiledPk.expression]
      Object.assign(result.ExpressionAttributeNames, compiledPk.names)
      Object.assign(result.ExpressionAttributeValues, toDynamoMap(compiledPk.values))

      if (index.sk && builder.keyState.sk) {
        const compiledSk = builder.keyState.sk(index.sk.name, 'sk')
        keyConditionExprParts.push(compiledSk.expression)
        Object.assign(result.ExpressionAttributeNames, compiledSk.names)
        Object.assign(result.ExpressionAttributeValues, toDynamoMap(compiledSk.values))
      }

      result.KeyConditionExpression = keyConditionExprParts.join(' and ')
    }

    if (builder.filterStates) {
      const compiled = this.compileFilterStates(builder.filterStates, 'filter')
      if (compiled) {
        result.FilterExpression = compiled.expression
        Object.assign(result.ExpressionAttributeNames, compiled.names)
        Object.assign(result.ExpressionAttributeValues, toDynamoMap(compiled.values))
      }
    }

    if (builder.limitState) {
      result.Limit = builder.limitState
    }

    if (typeof builder.scanIndexForwardState === 'boolean') {
      result.ScanIndexForward = builder.scanIndexForwardState
    }

    if (builder.exclusiveStartKeyState) {
      result.ExclusiveStartKey = toDynamoMap(builder.exclusiveStartKeyState)
    }

    return result
  }
}
