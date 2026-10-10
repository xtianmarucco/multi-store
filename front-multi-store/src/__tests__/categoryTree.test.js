import { describe, it, expect } from 'vitest'
import { buildCategoryTree } from '../utils/categoryTree'

describe('buildCategoryTree', () => {
  it('ordena padre seguido de hijos con su profundidad', () => {
    const categories = [
      { id: 3, name: 'Calzado', parent_id: 1 },
      { id: 1, name: 'Indumentaria', parent_id: null },
      { id: 4, name: 'Ojotas', parent_id: 2 },
      { id: 2, name: 'Remeras', parent_id: 1 },
      { id: 5, name: 'Almacén', parent_id: null },
    ]
    expect(buildCategoryTree(categories).map(c => [c.name, c.depth])).toEqual([
      ['Indumentaria', 0],
      ['Calzado', 1],
      ['Remeras', 1],
      ['Ojotas', 2],
      ['Almacén', 0],
    ])
  })

  it('devuelve un array vacío sin categorías', () => {
    expect(buildCategoryTree([])).toEqual([])
  })
})
