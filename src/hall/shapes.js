import * as THREE from 'three'

// global.css의 --hall-* 색을 읽어 옴. 예: colors('wall') → '#fbf8f4'
export function colors(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--hall-${name}`).trim()
}

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
export const mix = (a, b, k) => a + (b - a) * k // a와 b 사이를 k(0~1) 비율로 섞음

// 같은 seed(시작 숫자)면 항상 같은 난수 → 새로고침해도 꽃과 풀의 위치가 그대로
export function makeRandom(seed) {
  return (min = 0, max = 1) => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return min + (max - min) * (((t ^ (t >>> 14)) >>> 0) / 4294967296)
  }
}

// 글자를 숫자로 바꿈 (글 id로 자리를 정할 때 사용)
export function hash(text) {
  let h = 2166136261
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0
  return h
}

// 위치·회전·크기를 한 번에 담은 행렬
export function place(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz))
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), rotation, new THREE.Vector3(sx, sy, sz))
}

// [도형, 색, 위치] 여러 개를 하나로 합침. 한 번에 그릴 수 있어서 빠름
export function merge(parts) {
  const position = []
  const normal = []
  const color = []
  for (const [shape, hex, matrix = place()] of parts) {
    const g = shape.index ? shape.toNonIndexed() : shape.clone()
    g.applyMatrix4(matrix)
    const c = new THREE.Color(hex)
    for (const v of g.attributes.position.array) position.push(v)
    for (const v of g.attributes.normal.array) normal.push(v)
    for (let i = 0; i < g.attributes.position.count; i++) color.push(c.r, c.g, c.b)
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  out.setAttribute('normal', new THREE.Float32BufferAttribute(normal, 3))
  out.setAttribute('color', new THREE.Float32BufferAttribute(color, 3))
  return out
}

// 모서리가 둥근 상자
export function roundBox(w, h, d, r = 0.06) {
  const s = new THREE.Shape()
  const x = w / 2 - r
  const y = h / 2 - r
  const q = Math.PI / 2
  s.absarc(x, y, r * 0.999, 0, q)
  s.absarc(-x, y, r * 0.999, q, q * 2)
  s.absarc(-x, -y, r * 0.999, q * 2, q * 3)
  s.absarc(x, -y, r * 0.999, q * 3, q * 4)
  const b = Math.min(r, d / 2 - 0.001)
  const g = new THREE.ExtrudeGeometry(s, {
    depth: d - b * 2, bevelSize: b, bevelThickness: b, bevelOffset: -b, bevelSegments: 2, curveSegments: 3,
  })
  g.translate(0, 0, -d / 2 + b)
  return g
}

// 바닥에 눕힌 둥근 판 (w × d 넓이, h 두께)
export const slab = (w, d, h, r) => roundBox(w, d, h, r).rotateX(-Math.PI / 2)

export const ball = (r, a = r < 0.1 ? 8 : 12, b = r < 0.1 ? 6 : 9) => new THREE.SphereGeometry(r, a, b)

// 옆모습 점들을 한 바퀴 돌려 만든 모양 (치마, 몸통 등)
export const lathe = (points, n = 14, start = 0, length = Math.PI * 2) =>
  new THREE.LatheGeometry(points.map((p) => new THREE.Vector2(...p)), n, start, length)

// 주름진 커튼
export function curtain(w, h, folds) {
  const g = new THREE.PlaneGeometry(w, h, folds * 8, 8)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / w + 0.5
    const v = p.getY(i) / h + 0.5
    p.setZ(i, Math.sin(u * folds * Math.PI * 2) * 0.1 * (1.15 - v * 0.3))
  }
  g.computeVertexNormals()
  return g
}
