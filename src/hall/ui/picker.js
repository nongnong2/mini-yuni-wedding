import * as THREE from 'three'
import { clamp } from '../core/shapes'

// 화면에서 누른 곳을 3D에서 찾음
export function createPicker(canvas, camera) {
  const ray = new THREE.Raycaster() // 카메라에서 누른 곳으로 쏘는 선
  const pointer = new THREE.Vector2()
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  return {
    ray,
    aim(clientX, clientY) {
      const box = canvas.getBoundingClientRect()
      pointer.set(((clientX - box.left) / box.width) * 2 - 1, (-(clientY - box.top) / box.height) * 2 + 1)
      ray.setFromCamera(pointer, camera)
    },
    // targets: { 이름: 물체 } 중 맨 앞에 맞은 것의 이름 (없으면 undefined)
    name(targets) {
      const hit = ray.intersectObjects(Object.values(targets))[0]
      return hit && Object.keys(targets).find((key) => targets[key] === hit.object)
    },
    // 바닥의 점 (bounds 밖이면 null)
    floor({ x0, x1, z0, z1 }) {
      const p = ray.ray.intersectPlane(ground, new THREE.Vector3())
      return p && p.x >= x0 && p.x <= x1 && p.z >= z0 && p.z <= z1 ? p : null
    },
    // 바닥의 점 (bounds 밖이면 가장 가까운 안쪽)
    nearestFloor({ x0, x1, z0, z1 }) {
      const p = ray.ray.intersectPlane(ground, new THREE.Vector3())
      return p && p.set(clamp(p.x, x0, x1), 0, clamp(p.z, z0, z1))
    },
  }
}
