import { Column, Entity, column, text } from '../../src'


@Entity<Article>({
  name: 'articles',
  hashKey: [text('articles'), column('userId')],
  rangeKey: column('id'),
})
export class Article {

  @Column({ name: 'id' })
  public id!: string

  @Column({ name: 'user_id' })
  public userId!: string

  @Column()
  public email!: string

  @Column({ name: 'created_at' })
  public createdAt!: number
}
