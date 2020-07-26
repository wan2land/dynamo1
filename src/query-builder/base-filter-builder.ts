import { DynamoData } from '../interfaces/connection'
import { OperandResolver, FilterState, Comparator, FilterCondition, FilterBuilder } from '../interfaces/query-builder'
import { createComparatorOperandResolver } from './operand/comparator'

function createFilterCondition(not: boolean, nameOrHandler: string | ((builder: FilterBuilder) => any), valueOrOperand?: DynamoData | Comparator | OperandResolver, value?: DynamoData): FilterCondition {
  let condition: FilterCondition
  if (typeof nameOrHandler === 'function') {
    const subFilterBuilder = new BaseFilterBuilder()
    nameOrHandler(subFilterBuilder)
    condition = {
      brace: subFilterBuilder.getFilterStates(),
    }
  } else {
    condition = {
      name: nameOrHandler,
      resolver: value
        ? createComparatorOperandResolver(valueOrOperand as Comparator, value)
        : typeof valueOrOperand === 'function'
          ? valueOrOperand
          : createComparatorOperandResolver('=', valueOrOperand!),
    }
  }
  return not ? { not: condition } : condition
}

export class BaseFilterBuilder implements FilterBuilder {

  filterRoot?: FilterState[]

  getFilterStates(): FilterState[] {
    return (this.filterRoot = this.filterRoot ?? [])
  }

  filter(nameOrHandler: any, valueOrOperand?: any, value?: any): this {
    this.getFilterStates().push({
      logic: 'and',
      condition: createFilterCondition(false, nameOrHandler, valueOrOperand, value),
    })
    return this
  }

  filterNot(nameOrHandler: any, valueOrOperand?: any, value?: any): this {
    this.getFilterStates().push({
      logic: 'and',
      condition: createFilterCondition(true, nameOrHandler, valueOrOperand, value),
    })
    return this
  }

  orFilter(nameOrHandler: any, valueOrOperand?: any, value?: any): this {
    this.getFilterStates().push({
      logic: 'or',
      condition: createFilterCondition(false, nameOrHandler, valueOrOperand, value),
    })
    return this
  }

  orFilterNot(nameOrHandler: any, valueOrOperand?: any, value?: any): this {
    this.getFilterStates().push({
      logic: 'or',
      condition: createFilterCondition(true, nameOrHandler, valueOrOperand, value),
    })
    return this
  }

  andFilter(nameOrHandler: any, valueOrOperand?: any, value?: any): this {
    this.getFilterStates().push({
      logic: 'and',
      condition: createFilterCondition(false, nameOrHandler, valueOrOperand, value),
    })
    return this
  }

  andFilterNot(nameOrHandler: any, valueOrOperand?: any, value?: any): this {
    this.getFilterStates().push({
      logic: 'and',
      condition: createFilterCondition(true, nameOrHandler, valueOrOperand, value),
    })
    return this
  }
}
