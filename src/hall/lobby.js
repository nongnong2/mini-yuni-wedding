import * as THREE from 'three'
import { archHole, makeBuilder, makePicture, makeTree, standard, wall } from './build'
import { clamp, colors, curtain, merge, mix, place, roundBox, slab } from './shapes'

// 로비(예식장 입구)의 크기(미터). 안쪽 벽(z0) 가운데에 홀로 들어가는 문이 있음
export const LOBBY = { x0: -4.6, x1: 4.6, z0: -3.6, z1: 4 }
const { x0, x1, z0, z1 } = LOBBY
const WIDTH = x1 - x0
const DEPTH = z1 - z0
const CENTER_Z = (z0 + z1) / 2
const WALL_HEIGHT = 4.9

const DOOR = { r: 1.15, top: 2.5 } // 문 폭의 절반, 둥근 부분이 시작되는 높이
const DESK = { x: 2.9, z: -2.2 } // 손님맞이대

export const BOOK = { x: DESK.x - 0.25, y: 1.02, z: DESK.z + 0.06 } // 방명록
export const BOOK_STAND = { x: BOOK.x, z: -1.2 } // 방명록을 쓸 때 서는 곳
export const DOOR_STAND = { x: 0, z: z0 + 0.85 } // 문 앞
export const DOOR_LABEL = { x: 0, y: DOOR.top + 1.4, z: z0 + 0.1 }
export const START = { x: 0, z: 2.5 }
export const INSIDE = { x: 0, z: z0 - 1.2 } // 문을 지나 이곳에 오면 홀로 바뀜

// 지나갈 수 없는 곳: 손님맞이대, 사진 안내판
const BLOCKS = [[1.75, 4.05, -2.65, -1.75], [-3.5, -1.8, -3, -2]]
const BODY = 0.3
export function lobbyBlocked(x, z) {
  return x < x0 + 1 || x > x1 - 1 || z < z0 + 0.6 || z > z1 - 0.7
    || BLOCKS.some((b) => x > b[0] - BODY && x < b[1] + BODY && z > b[2] - BODY && z < b[3] + BODY)
}
export const atDoor = (x, z) => Math.abs(x) < 1 && z < z0 + 1.1

