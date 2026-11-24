import * as THREE from 'three'
import { ball, clamp, colors, curtain, makeRandom, merge, mix, place, roundBox, slab } from './shapes'

// 홀의 크기(미터). x: 왼쪽~오른쪽, z: 앞(스크린)~뒤(입구)
export const BOUNDS = { x0: -8.4, x1: 7.8, z0: -12.4, z1: 9.6 }
const { x0, x1, z0, z1 } = BOUNDS
const WIDTH = x1 - x0
const DEPTH = z1 - z0
export const CENTER = { x: (x0 + x1) / 2, z: (z0 + z1) / 2 }
const WALL_HEIGHT = 5

// 좌우 5석 × 10줄 = 100석
export const SEATS = []
for (let row = 0; row < 10; row++) {
  for (let col = 0; col < 10; col++) {
    SEATS.push({ x: col < 5 ? -5.45 + col * 0.95 : 1.65 + (col - 5) * 0.95, z: -5 + row * 1.12 })
  }
}

// 지나갈 수 없는 곳: [왼쪽, 오른쪽, 앞, 뒤] — 왼쪽 의자, 오른쪽 의자, 방명록대
const BLOCKS = [[-6.15, -1.35, -5.75, 5.75], [1.35, 6.15, -5.75, 5.75], [2.3, 4.9, 6.75, 8.1]]
const BODY = 0.3 // 캐릭터 반지름
export function blocked(x, z) {
  return x < x0 + 1.35 || x > x1 - 1.35 || z < -7.4 || z > 8.4
    || (z > 8.1 && Math.abs(x) > 1.3)
    || BLOCKS.some((b) => x > b[0] - BODY && x < b[1] + BODY && z > b[2] - BODY && z < b[3] + BODY)
}

// 입구 쪽 낮은 계단의 높이
export function floorHeight(x, z) {
  if (Math.abs(x) < 2.1 && z > 6.85) return 0.18
  if (Math.abs(x) < 1.7 && z > 6.25) return 0.1
  return 0
}

const standard = (options) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...options })

