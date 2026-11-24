import * as THREE from 'three'
import { COUPLE, hall } from '../places/hall'
import { clamp, mix } from './shapes'

// 카메라의 위치를 부드럽게 옮김
export function createCameraman({ camera, size }) {
  const view = { x: 0, y: 0, z: 0, distance: 60, pitch: 0.7, yaw: 0.5 } // 바라보는 점, 거리, 위아래·좌우 각도
  const point = new THREE.Vector3()

  // 지금 상태에서 카메라가 있어야 할 곳. state: index.js의 state
  function goal({ player, where, mode, yaw }) {
    const t = 2 * Math.tan((camera.fov * Math.PI) / 360) // 거리 1에서 보이는 높이
    const { aspect } = camera
    if (!player.walker) return startGoal(t, aspect)
    if (where === 'lobby') {
      return { x: player.x * 0.45, y: 1.3, z: player.z * 0.35 - 1.1, distance: clamp(7.4 / (t * Math.min(aspect, 1)), 20, 36), pitch: 0.42, yaw }
    }
    if (mode === 'whole') return { x: hall.center.x, y: 0, z: -0.5, distance: Math.max(20 / (t * aspect), 22 / t), pitch: 0.72, yaw }
    if (mode === 'stage') return stageGoal(player.seat ?? player, yaw, t, aspect)
    const distance = clamp(6.4 / (t * Math.min(aspect, 1)), 20, 28)
    if (player.seat) return { x: player.seat.x, y: 0.9, z: player.seat.z, distance: distance * 0.7, pitch: 0.86, yaw }
    return { x: player.x * 0.8, y: 0.9, z: player.z - 1.2, distance, pitch: 0.56, yaw }
  }
  // 입장 전: 로비 전체
  function startGoal(t, aspect) {
    const wide = aspect > 1
    const cardOnRight = wide && size.height <= 500 && size.width >= 540 // 가로로 눕힌 폰은 고르기 창이 오른쪽 (hall.css와 같은 조건)
    return { x: cardOnRight ? 2.6 : 0, y: 1, z: wide ? 2 : 2.4, distance: Math.max(11 / (t * aspect), 11 / t), pitch: 0.5, yaw: wide ? 0.3 : 0.2 }
  }
  // 내 뒤에서 신랑신부를 바라봄: 나와 신랑신부가 한 화면에 들어올 만큼 뒤로 물러남
  function stageGoal(from, yaw, t, aspect) {
    const dx = from.x - COUPLE.x
    const dz = Math.max(1, from.z - COUPLE.z)
    const pitch = 0.3
    const angle = clamp(Math.atan2(dx, dz), -0.22, 0.22)
    const side = Math.abs(dx * Math.cos(angle) - dz * Math.sin(angle)) // 화면에서 좌우로 벌어진 거리
    const tall = (dz * Math.sin(pitch)) / 0.42
    const distance = clamp(Math.max(tall, (side * 1.3 + 2) / aspect) / t, 15, 34)
    return { x: COUPLE.x + dx * 0.35, y: 0.9, z: COUPLE.z + dz / 2, distance, pitch, yaw: angle + yaw }
  }

  function apply() {
    camera.position.set(
      view.x + Math.sin(view.yaw) * Math.cos(view.pitch) * view.distance,
      view.y + Math.sin(view.pitch) * view.distance,
      view.z + Math.cos(view.yaw) * Math.cos(view.pitch) * view.distance)
    camera.lookAt(view.x, view.y, view.z)
    camera.updateMatrixWorld()
  }

  return {
    view,
    // k: 목표에 다가가는 비율 (1이면 바로)
    move(state, k) {
      const to = goal(state)
      for (const name in view) view[name] = mix(view[name], to[name], k)
      apply()
    },
    // 바로 목표로 옮기되, far배 멀리서 시작
    jump(state, far = 1) {
      Object.assign(view, goal(state))
      view.distance *= far
      apply()
    },
    // 3D 위치 → 화면 위치(px)
    toScreen(x, y, z) {
      point.set(x, y, z).project(camera)
      return [(point.x * 0.5 + 0.5) * size.width, (-point.y * 0.5 + 0.5) * size.height]
    },
  }
}
