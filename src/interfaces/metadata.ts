import { ColumnTypeConstructor, MaybePromise } from './common'
import { TableIndex } from './repository'

export interface MetadataEntity {
  target: Function
  name: string
  aliasName: string
  separator: string
  pk: TableIndex<any>[]
  sk: TableIndex<any>[]
  gsi: {
    pk: TableIndex<any>[],
    sk: TableIndex<any>[],
  }[]
}

export interface MetadataColumn {
  target: Function
  property: string | symbol
  name: string
  type: ColumnTypeConstructor
  nullable: boolean
  onCreate?: (entity: any) => MaybePromise<any>
  onUpdate?: (entity: any) => MaybePromise<any>
}
