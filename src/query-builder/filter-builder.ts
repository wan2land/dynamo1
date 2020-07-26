import { DynamoData } from '../interfaces/connection'
import { OperandResolver, FilterState, Comparator, FilterCondition } from '../interfaces/query-builder'
import { createComparatorOperandResolver } from './operand/comparator'

function createFilterCondition(not: boolean, nameOrHandler: string | ((builder: FilterBuilder) => any), valueOrOperand?: DynamoData | Comparator | OperandResolver, value?: DynamoData): FilterCondition {
  let condition: FilterCondition
  if (typeof nameOrHandler === 'function') {
    const subFilterBuilder = new FilterBuilder()
    nameOrHandler(subFilterBuilder)
    condition = {
      brace: subFilterBuilder.filterStates ?? [],
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

export class FilterBuilder {

  filterStates?: FilterState[]

  filter(handler: (builder: FilterBuilder) => any): this
  filter(name: string, value: DynamoData): this
  filter(name: string, operand: OperandResolver): this
  filter(name: string, comparator: Comparator, value: DynamoData): this
  filter(nameOrHandler: any, valueOrOperand?: any, value?: any): this {
    (this.filterStates = this.filterStates ?? []).push({
      logic: 'and',
      condition: createFilterCondition(false, nameOrHandler, valueOrOperand, value),
    })
    return this
  }

  filterNot(handler: (builder: FilterBuilder) => any): this
  filterNot(name: string, value: DynamoData): this
  filterNot(name: string, operand: OperandResolver): this
  filterNot(name: string, comparator: Comparator, value: DynamoData): this
  filterNot(nameOrHandler: any, valueOrOperand?: any, value?: any): this {
    (this.filterStates = this.filterStates ?? []).push({
      logic: 'and',
      condition: createFilterCondition(true, nameOrHandler, valueOrOperand, value),
    })
    return this
  }

  orFilter(handler: (builder: FilterBuilder) => any): this
  orFilter(name: string, value: DynamoData): this
  orFilter(name: string, operand: OperandResolver): this
  orFilter(name: string, comparator: Comparator, value: DynamoData): this
  orFilter(nameOrHandler: any, valueOrOperand?: any, value?: any): this {
    (this.filterStates = this.filterStates ?? []).push({
      logic: 'or',
      condition: createFilterCondition(false, nameOrHandler, valueOrOperand, value),
    })
    return this
  }

  orFilterNot(handler: (builder: FilterBuilder) => any): this
  orFilterNot(name: string, value: DynamoData): this
  orFilterNot(name: string, operand: OperandResolver): this
  orFilterNot(name: string, comparator: Comparator, value: DynamoData): this
  orFilterNot(nameOrHandler: any, valueOrOperand?: any, value?: any): this {
    (this.filterStates = this.filterStates ?? []).push({
      logic: 'or',
      condition: createFilterCondition(true, nameOrHandler, valueOrOperand, value),
    })
    return this
  }

  andFilter(handler: (builder: FilterBuilder) => any): this
  andFilter(name: string, value: DynamoData): this
  andFilter(name: string, operand: OperandResolver): this
  andFilter(name: string, comparator: Comparator, value: DynamoData): this
  andFilter(nameOrHandler: any, valueOrOperand?: any, value?: any): this {
    (this.filterStates = this.filterStates ?? []).push({
      logic: 'and',
      condition: createFilterCondition(false, nameOrHandler, valueOrOperand, value),
    })
    return this
  }

  andFilterNot(handler: (builder: FilterBuilder) => any): this
  andFilterNot(name: string, value: DynamoData): this
  andFilterNot(name: string, operand: OperandResolver): this
  andFilterNot(name: string, comparator: Comparator, value: DynamoData): this
  andFilterNot(nameOrHandler: any, valueOrOperand?: any, value?: any): this {
    (this.filterStates = this.filterStates ?? []).push({
      logic: 'and',
      condition: createFilterCondition(true, nameOrHandler, valueOrOperand, value),
    })
    return this
  }
}
