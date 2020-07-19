import { Column, columnBy, Entity, GeneratedValue, Id, Index } from '../src'


@Entity({ 
  tableName: '',
  partitionKey: (user) => `users-${user.id}`
})
@Index({
  'userId',
})
export class Article {

  @Id()
  @Column({ name: 'user_id' })
  public id!: string

  @Column({ name: 'user_id' })
  public userId: string

  @Column(String, { name: 'username' })
  public username!: string

  @Column()
  public email!: string

  @Column({name: 'created_at'})
  public createdAt!: number
}
