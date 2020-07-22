import { v4 as uuid } from 'uuid'

import { Column, Entity, column, text } from '../../src'

@Entity<Something>({
  name: 'sometings',
  pk: text('sometings'),
  sk: column('id'),
})
export class Something {
  @Column({ onCreate: _ => uuid() })
  public id!: string

  @Column()
  public typeNull!: null

  @Column()
  public typeUndefined!: undefined

  @Column()
  public typeString!: string

  @Column()
  public typeEmptyString!: string

  @Column()
  public typeNumber!: number

  @Column()
  public typeTrue!: boolean

  @Column()
  public typeFalse!: boolean

  @Column()
  public typeBuffer!: Buffer

  @Column()
  public typeArray!: any[]

  @Column()
  public typeEmptyArray!: any[]

  @Column()
  public typeObject!: any
}