export function buildRoom(scene, screen) {
  const white = colors('white')
  const cream = colors('cream')
  const vertexMaterial = standard({ vertexColors: true, side: THREE.DoubleSide })
  const whiteMaterial = standard({ color: white, roughness: 0.6 })
  const wallMaterial = standard({ color: colors('wall'), emissive: colors('wall'), emissiveIntensity: 0.16 })
  const curtainMaterial = standard({ color: colors('curtain'), side: THREE.DoubleSide, roughness: 0.55 })

  function add(geometry, material, x = 0, y = 0, z = 0, shadow = true) {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    mesh.castShadow = shadow
    mesh.receiveShadow = true
    scene.add(mesh)
    return mesh
  }
  function addMany(geometry, material, matrices, tints) {
    const mesh = new THREE.InstancedMesh(geometry, material, matrices.length)
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    tints?.forEach((c, i) => mesh.setColorAt(i, c))
    mesh.castShadow = mesh.receiveShadow = true
    scene.add(mesh)
    return mesh
  }

  // ---------- 바닥과 벽 ----------
  add(slab(WIDTH + 0.8, DEPTH + 0.8, 0.9, 0.3), standard({ color: colors('base') }), CENTER.x, -0.47, CENTER.z)
  add(slab(WIDTH, DEPTH, 0.12, 0.05), standard({ color: colors('floor'), roughness: 0.55 }), CENTER.x, -0.06, CENTER.z)

  function archHole(cx) {
    const p = new THREE.Path()
    const r = 1.05
    p.moveTo(cx - r, 0.9)
    p.lineTo(cx - r, 2.9)
    p.absarc(cx, 2.9, r, Math.PI, 0, true)
    p.lineTo(cx + r, 0.9)
    p.lineTo(cx - r, 0.9)
    return p
  }
  function wall(length, holes) {
    const s = new THREE.Shape()
    s.moveTo(-length / 2, 0)
    s.lineTo(-length / 2, WALL_HEIGHT)
    s.lineTo(length / 2, WALL_HEIGHT)
    s.lineTo(length / 2, 0)
    holes.forEach((cx) => s.holes.push(archHole(cx)))
    return new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelSize: 0.04, bevelThickness: 0.04, bevelOffset: -0.04, bevelSegments: 2, curveSegments: 24 })
  }
  const windows = [-7.5, -3.8, 0, 3.8, 7.5]
  const skyMaterial = new THREE.MeshBasicMaterial({ color: colors('sky'), side: THREE.DoubleSide })
  for (const s of [-1, 1]) {
    const x = s < 0 ? x0 : x1
    add(wall(DEPTH, windows), wallMaterial, x, 0, CENTER.z, false).rotation.y = (-s * Math.PI) / 2
    const frame = merge([
      [new THREE.BoxGeometry(0.07, 3.2, 0.07), white, place(0, 2.3, 0)],
      [new THREE.BoxGeometry(0.07, 0.07, 2.1), white, place(0, 1.9, 0)],
      [new THREE.BoxGeometry(0.07, 0.07, 2.1), white, place(0, 2.9, 0)],
      [new THREE.BoxGeometry(0.24, 0.1, 2.4), white, place(-s * 0.12, 0.86, 0)],
      [new THREE.TorusGeometry(1.12, 0.06, 8, 28, Math.PI), white, place(-s * 0.06, 2.9, 0, 0, Math.PI / 2)],
      [new THREE.BoxGeometry(0.12, 2.05, 0.12), white, place(-s * 0.06, 1.9, 1.12)],
      [new THREE.BoxGeometry(0.12, 2.05, 0.12), white, place(-s * 0.06, 1.9, -1.12)],
    ])
    for (const z of windows) {
      add(new THREE.PlaneGeometry(2.2, 3.4), skyMaterial, x + s * 0.26, 2.3, CENTER.z + z, false).rotation.y = (-s * Math.PI) / 2
      add(frame, vertexMaterial, x + s * 0.02, 0, CENTER.z + z, false)
    }
  }
  add(wall(WIDTH + 0.6, []), wallMaterial, CENTER.x, 0, z0 - 0.3, false)

  // ---------- 스크린과 커튼 ----------
  add(roundBox(7.3, 4.1, 0.2, 0.1), whiteMaterial, 0, 2.75, z0 + 0.12, false)
  add(new THREE.PlaneGeometry(6.96, 3.78), new THREE.MeshBasicMaterial({ map: makeScreenTexture(screen) }), 0, 2.75, z0 + 0.24, false)
  for (const s of [-1, 1]) add(curtain(3, 4.7, 9), curtainMaterial, s * 5.3, 2.4, z0 + 0.3, false)

  // ---------- 단상과 잔디 버진로드 ----------
  add(slab(9.2, 4.2, 0.24, 0.1), whiteMaterial, 0, 0.12, -10.1)
  add(slab(7.6, 3.4, 0.24, 0.1), whiteMaterial, 0, 0.36, -10.4)
  add(slab(2.3, 13.6, 0.1, 0.05), standard({ color: colors('grass') }), 0, 0.03, -0.5, false)
  {
    const random = makeRandom(3)
    const blades = Array.from({ length: 1000 }, () =>
      place(random(-1.1, 1.1), 0.06, random(-7.2, 6.2), random(-0.3, 0.3), 0, random(-0.3, 0.3), random(0.7, 1.15)))
    const tints = blades.map(() => new THREE.Color(colors('grass')).offsetHSL(0, random(-0.03, 0.03), random(-0.04, 0.06)))
    const blade = merge([[new THREE.ConeGeometry(0.035, 0.13, 4), white, place(0, 0.06, 0)]])
    addMany(blade, vertexMaterial, blades, tints).castShadow = false
  }

  // ---------- 꽃: 작은 알갱이가 모인 수국 모양 ----------
  const flowerShape = makeFlowerShape(white)
  const flowerColors = ['white', 'cream', 'white', 'pink-soft', 'leaf', 'leaf-soft'].map(colors)
  const random = makeRandom(11)
  let flowers = []
  function bunch(x, y, z, r, count, flat = 0.7) {
    for (let i = 0; i < count * 1.7; i++) {
      const a = random(0, Math.PI * 2)
      const d = Math.sqrt(random()) * r
      flowers.push({
        matrix: place(x + Math.cos(a) * d, y + random(0, 0.5) * r * flat + (r - d) * 0.5, z + Math.sin(a) * d,
          random(0, 6), random(0, 6), 0, random(0.1, 0.17) * Math.min(1.25, r + 0.6)),
        color: new THREE.Color(flowerColors[random() < 0.24 ? 4 + Math.floor(random(0, 2)) : Math.floor(random(0, 4))]),
      })
    }
  }
  function plant() {
    const mesh = addMany(flowerShape, standard({ vertexColors: true, roughness: 0.95 }), flowers.map((f) => f.matrix), flowers.map((f) => f.color))
    flowers = []
    return mesh
  }
  for (const s of [-1, 1]) {
    for (let i = 0; i < 6; i++) bunch(s * 1.32, 0.16, 5 - i * 2.2, 0.2, 7)
    bunch(s * 4.1, 0.4, -8.5, 0.75, 34, 1)
    bunch(s * 3, 0.3, -8, 0.45, 16)
    bunch(s * 4.4, 1, -10.6, 0.6, 24, 1.3)
  }
  bunch(3.9, 1, 7.35, 0.2, 8)
  plant()

  // ---------- 입구: 낮은 단, 꽃 아치, 커튼 ----------
  add(slab(4.2, 2.6, 0.18, 0.08), whiteMaterial, 0, 0.09, 8.1)
  add(slab(3.4, 0.7, 0.1, 0.04), whiteMaterial, 0, 0.05, 6.6)
  const entry = []
  for (const s of [-1, 1]) {
    bunch(s * 1.95, 0.3, 8.7, 0.45, 18, 1.2)
    bunch(s * 1.95, 0.9, 8.8, 0.3, 10, 1.4)
    entry.push(add(new THREE.CylinderGeometry(0.09, 0.09, 2, 12), whiteMaterial, s * 1.9, 1, 8.8))
    entry.push(add(curtain(0.85, 2.9, 4), curtainMaterial, s * 2.5, 1.5, 8.95))
  }
  for (let i = 0; i <= 26; i++) {
    const a = (Math.PI * i) / 26
    bunch(Math.cos(a) * 1.9, 2 + Math.sin(a) * 1.82, 8.8, 0.12 + 0.12 * Math.abs(Math.cos(a * 0.5 + 0.4)), 3, 1)
  }
  entry.push(plant(), add(new THREE.TorusGeometry(1.9, 0.09, 10, 40, Math.PI), whiteMaterial, 0, 2, 8.8))

  // ---------- 화분 나무, 방명록대, 의자 ----------
  const leaf = colors('leaf')
  const tree = merge([
    [new THREE.CylinderGeometry(0.3, 0.24, 0.5, 20), white, place(0, 0.25, 0)],
    [new THREE.CylinderGeometry(0.05, 0.06, 1, 8), colors('wood'), place(0, 0.9, 0)],
    [ball(0.55, 20, 16), leaf, place(0, 1.75, 0)],
    [ball(0.4, 18, 14), colors('leaf-soft'), place(0.28, 2.1, 0.1)],
    [ball(0.36, 18, 14), leaf, place(-0.3, 1.98, -0.1)],
  ])
  const trees = []
  for (let i = 0; i < 6; i++) {
    trees.push(place(x0 + 0.65, 0, 6.6 - i * 2.75, 0, i, 0, random(0.85, 1.05)))
    trees.push(place(x1 - 0.65, 0, 6.6 - i * 2.75, 0, i * 2, 0, random(0.85, 1.05)))
  }
  addMany(tree, vertexMaterial, trees)

  add(merge([
    [roundBox(1.9, 0.9, 0.7, 0.1), white, place(0, 0.45, 0)],
    [roundBox(2.1, 0.1, 0.86, 0.04), colors('base'), place(0, 0.93, 0)],
    [roundBox(0.62, 0.05, 0.44, 0.02), cream, place(-0.35, 1.01, 0.08, 0, 0.12)],
    [new THREE.CylinderGeometry(0.018, 0.018, 0.34, 8), colors('wood'), place(0.1, 1.02, 0.12, Math.PI / 2, 0, 0.5)],
  ]), vertexMaterial, 3.6, 0, 7.4)

  const legs = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) =>
    [new THREE.CylinderGeometry(0.03, 0.025, 0.3, 8), colors('gold'), place(a * 0.25, 0.15, b * 0.22)])
  const chair = merge([
    [roundBox(0.62, 0.56, 0.1, 0.04).rotateX(Math.PI / 2), colors('pink-soft'), place(0, 0.33, 0)],
    [roundBox(0.62, 0.36, 0.08, 0.04), white, place(0, 0.5, 0.29)],
    ...legs,
  ])
  addMany(chair, vertexMaterial, SEATS.map((s) => place(s.x, 0, s.z)))

  return { entry } // 안으로 들어가면 시야를 가려서 숨길 것들
}

