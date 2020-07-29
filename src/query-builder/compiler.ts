import { TableOption, DynamoIndexOption, QueryParams } from '../interfaces/connection'
import { FilterState, FilterCondition, Expression, QueryBuilderState } from '../interfaces/query-builder'

export class Compiler {
  constructor(public options: TableOption) {
  }

  compileFilterCondition(state: FilterCondition, aliasName: string): Expression | null {
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

  compileFilterStates(states: FilterState[], aliasName: string): Expression | null {
    if (states.length === 0) {
      return null
    }
    const compiledStates = states.map((state, stateIndex) => ({
      logic: state.logic,
      compiled: this.compileFilterCondition(state.condition, `${aliasName}_${stateIndex}`),
    })).filter(({ compiled }) => compiled) as { logic: 'and' | 'or', compiled: Expression }[]

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

  compile(state: QueryBuilderState): QueryParams {
    const result: QueryParams = {
      names: {},
      values: {},
    }

    if (state.key) {
      let index: DynamoIndexOption = this.options
      if (state.key.indexName) {
        const indexName = state.key.indexName
        const gsi = (this.options.gsi ?? []).find(({ name }) => name === indexName)
        if (!gsi) {
          throw new Error(`Unknown index name(${indexName}).`)
        }
        result.indexName = gsi.name
        index = gsi
      }

      const compiledHashKey = state.key.hashKey(index.hashKey.name, 'hashkey')
      const keyConditionExprParts = [compiledHashKey.expression]
      Object.assign(result.names, compiledHashKey.names)
      Object.assign(result.values, compiledHashKey.values)

      if (index.rangeKey && state.key.rangeKey) {
        const compiledRangeKey = state.key.rangeKey(index.rangeKey.name, 'rangekey')
        keyConditionExprParts.push(compiledRangeKey.expression)
        Object.assign(result.names, compiledRangeKey.names)
        Object.assign(result.values, compiledRangeKey.values)
      }

      result.keyCondition = keyConditionExprParts.join(' and ')
    }

    if (state.filter) {
      const compiled = this.compileFilterStates(state.filter, 'filter')
      if (compiled) {
        result.filter = compiled.expression
        Object.assign(result.names, compiled.names)
        Object.assign(result.values, compiled.values)
      }
    }

    if (state.limit) {
      result.limit = state.limit
    }

    if (typeof state.scanIndexForward === 'boolean') {
      result.scanIndexForward = state.scanIndexForward
    }

    if (state.exclusiveStartKey) {
      result.exclusiveStartKey = state.exclusiveStartKey
    }

    return result
  }
}
