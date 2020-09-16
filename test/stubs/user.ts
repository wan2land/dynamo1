import { v4 as uuid } from 'uuid'

import { Column, Entity, column, text } from '../../src'

@Entity<User>({
  name: 'users',
  hashKey: text('users'),
  rangeKey: column('id'),
  gsi: [
    {
      hashKey: column('email'),
    },
  ],
})
export class User {
  @Column({ name: 'user_id', onCreate: _ => uuid() })
  public id!: string

  @Column()
  public username?: string

  @Column()
  public email!: string

  @Column<User>({
    onCreate: entity => entity.createdAt || new Date().getTime(),
  })
  public createdAt!: number

  @Column<User>({
    onPersist: _ => new Date().getTime(),
  })
  public updatedAt!: number
}
