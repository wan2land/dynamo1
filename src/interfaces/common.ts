
export type ConstructType<T> = new (...args: any[]) => T

export type MaybeArray<T> = T | T[]

export type MaybePromise<T> = T | Promise<T>

export type MaybeFactory<P> = P | Factory<P>

export type Factory<P> = ((type: any) => P)
