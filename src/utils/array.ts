import { MaybeArray } from '../interfaces/common'

export function strictArray<T>(maybe: MaybeArray<T>): T[] {
  return Array.isArray(maybe) ? maybe : [maybe]
}
