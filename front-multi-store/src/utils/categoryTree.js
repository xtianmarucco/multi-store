// Ordena la lista plana de categorías como árbol (padre seguido de sus hijos) con su profundidad.
export const buildCategoryTree = (categories) => {
  const byParent = new Map()
  for (const category of categories) {
    const key = category.parent_id ?? null
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key).push(category)
  }

  const result = []
  const visit = (parentId, depth) => {
    for (const category of byParent.get(parentId) ?? []) {
      result.push({ ...category, depth })
      visit(category.id, depth + 1)
    }
  }
  visit(null, 0)
  return result
}