function makeFlowerShape(white) {
  const parts = []
  const n = 13
  for (let i = 0; i < n; i++) { // 공 표면에 고르게 알갱이를 놓음
    const y = 1 - ((i + 0.5) / n) * 2
    const r = Math.sqrt(1 - y * y)
    const a = i * 2.39996
    parts.push([new THREE.IcosahedronGeometry(0.44, 0), white, place(Math.cos(a) * r * 0.74, y * 0.74, Math.sin(a) * r * 0.74, a, i, 0)])
  }
  const g = merge(parts)
  const { position, normal, color } = g.attributes
  const p = new THREE.Vector3()
  const v = new THREE.Vector3()
  for (let i = 0; i < position.count; i++) {
    p.fromBufferAttribute(position, i)
    const shade = mix(0.82, 1, clamp(p.length() * 1.6 - 0.9, 0, 1)) // 안쪽은 조금 어둡게
    v.fromBufferAttribute(normal, i).multiplyScalar(0.55).add(p.normalize()).normalize()
    normal.setXYZ(i, v.x, v.y, v.z)
    color.setXYZ(i, shade, shade, shade)
  }
  return g
}

// 스크린 그림: 커버 사진 + 이름 + 날짜
function makeScreenTexture({ title, names, date, photo }) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 560
  const x = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  const image = new Image()

  function draw() {
    const g = x.createLinearGradient(0, 0, 1024, 560)
    g.addColorStop(0, colors('pink-soft'))
    g.addColorStop(0.4, colors('cream'))
    g.addColorStop(1, colors('white'))
    x.fillStyle = g
    x.fillRect(0, 0, 1024, 560)
    if (image.naturalWidth) { // 사진을 3:4 칸에 꽉 차게 잘라서
      const w = 360
      const h = 480
      const k = Math.max(w / image.naturalWidth, h / image.naturalHeight)
      x.drawImage(image, (image.naturalWidth - w / k) / 2, (image.naturalHeight - h / k) / 2, w / k, h / k, 40, 40, w, h)
    }
    const serif = getComputedStyle(document.documentElement).getPropertyValue('--serif')
    x.textAlign = 'center'
    x.fillStyle = colors('text-accent')
    x.font = `600 32px ${serif}`
    x.fillText(title, 712, 190)
    x.fillStyle = colors('text')
    x.font = `600 68px ${serif}`
    x.fillText(names, 712, 300, 580)
    x.font = `400 29px ${serif}`
    x.fillText(date, 712, 375, 580)
    texture.needsUpdate = true
  }
  draw()
  image.onload = draw
  image.src = photo
  document.fonts?.load(`600 68px ${getComputedStyle(document.documentElement).getPropertyValue('--serif')}`, names).then(draw).catch(() => {})
  return texture
}
