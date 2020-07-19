import { Column, Entity } from '../src'


@Entity<User>({
  name: 'users',
  pk: [{ type: 'text', value: 'users' }],
  sk: [{ type: 'column', value: 'id' }],
})
export class User {
  @Column({ name: 'user_id' })
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
