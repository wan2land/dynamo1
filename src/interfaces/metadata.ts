import { MaybePromise } from './common'
import { TableIndex } from './repository'

export interface MetadataEntity {
  target: Function
  name: string
  aliasName: string
  separator: string
  hashKey: TableIndex<any>[]
  rangeKey?: TableIndex<any>[]
  gsi: {
    hashKey: TableIndex<any>[],
    rangeKey?: TableIndex<any>[],
  }[]
}

export interface MetadataColumn {
  target: Function
  property: string | symbol
  name: string
  onCreate?: (entity: any) => MaybePromise<any>
  onUpdate?: (entity: any) => MaybePromise<any>
}
