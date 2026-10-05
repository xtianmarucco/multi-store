// Ordena la lista plana de ubicaciones como árbol (padre seguido de sus hijos) con su profundidad.
export const buildLocationTree = (locations) => {
  const byParent = new Map()
  for (const location of locations) {
    const key = location.parent_id ?? null
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key).push(location)
  }

  const result = []
  const visit = (parentId, depth) => {
    for (const location of byParent.get(parentId) ?? []) {
      result.push({ ...location, depth })
      visit(location.id, depth + 1)
    }
  }
  visit(null, 0)
  return result
}
