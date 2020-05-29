
export type Indexer<P> = (entity: P) => string

export type ConstructType<T> = new (...args: any[]) => T

export type MaybeArray<T> = T | T[]

export type MaybePromise<T> = T | Promise<T>

export type MaybeFactory<P> = P | Factory<P>

export type Callable = (...args: any) => any

export type Factory<P> = ((type: any) => P)


export type ColumnType = boolean | number | string | Buffer

export type ColumnTypeConstructor = BooleanConstructor | NumberConstructor | StringConstructor | typeof Buffer

export type DynamoKey = string | number | Buffer

export type DynamoKeyType = StringConstructor | NumberConstructor | typeof Buffer
