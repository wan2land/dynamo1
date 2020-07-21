import { Column, Entity, column, text } from '../../src'


@Entity<Article>({
  name: 'articles',
  pk: [text('articles'), column('userId')],
  sk: column('id'),
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
