import * as THREE from 'three'

// global.css의 --hall-* 색을 읽어 옴. 예: colors('wall') → '#fbf8f4'
export function colors(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--hall-${name}`).trim()
}

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
export const turn = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from)) // 가까운 쪽으로 도는 각도
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

// 계산용 임시 값. 매 순간 새로 만들지 않고 돌려써서 빠름
const tempPosition = new THREE.Vector3()
const tempRotation = new THREE.Quaternion()
const tempEuler = new THREE.Euler()
const tempScale = new THREE.Vector3()

// 위치·회전·크기를 이미 있는 행렬에 담음 (매 순간 움직이는 것에 사용)
export function placeInto(matrix, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  return matrix.compose(tempPosition.set(x, y, z), tempRotation.setFromEuler(tempEuler.set(rx, ry, rz)), tempScale.set(sx, sy, sz))
}
// 위치·회전·크기를 새 행렬에 담음
export const place = (...args) => placeInto(new THREE.Matrix4(), ...args)

// [도형, 색, 위치] 여러 개를 하나로 합침. 한 번에 그릴 수 있어서 빠름
export function merge(parts) {
  const pieces = parts.map(([shape, hex, matrix]) => {
    const g = shape.index ? shape.toNonIndexed() : shape.clone()
    if (matrix) g.applyMatrix4(matrix)
    return { position: g.attributes.position.array, normal: g.attributes.normal.array, color: new THREE.Color(hex) }
  })
  const size = pieces.reduce((sum, p) => sum + p.position.length, 0)
  const position = new Float32Array(size)
  const normal = new Float32Array(size)
  const color = new Float32Array(size)
  let offset = 0
  for (const p of pieces) {
    position.set(p.position, offset)
    normal.set(p.normal, offset)
    for (let i = 0; i < p.position.length; i += 3) p.color.toArray(color, offset + i)
    offset += p.position.length
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.BufferAttribute(position, 3))
  out.setAttribute('normal', new THREE.BufferAttribute(normal, 3))
  out.setAttribute('color', new THREE.BufferAttribute(color, 3))
  return out
}

// 그림자만 만드는 단순한 모양. mesh는 그림자를 안 만들고, 같은 자리의 shape가 대신 만듦 (그리는 양이 크게 줄어듦)
export function makeShadow(mesh, shape) {
  const shadow = new THREE.InstancedMesh(shape, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }), mesh.instanceMatrix.count)
  shadow.instanceMatrix = mesh.instanceMatrix // 위치를 함께 씀
  shadow.frustumCulled = false
  shadow.castShadow = true
  mesh.castShadow = false
  mesh.parent.add(shadow)
  return shadow
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
