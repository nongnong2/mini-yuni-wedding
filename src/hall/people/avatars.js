import * as THREE from 'three'
import { ball, colors, lathe, merge, place, roundBox } from '../core/shapes'

export const HAIR_COUNT = 3

const bodyMaterial = () => new THREE.MeshStandardMaterial({ roughness: 0.85, vertexColors: true, side: THREE.DoubleSide })

// kind: man, woman, groom(신랑), bride(신부)
function avatarParts(kind, seated = false, hair = 0) {
  const isDress = kind === 'woman' || kind === 'bride'
  const isBride = kind === 'bride'
  const white = colors('white')
  const cream = colors('cream')
  const skin = colors('skin')
  const hairColor = colors(`hair${hair + 1}`)
  const cloth = colors({ man: 'suit', woman: 'dress', groom: 'groom', bride: 'white' }[kind])
  const shoe = isBride ? white : colors(isDress ? 'dress-shoe' : 'suit-shoe')
  const parts = { head: [], body: [], legL: [], legR: [], armL: [], armR: [] }
  const { head, body } = parts

  // 얼굴
  head.push([ball(0.36, 18, 14), skin, place(0, 1, 0, 0, 0, 0, 1.06, 0.97, 1)])
  for (const s of [-1, 1]) {
    head.push([ball(0.043), colors('eye'), place(s * 0.135, 0.975, 0.337, 0, 0, 0, 1, 1.3, 0.55)])
    head.push([ball(0.014), white, place(s * 0.135 + 0.014, 0.995, 0.362)])
    head.push([ball(0.062), colors('cheek'), place(s * 0.225, 0.875, 0.282, 0, s * 0.6, 0, 1, 0.66, 0.3)])
  }
  head.push([new THREE.TorusGeometry(0.045, 0.011, 4, 8, Math.PI), colors('mouth'), place(0, 0.895, 0.338, -0.1, 0, Math.PI)])

  // 머리카락
  const cap = new THREE.SphereGeometry(0.4, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.54)
  head.push([cap, hairColor, place(0, 1.02, -0.025, -0.42, 0, 0, 1.03, 0.98, 1)])
  if (isDress) {
    head.push([ball(0.3), hairColor, place(0, 0.86, -0.16, 0, 0, 0, 1.2, 1, 0.62)])
    for (const s of [-1, 1]) {
      head.push([ball(0.17), hairColor, place(s * 0.3, 0.93, 0.04, 0, 0, s * 0.12, 0.5, 1.35, 0.8)])
      head.push([ball(0.2), hairColor, place(s * 0.14, 1.245, 0.19, 0.3, 0, s * -0.5, 1.05, 0.5, 0.62)])
    }
  } else {
    for (const [x, r] of [[-0.17, 0.2], [0.02, 0.23], [0.2, 0.17]]) {
      head.push([ball(r), hairColor, place(x, 1.25, 0.2, 0.3, 0, x * -1.4, 1, 0.52, 0.62)])
    }
  }
  if (kind === 'woman') head.push([ball(0.17), hairColor, place(0, 1.42, -0.1)]) // 올림머리
  if (isBride) {
    const veil = [[0.12, 1.44], [0.3, 1.36], [0.42, 1.05], [0.47, 0.6], [0.56, 0.12]]
    head.push([lathe(veil, 20, Math.PI * 0.62, Math.PI * 0.76), white])
    for (const x of [-0.2, -0.07, 0.07, 0.2]) {
      head.push([ball(0.065), Math.abs(x) > 0.1 ? colors('pink-soft') : white, place(x, 1.36 - x * x * 0.6, 0.13)])
    }
  }

  // 옷
  if (isDress) {
    const hem = isBride ? 0.44 : 0.33
    body.push([lathe([[0.001, 0.13], [hem, 0.13], [hem + 0.015, 0.17], [hem * 0.78, 0.34], [0.175, 0.52], [0.16, 0.6], [0.13, 0.7], [0.001, 0.72]]), cloth])
    body.push([new THREE.TorusGeometry(0.172, 0.026, 5, 14), isBride ? colors('gold') : cream, place(0, 0.53, 0, Math.PI / 2)])
    if (isBride) {
      const bouquet = [[-0.07, 0.52, 'pink'], [0.07, 0.52, 'white'], [0, 0.6, 'pink'], [0, 0.47, 'leaf-soft']]
      for (const [x, y, c] of bouquet) body.push([ball(0.085), colors(c), place(x, y, 0.25)])
    } else {
      for (const s of [-1, 1]) body.push([ball(0.09), cream, place(s * 0.085, 0.52, -0.2, 0, 0, s * 0.4, 1.1, 0.75, 0.5)]) // 허리 뒤 리본
    }
  } else {
    body.push([lathe([[0.001, 0.24], [0.2, 0.24], [0.222, 0.3], [0.205, 0.48], [0.15, 0.67], [0.09, 0.72], [0.001, 0.72]]), cloth])
    body.push([ball(0.13), white, place(0, 0.6, 0.1, 0, 0, 0, 0.62, 1, 0.62)])
    body.push([roundBox(0.06, 0.16, 0.03, 0.014), kind === 'groom' ? cream : colors('tie'), place(0, 0.57, 0.186, -0.25)])
    if (kind === 'groom') body.push([ball(0.04), colors('pink'), place(0.12, 0.58, 0.15)])
  }

  // 팔다리
  for (const [s, leg, arm] of [[-1, parts.legL, parts.armL], [1, parts.legR, parts.armR]]) {
    const legColor = isDress ? skin : cloth
    if (seated) {
      leg.push([new THREE.CapsuleGeometry(0.078, 0.16, 2, 8), legColor, place(s * 0.1, 0.28, 0.2, Math.PI / 2)])
      leg.push([ball(0.092), shoe, place(s * 0.1, 0.24, 0.35, 0, 0, 0, 0.9, 1, 1)])
    } else {
      leg.push([new THREE.CapsuleGeometry(0.075, 0.12, 2, 8), legColor, place(s * 0.1, 0.17, 0)])
      leg.push([ball(0.092), shoe, place(s * 0.1, 0.06, 0.035, 0, 0, 0, 0.95, 0.62, 1.3)])
    }
    arm.push([new THREE.CapsuleGeometry(0.062, 0.2, 2, 8), cloth, place(s * 0.235, 0.53, 0.03, -0.15, 0, s * 0.34)])
    arm.push([ball(0.067), skin, place(s * 0.285, 0.37, 0.06)])
  }
  return parts
}

