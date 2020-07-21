import { v4 as uuid } from 'uuid'

import { Column, Entity, column, text } from '../../src'

@Entity<User>({
  name: 'users',
  pk: text('users'),
  sk: column('id'),
})
export class User {
  @Column({ name: 'user_id', onCreate: _ => uuid() })
  public id!: string

  @Column({ type: String })
  public username?: string

  @Column({ nullable: true })
  public email!: string

  @Column<User>({
    type: Number,
    onCreate: entity => entity.createdAt || new Date().getTime(),
  })
  public createdAt!: number

  @Column<User>({
    type: Number,
    onCreate: _ => new Date().getTime(),
    onUpdate: _ => new Date().getTime(),
  })
  public updatedAt!: number
}
