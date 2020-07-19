import { DynamoDB } from 'aws-sdk'
import { ConnectionOptions } from '../interfaces/connection'
import { Connection } from './connection'


export interface CreateConnectionOptions extends ConnectionOptions {
  dynamodb?: DynamoDB.Types.ClientConfiguration
}

export function createConnection(options: CreateConnectionOptions): Connection {
  const ddb = new DynamoDB(options.dynamodb)
  return new Connection(ddb, options)
}
