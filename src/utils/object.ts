
export function isNotEmptyObject(node: any): node is object {
  return node && Object.keys(node).length > 0
}
