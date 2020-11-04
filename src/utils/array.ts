import { MaybeArray } from '../interfaces/common'

export function strictArray<T>(maybe: MaybeArray<T>): T[] {
  return Array.isArray(maybe) ? maybe : [maybe]
}

export function range(count: number): number[] {
  return [...new Array(count).keys()]
}

export function chunk<T>(nodes: T[], size: number): T[][] {
  return range(Math.ceil(nodes.length / size)).map(index => nodes.slice(index * size, (index + 1) * size))
}
