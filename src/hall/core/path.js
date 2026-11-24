import { mix } from './shapes'

// 길찾기: 바닥을 작은 칸으로 나누고, 막히지 않은 칸만 이어서 목적지까지 감
const CELL = 0.25
const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]

export function makePathFinder({ x0, x1, z0, z1 }, blocked) {
  const nx = Math.ceil((x1 - x0) / CELL)
  const nz = Math.ceil((z1 - z0) / CELL)
  const cell = (k) => ({ x: x0 + ((k % nx) + 0.5) * CELL, z: z0 + (Math.floor(k / nx) + 0.5) * CELL })
  const free = Array.from({ length: nx * nz }, (_, k) => !blocked(cell(k).x, cell(k).z))

  function nearestFree(x, z) {
    let best = 0
    let bestDistance = Infinity
    free.forEach((ok, k) => {
      if (!ok) return
      const c = cell(k)
      const d = Math.hypot(c.x - x, c.z - z)
      if (d < bestDistance) { bestDistance = d; best = k }
    })
    return best
  }

  // a에서 b까지 곧장 갈 수 있는지
  function straight(a, b) {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.08)
    for (let i = 1; i < n; i++) if (blocked(mix(a.x, b.x, i / n), mix(a.z, b.z, i / n))) return false
    return true
  }

  return function findPath(from, to) {
    const start = nearestFree(from.x, from.z)
    const goal = nearestFree(to.x, to.z)
    const previous = new Int32Array(nx * nz).fill(-1)
    previous[start] = start
    const queue = [start] // 가까운 칸부터 차례로 퍼져 나감 (너비 우선 탐색)
    for (let h = 0; h < queue.length && previous[goal] < 0; h++) {
      const k = queue[h]
      for (const [a, b] of STEPS) {
        const i = (k % nx) + a
        const j = Math.floor(k / nx) + b
        const next = j * nx + i
        if (i < 0 || j < 0 || i >= nx || j >= nz || !free[next] || previous[next] >= 0) continue
        if (a && b && !(free[k + a] && free[k + b * nx])) continue // 모서리를 가로지르지 않음
        previous[next] = k
        queue.push(next)
      }
    }
    if (previous[goal] < 0) return []

    const cells = []
    for (let k = goal; k !== start; k = previous[k]) cells.unshift(cell(k))
    const path = []
    let current = { x: from.x, z: from.z }
    for (let i = 0; i < cells.length;) {
      let j = cells.length - 1
      while (j > i && !straight(current, cells[j])) j-- // 곧장 갈 수 있는 가장 먼 칸으로
      current = cells[j]
      path.push(current)
      i = j + 1
    }
    return path
  }
}
