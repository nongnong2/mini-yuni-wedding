import * as THREE from 'three'
import { PETALS } from '../config'
import { colors, makeRandom, placeInto } from '../core/shapes'

// 축하 꽃잎
export function createPetals(scene) {
  const random = makeRandom(5)
  const petals = Array.from({ length: PETALS }, () => ({ x: 0, y: -9, z: 0, a: random(0, 6) }))
  const mesh = new THREE.InstancedMesh(
    new THREE.CircleGeometry(0.09, 10).scale(1, 0.65, 1),
    new THREE.MeshStandardMaterial({ side: THREE.DoubleSide }), PETALS)
  const tints = ['white', 'cream', 'pink-soft', 'pink'].map((name) => new THREE.Color(colors(name)))
  petals.forEach((_, i) => mesh.setColorAt(i, tints[i % tints.length]))
  mesh.frustumCulled = false
  mesh.visible = false
  scene.add(mesh)
  const matrix = new THREE.Matrix4()

  return {
    // (x, z) 주위에 뿌림
    scatter({ x, z }) {
      for (const p of petals) {
        p.x = x + random(-2.6, 2.6)
        p.z = z + random(-2.6, 2.6)
        p.y = random(3, 7)
      }
      mesh.visible = true
    },
    animate(dt, time) {
      if (!mesh.visible) return // 뿌리지 않았거나 다 떨어졌으면 쉼
      let flying = false
      petals.forEach((p, i) => {
        p.y -= dt * 1.5
        if (p.y > 0.05) flying = true
        mesh.setMatrixAt(i, placeInto(matrix, p.x + Math.sin(time * 2 + p.a) * 0.25, p.y, p.z, time * 2 + p.a, time + p.a, 0, p.y > 0.05 ? 1 : 0.0001))
      })
      mesh.instanceMatrix.needsUpdate = true
      mesh.visible = flying
    },
  }
}
