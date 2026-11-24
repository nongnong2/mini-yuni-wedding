import * as THREE from 'three'
import { archHole, makeBuilder, makePicture, makeTree, standard, wall } from './build'
import { colors, curtain, makeRandom, merge, place, roundBox, slab } from './shapes'

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

// 지나갈 수 없는 곳: [왼쪽, 오른쪽, 앞, 뒤] — 왼쪽 의자, 오른쪽 의자
const BLOCKS = [[-6.15, -1.35, -5.75, 5.75], [1.35, 6.15, -5.75, 5.75]]
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

export function buildRoom(group, screen) {
  const { add, addMany, bunch, plant, random } = makeBuilder(group, 11)
  const white = colors('white')
  const vertexMaterial = standard({ vertexColors: true, side: THREE.DoubleSide })
  const whiteMaterial = standard({ color: white, roughness: 0.6 })
  const wallMaterial = standard({ color: colors('wall'), emissive: colors('wall'), emissiveIntensity: 0.16 })
  const curtainMaterial = standard({ color: colors('curtain'), side: THREE.DoubleSide, roughness: 0.55 })

  // ---------- 바닥과 벽 ----------
  add(slab(WIDTH + 0.8, DEPTH + 0.8, 0.9, 0.3), standard({ color: colors('base') }), CENTER.x, -0.47, CENTER.z)
  add(slab(WIDTH, DEPTH, 0.12, 0.05), standard({ color: colors('floor'), roughness: 0.55 }), CENTER.x, -0.06, CENTER.z)

  const windows = [-7.5, -3.8, 0, 3.8, 7.5]
  const skyMaterial = new THREE.MeshBasicMaterial({ color: colors('sky'), side: THREE.DoubleSide })
  for (const s of [-1, 1]) {
    const x = s < 0 ? x0 : x1
    add(wall(DEPTH, WALL_HEIGHT, windows.map((cx) => archHole(cx, 1.05, 0.9, 2.9))), wallMaterial, x, 0, CENTER.z, false).rotation.y = (-s * Math.PI) / 2
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
  add(wall(WIDTH + 0.6, WALL_HEIGHT, []), wallMaterial, CENTER.x, 0, z0 - 0.3, false)

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

  // ---------- 꽃 ----------
  for (const s of [-1, 1]) {
    for (let i = 0; i < 6; i++) bunch(s * 1.32, 0.16, 5 - i * 2.2, 0.2, 7)
    bunch(s * 4.1, 0.4, -8.5, 0.75, 34, 1)
    bunch(s * 3, 0.3, -8, 0.45, 16)
    bunch(s * 4.4, 1, -10.6, 0.6, 24, 1.3)
  }
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

  // ---------- 화분 나무, 의자 ----------
  const trees = []
  for (let i = 0; i < 6; i++) {
    trees.push(place(x0 + 0.65, 0, 6.6 - i * 2.75, 0, i, 0, random(0.85, 1.05)))
    trees.push(place(x1 - 0.65, 0, 6.6 - i * 2.75, 0, i * 2, 0, random(0.85, 1.05)))
  }
  addMany(makeTree(), vertexMaterial, trees)

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

// 스크린 그림: 커버 사진 + 이름 + 날짜
function makeScreenTexture({ title, names, date, photo }) {
  return makePicture(1024, 560, photo, names, (pen, putPhoto, serif) => {
    putPhoto(40, 40, 360, 480)
    pen.fillStyle = colors('text-accent')
    pen.font = `600 32px ${serif}`
    pen.fillText(title, 712, 190)
    pen.fillStyle = colors('text')
    pen.font = `600 68px ${serif}`
    pen.fillText(names, 712, 300, 580)
    pen.font = `400 29px ${serif}`
    pen.fillText(date, 712, 375, 580)
  })
}
