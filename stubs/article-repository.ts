import { Repository } from '../src'
import { Article } from './article'


export class ArticleRepository extends Repository<Article> {
  something() {
    return 'something'
  }
}
