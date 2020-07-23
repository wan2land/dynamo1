import { DynamoKey } from '../interfaces/connection'
import { KeyCondition, KeyConditionState, OperatorResolver, KeyOperator } from '../interfaces/query-builder'
import { SingleOperatorResolver } from './operators/single-operator-resolver'

function normalizeKeyCondition(key: DynamoKey | [KeyOperator, DynamoKey] | OperatorResolver): OperatorResolver {
  if (Array.isArray(key)) {
    return new SingleOperatorResolver(key[0], key[1])
  }
  if (typeof key === 'object' && !(key instanceof Buffer)) {
    return key
  }
  return new SingleOperatorResolver('=', key)
}

export class QueryBuilder {

  keyState?: KeyConditionState

  key(key: KeyCondition, indexName?: string): this {
    this.keyState = {
      pk: normalizeKeyCondition(key.pk),
      ...key.sk ? { sk: normalizeKeyCondition(key.sk) } : {},
      indexName,
    }
    return this
  }

  // public where(name: string, operator: WhereOperator, value: WhereValue): this
  // public where(name: string, operatorOrValue: any, valueOrNull?: WhereValue) {
  //   this.whereStates = this.whereStates || []
  //   this.whereStates.push({
  //     name,
  //     operator: !isNull(valueOrNull) ? operatorOrValue : '=',
  //     value: [!isNull(valueOrNull) ? valueOrNull : operatorOrValue],
  //   })
  //   return this
  // }

  // public orWhere(name: string, value: WhereValue): this
  // public orWhere(name: string, operator: WhereOperator, value: WhereValue): this
  // public orWhere(name: string, operatorOrValue: any, valueOrNull?: WhereValue) {
  //   this.whereStates = this.whereStates || []
  //   this.whereStates.push({
  //     or: true,
  //     name,
  //     operator: !isNull(valueOrNull) ? operatorOrValue : '=',
  //     value: [!isNull(valueOrNull) ? valueOrNull : operatorOrValue],
  //   })
  //   return this
  // }

  // public whereNot(name: string, value: WhereValue): this
  // public whereNot(name: string, operator: WhereOperator, value: WhereValue): this
  // public whereNot(name: string, operatorOrValue: any, valueOrNull?: WhereValue) {
  //   this.whereStates = this.whereStates || []
  //   this.whereStates.push({
  //     not: true,
  //     name,
  //     operator: !isNull(valueOrNull) ? operatorOrValue : '=',
  //     value: [!isNull(valueOrNull) ? valueOrNull : operatorOrValue],
  //   })
  //   return this
  // }

  // public orWhereNot(name: string, value: WhereValue): this
  // public orWhereNot(name: string, operator: WhereOperator, value: WhereValue): this
  // public orWhereNot(name: string, operatorOrValue: any, valueOrNull?: WhereValue) {
  //   this.whereStates = this.whereStates || []
  //   this.whereStates.push({
  //     or: true,
  //     not: true,
  //     name,
  //     operator: !isNull(valueOrNull) ? operatorOrValue : '=',
  //     value: [!isNull(valueOrNull) ? valueOrNull : operatorOrValue],
  //   })
  //   return this
  // }

  // public whereIn(name: string, values: WhereValue[]) {
  //   this.whereStates = this.whereStates || []
  //   this.whereStates.push({
  //     name,
  //     operator: 'in',
  //     value: values,
  //   })
  //   return this
  // }

  // public orWhereIn(name: string, values: WhereValue[]) {
  //   this.whereStates = this.whereStates || []
  //   this.whereStates.push({
  //     or: true,
  //     name,
  //     operator: 'in',
  //     value: values,
  //   })
  //   return this
  // }

  // public whereNotIn(name: string, values: WhereValue[]) {
  //   this.whereStates = this.whereStates || []
  //   this.whereStates.push({
  //     not: true,
  //     name,
  //     operator: 'in',
  //     value: values,
  //   })
  //   return this
  // }

  // public orWhereNotIn(name: string, values: WhereValue[]) {
  //   this.whereStates = this.whereStates || []
  //   this.whereStates.push({
  //     or: true,
  //     not: true,
  //     name,
  //     operator: 'in',
  //     value: values,
  //   })
  //   return this
  // }

  // public whereNull(name: string) {
  //   this.whereStates = this.whereStates || []
  //   this.whereStates.push({
  //     name,
  //     operator: 'is null',
  //   })
  //   return this
  // }

  // public orWhereNull(name: string) {
  //   this.whereStates = this.whereStates || []
  //   this.whereStates.push({
  //     or: true,
  //     name,
  //     operator: 'is null',
  //   })
  //   return this
  // }

  // public whereNotNull(name: string) {
  //   this.whereStates = this.whereStates || []
  //   this.whereStates.push({
  //     not: true,
  //     name,
  //     operator: 'is null',
  //   })
  //   return this
  // }

  // public orWhereNotNull(name: string) {
  //   this.whereStates = this.whereStates || []
  //   this.whereStates.push({
  //     or: true,
  //     not: true,
  //     name,
  //     operator: 'is null',
  //   })
  //   return this
  // }
}
