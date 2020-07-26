import { QueryResult } from './connection'
import { QueryBuilderState } from './query-builder'


export interface QueryExecutor<TNode> {
  execute(state: QueryBuilderState): Promise<QueryResult<TNode>>
}
