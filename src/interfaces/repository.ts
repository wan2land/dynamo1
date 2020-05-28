import { RelaterOptions } from 'relater'

export interface RepositoryOptions<P> extends RelaterOptions<P> {
  name: string
  id: {
    property: string | symbol,
    sourceKey: string,
  }
  indexes: {
    name: string,
    indexer(entity: P): string,
  }[]
  generatedValues: {
    property: string | symbol,
    strategy: string,
  }[]
}

export interface RetrieveOptions {
  limit?: number
  // offset?: number
  after?: string
  index?: string
  desc?: boolean
}

export interface RetrieveResult<P> {
  nodes: {
    cursor: string,
    node: P,
  }[]
  endCursor?: string
}