// 걸어다니는 캐릭터: 팔다리가 따로 움직임
export function makeWalker(kind) {
  const parts = avatarParts(kind)
  const group = new THREE.Group()
  const material = bodyMaterial()
  const pivots = { head: 0.7, body: 0, legL: 0.28, legR: 0.28, armL: 0.66, armR: 0.66 } // 관절 높이
  const walker = {
    group,
    dispose() {
      for (const mesh of group.children) mesh.geometry.dispose()
      material.dispose()
    },
  }
  for (const name in pivots) {
    const g = merge(parts[name])
    g.translate(0, -pivots[name], 0)
    const mesh = new THREE.Mesh(g, material)
    mesh.position.y = pivots[name]
    mesh.castShadow = mesh.receiveShadow = true
    group.add(mesh)
    walker[name] = mesh
  }
  return walker
}

// 앉은 하객: 똑같은 모양 여러 개를 한 번에 그림 (InstancedMesh)
export function makeSeatedCrowd(kind, hair, max) {
  const g = merge(Object.values(avatarParts(kind, true, hair)).flat())
  g.translate(0, -0.24, 0) // 엉덩이가 원점에 오게
  const mesh = new THREE.InstancedMesh(g, bodyMaterial(), max)
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  mesh.count = 0
  return mesh
}

// 앉은 하객의 그림자용 단순한 모양: 머리 + 몸
export function seatedShadowShape() {
  const g = merge([
    [new THREE.SphereGeometry(0.4, 8, 6), colors('white'), place(0, 1.02, 0)],
    [new THREE.CylinderGeometry(0.16, 0.34, 0.6, 8), colors('white'), place(0, 0.44, 0.02)],
  ])
  g.translate(0, -0.24, 0)
  return g
}
