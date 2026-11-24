import * as THREE from 'three'
import { WALK_SPEED } from '../config'
import { clamp, colors, mix, turn } from '../core/shapes'
import { makeWalker } from './avatars'

// 내 캐릭터: 걷기와 모습
export function createPlayer(scene, start) {
  const marker = new THREE.Mesh( // 걸어갈 곳 표시
    new THREE.RingGeometry(0.2, 0.28, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: colors('text-accent'), transparent: true, opacity: 0.75, depthWrite: false }),
  )
  marker.visible = false
  scene.add(marker)
  let path = [] // 걸어갈 점들
  let arrive = null // 도착하면 할 일
  let phase = 0 // 걸음의 흔들림
  let speed = 0

  const player = {
    walker: null, ...start, y: 0,
    seat: null, // 앉은 자리 (서 있으면 null)

    enter(kind) {
      player.walker = makeWalker(kind)
      scene.add(player.walker.group)
    },
    // 길을 따라 걷고, 끝나면 then을 실행
    follow(points, then = null) {
      path = [...points]
      arrive = then
    },
    stop() { player.follow([]) },

    // input: 조이스틱·방향키의 방향 { x, z }, free: 벽을 무시하고 걸음(문을 지날 때)
    move(dt, input, blocked, free) {
      let go = Math.min(1, Math.hypot(input.x, input.z))
      let { x: vx, z: vz } = input
      if (go) player.stop()
      else if (path.length) { // 누른 곳까지 자동으로 걷기
        const px = path[0].x - player.x
        const pz = path[0].z - player.z
        const distance = Math.hypot(px, pz)
        if (distance < 0.09) path.shift()
        else {
          go = Math.min(1, distance / (WALK_SPEED * dt || 1))
          vx = (px / distance) * go
          vz = (pz / distance) * go
        }
      }
      speed = mix(speed, go * WALK_SPEED, Math.min(1, dt * 10))
      if (go) {
        const nx = player.x + vx * WALK_SPEED * dt
        const nz = player.z + vz * WALK_SPEED * dt
        if (free || !blocked(nx, player.z)) player.x = nx // 가로·세로를 따로 검사해서 벽을 따라 미끄러지게
        if (free || !blocked(player.x, nz)) player.z = nz
        player.rotation += turn(player.rotation, Math.atan2(vx, vz)) * Math.min(1, dt * 12)
      }
      if (!path.length && arrive) {
        const then = arrive
        arrive = null
        then()
      }
    },

    animate(dt, time, floorHeight, showMarker) {
      const w = player.walker
      if (w) {
        const k = clamp(speed / WALK_SPEED, 0, 1)
        phase += dt * 11 * k
        player.y = mix(player.y, floorHeight(player.x, player.z), Math.min(1, dt * 12))
        w.group.visible = !player.seat
        w.group.position.set(player.x, player.y + Math.abs(Math.sin(phase)) * 0.07 * k, player.z)
        w.group.rotation.y = player.rotation
        const swing = Math.sin(phase) * 0.75 * k
        w.legL.rotation.x = swing
        w.legR.rotation.x = -swing
        w.armL.rotation.x = -swing * 0.9
        w.armR.rotation.x = swing * 0.9
        w.head.rotation.z = Math.sin(time * 1.5) * 0.03
      }
      const end = path[path.length - 1]
      marker.visible = Boolean(end) && showMarker
      if (end) marker.position.set(end.x, floorHeight(end.x, end.z) + 0.1, end.z)
    },
  }
  return player
}