export function buildLobby(group, { names, date, photo }) {
  const { add, addMany, bunch, plant, random } = makeBuilder(group, 21)
  const white = colors('white')
  const cream = colors('cream')
  const gold = colors('gold')
  const vertexMaterial = standard({ vertexColors: true, side: THREE.DoubleSide })
  const whiteMaterial = standard({ color: white, roughness: 0.6, side: THREE.DoubleSide })
  const wallMaterial = standard({ color: colors('wall'), emissive: colors('wall'), emissiveIntensity: 0.16 })
  const curtainMaterial = standard({ color: colors('curtain'), side: THREE.DoubleSide, roughness: 0.55 })
  const hit = new THREE.MeshBasicMaterial({ visible: false }) // 보이지 않지만 눌러지는 상자

  // ---------- 바닥과 벽 ----------
  add(slab(WIDTH + 0.8, DEPTH + 0.8, 0.9, 0.3), standard({ color: colors('base') }), 0, -0.47, CENTER_Z)
  add(slab(WIDTH, DEPTH, 0.12, 0.05), standard({ color: colors('floor'), roughness: 0.55 }), 0, -0.06, CENTER_Z)
  add(slab(2.1, DEPTH - 0.5, 0.05, 0.02), standard({ color: cream }), 0, 0.01, CENTER_Z - 0.15, false) // 문까지 이어지는 카펫
  add(wall(WIDTH + 0.6, WALL_HEIGHT, [archHole(0, DOOR.r, 0, DOOR.top)]), wallMaterial, 0, 0, z0 - 0.3, false)
  for (const s of [-1, 1]) {
    add(roundBox(0.5, 0.75, DEPTH - 0.4, 0.06), whiteMaterial, s * (WIDTH / 2 - 0.3), 0.37, CENTER_Z) // 낮은 화단
    for (let z = z0 + 0.7; z < z1 - 0.4; z += 0.62) bunch(s * (WIDTH / 2 - 0.3), 0.72, z, 0.24, 6, 1)
    add(curtain(1.15, 4.1, 4), curtainMaterial, s * 3.75, 2.2, z0 + 0.25, false)
  }

  // ---------- 문 ----------
  add(merge([ // 문틀
    [new THREE.TorusGeometry(DOOR.r + 0.09, 0.085, 10, 40, Math.PI), white, place(0, DOOR.top, 0)],
    [new THREE.BoxGeometry(0.17, DOOR.top, 0.17), white, place(-DOOR.r - 0.09, DOOR.top / 2, 0)],
    [new THREE.BoxGeometry(0.17, DOOR.top, 0.17), white, place(DOOR.r + 0.09, DOOR.top / 2, 0)],
  ]), vertexMaterial, 0, 0, z0 + 0.06)
  const leaves = [-1, 1].map((s) => {
    const pivot = new THREE.Group() // 경첩: 이 점을 중심으로 문이 돌아감
    pivot.position.set(s * DOOR.r, 0, z0 - 0.12)
    const leaf = add(doorLeaf(DOOR.r + 0.004, DOOR.top), whiteMaterial)
    const trim = add(merge([
      [new THREE.CylinderGeometry(0.028, 0.028, 0.85, 10), gold, place(DOOR.r - 0.16, 1.25, 0.15)],
      ...frameBars(0.2, DOOR.r - 0.34, 0.3, 1.0, colors('base')),
      ...frameBars(0.2, DOOR.r - 0.34, 1.2, 2.45, colors('base')),
    ]), vertexMaterial)
    pivot.add(leaf, trim)
    pivot.scale.x = -s // 오른쪽 문은 왼쪽 문을 거울처럼 뒤집음
    group.add(pivot)
    return { pivot, s }
  })
  // 문 안쪽: 밝은 빛과 잔디 버진로드
  add(new THREE.BoxGeometry(2.7, 3.9, 1.9), new THREE.MeshBasicMaterial({ color: cream, side: THREE.BackSide }), 0, 1.94, z0 - 1.2, false)
  add(slab(1.5, 1.6, 0.06, 0.02), standard({ color: colors('grass') }), 0, 0, z0 - 1.2, false)
  const door = add(new THREE.BoxGeometry(2.6, 3.9, 0.6), hit, 0, 1.95, z0, false)

  // ---------- 손님맞이대와 방명록 ----------
  add(merge([
    [roundBox(2.1, 0.9, 0.7, 0.1), white, place(0, 0.45, 0)],
    [roundBox(1.8, 0.56, 0.06, 0.02), cream, place(0, 0.46, 0.345)],
    [roundBox(2.3, 0.1, 0.9, 0.04), colors('base'), place(0, 0.93, 0)],
    [new THREE.CylinderGeometry(0.09, 0.075, 0.2, 16), gold, place(0.28, 1.08, -0.12)], // 펜꽂이
    [new THREE.CylinderGeometry(0.016, 0.016, 0.36, 8), colors('wood'), place(0.26, 1.22, -0.12, 0, 0, 0.18)],
    [new THREE.CylinderGeometry(0.016, 0.016, 0.36, 8), colors('text-accent'), place(0.31, 1.22, -0.1, 0.1, 0, -0.16)],
    [new THREE.CylinderGeometry(0.13, 0.1, 0.22, 18), white, place(0.8, 1.08, -0.05)], // 화병
  ]), vertexMaterial, DESK.x, 0, DESK.z)
  bunch(DESK.x + 0.8, 1.2, DESK.z - 0.05, 0.24, 13, 1.4)
  const book = add(merge([ // 펼친 방명록
    [roundBox(1.0, 0.04, 0.66, 0.018), colors('text-accent'), place(0, 0, 0)],
    [roundBox(0.46, 0.05, 0.58, 0.02), white, place(-0.235, 0.045, 0, 0, 0, -0.05)],
    [roundBox(0.46, 0.05, 0.58, 0.02), white, place(0.235, 0.045, 0, 0, 0, 0.05)],
    ...[-0.14, -0.04, 0.06, 0.16].flatMap((z) => [-0.235, 0.235].map((x) =>
      [new THREE.BoxGeometry(0.32, 0.004, 0.014), colors('base'), place(x, 0.073, z, 0, 0, Math.sign(x) * 0.05)])),
    [new THREE.BoxGeometry(0.035, 0.01, 0.74), colors('pink'), place(0, 0.075, 0.04)], // 책갈피 끈
  ]), vertexMaterial, BOOK.x, BOOK.y, BOOK.z)
  book.rotation.x = 0.1
  const bookHit = add(new THREE.BoxGeometry(1.4, 0.8, 1), hit, BOOK.x, BOOK.y + 0.1, BOOK.z, false)

  // ---------- 사진 안내판 ----------
  const board = merge([
    [roundBox(1.36, 1.8, 0.08, 0.03), white, place(0, 1.42, 0)],
    [new THREE.CylinderGeometry(0.035, 0.035, 2.3, 8), colors('wood'), place(-0.5, 1.1, -0.1, -0.08, 0, 0.06)],
    [new THREE.CylinderGeometry(0.035, 0.035, 2.3, 8), colors('wood'), place(0.5, 1.1, -0.1, -0.08, 0, -0.06)],
    [new THREE.CylinderGeometry(0.035, 0.035, 2.2, 8), colors('wood'), place(0, 1.05, -0.35, 0.25)],
    [roundBox(1.3, 0.07, 0.16, 0.03), colors('wood'), place(0, 0.5, 0.06)],
  ])
  add(board, vertexMaterial, -2.65, 0, -2.5).rotation.y = 0.14
  const picture = makePicture(480, 640, photo, names, (pen, putPhoto, serif) => {
    putPhoto(28, 28, 424, 450)
    pen.fillStyle = colors('text')
    pen.font = `600 44px ${serif}`
    pen.fillText(names, 240, 552, 420)
    pen.font = `400 22px ${serif}`
    pen.fillText(date, 240, 598, 420)
  })
  add(new THREE.PlaneGeometry(1.24, 1.66), new THREE.MeshBasicMaterial({ map: picture }), -2.644, 1.42, -2.455, false).rotation.y = 0.14
  bunch(-3.25, 0.12, -2.15, 0.34, 14, 1.1)
  bunch(-2.1, 0.1, -2.1, 0.26, 10, 1)

  // ---------- 문 옆 화분과 꽃 ----------
  addMany(makeTree(), vertexMaterial, [
    place(-1.58, 0, z0 + 0.35, 0, 1, 0, 0.68), place(1.58, 0, z0 + 0.35, 0, 2.4, 0, 0.68),
    place(x0 + 0.95, 0, z1 - 0.7, 0, 3, 0, random(0.8, 0.9)), place(x1 - 0.95, 0, z1 - 0.7, 0, 4, 0, random(0.8, 0.9)),
  ])
  plant()

  let opened = 0 // 문이 열린 정도 (0 닫힘, 1 열림)
  return {
    door, book: bookHit,
    animate(open, dt) {
      opened = mix(opened, open ? 1 : 0, 1 - Math.exp(-dt * 2.4))
      for (const { pivot, s } of leaves) pivot.rotation.y = -s * clamp(opened, 0, 1) * 1.42
    },
  }
}

// 위쪽 바깥 모서리가 둥근 문짝 한 장
function doorLeaf(r, top) {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.lineTo(0, top)
  s.absarc(r, top, r, Math.PI, Math.PI / 2, true)
  s.lineTo(r, 0)
  return new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: false, curveSegments: 20 })
}

// 문짝의 네모 장식 테두리
function frameBars(x, w, bottom, top, color) {
  const h = top - bottom
  const t = 0.035
  const bar = (bw, bh, bx, by) => [new THREE.BoxGeometry(bw, bh, 0.03), color, place(bx, by, 0.105)]
  return [
    bar(w, t, x + w / 2, bottom), bar(w, t, x + w / 2, top),
    bar(t, h, x, bottom + h / 2), bar(t, h, x + w, bottom + h / 2),
  ]
}
