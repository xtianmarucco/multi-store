import { describe, it, expect } from 'vitest'
import { buildLocationTree } from '../utils/locationTree'

describe('buildLocationTree', () => {
  it('ordena padre seguido de hijos con su profundidad', () => {
    const locations = [
      { id: 3, name: 'Cocina', parent_id: 1 },
      { id: 1, name: 'Casa', parent_id: null },
      { id: 4, name: 'Estante', parent_id: 2 },
      { id: 2, name: 'Garaje', parent_id: 1 },
      { id: 5, name: 'Oficina', parent_id: null },
    ]
    expect(buildLocationTree(locations).map(l => [l.name, l.depth])).toEqual([
      ['Casa', 0],
      ['Cocina', 1],
      ['Garaje', 1],
      ['Estante', 2],
      ['Oficina', 0],
    ])
  })

  it('devuelve un array vacío sin ubicaciones', () => {
    expect(buildLocationTree([])).toEqual([])
  })
})
