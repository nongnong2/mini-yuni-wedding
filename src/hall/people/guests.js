import * as THREE from 'three'
import { LOOK_DISTANCE, TAG_COUNT, TAG_DISTANCE } from '../config'
import { hash, makeShadow, placeInto, turn } from '../core/shapes'
import { SEATS } from '../places/hall'
import { HAIR_COUNT, makeSeatedCrowd, seatedShadowShape } from './avatars'

const MAX = SEATS.length

// 글을 남기고 앉아 있는 하객들
export function createGuests(group) {
  const crowds = {} // 같은 모양끼리 한 번에 그림. 예: crowds.man0 = 머리색 1번 남자들
  const shadowShape = seatedShadowShape()
  for (const kind of ['man', 'woman']) {
    for (let h = 0; h < HAIR_COUNT; h++) {
      const mesh = makeSeatedCrowd(kind, h, MAX)
      group.add(mesh)
      crowds[kind + h] = { mesh, shadow: makeShadow(mesh, shadowShape), list: [] }
    }
  }
  const all = Object.values(crowds)
  const matrix = new THREE.Matrix4()
  let guests = []
  for (const c of all) c.shadow.count = 0

  return {
    find: (id) => guests.find((g) => g.message.id === id) ?? null,

    // 글 id로 자리를 정하고, 이미 누가 앉았으면 다음 빈자리로
    setMessages(messages) {
      const before = new Map(guests.map((g) => [g.message.id, g]))
      const taken = new Set()
      for (const c of all) c.list = []
      guests = messages.slice(-MAX).map((message) => {
        let seat = hash(`${message.id}seat`) % MAX
        while (taken.has(seat)) seat = (seat + 1) % MAX
        taken.add(seat)
        const guest = { rotation: Math.PI, hop: 0, ...before.get(message.id), message, ...SEATS[seat], phase: seat * 1.7 }
        const kind = message.avatar === 'man' ? 'man' : 'woman'
        crowds[kind + (hash(`${message.id}hair`) % HAIR_COUNT)].list.push(guest)
        return guest
      })
      for (const c of all) c.mesh.count = c.shadow.count = c.list.length
    },

    // 화면에서 누른 하객 (없으면 null)
    pick(ray) {
      let best = null
      for (const c of all) {
        if (!c.list.length) continue
        c.mesh.computeBoundingSphere()
        const hit = ray.intersectObject(c.mesh)[0]
        if (hit && (!best || hit.distance < best.distance)) best = { distance: hit.distance, guest: c.list[hit.instanceId] }
      }
      return best?.guest ?? null
    },

    // 이름표를 띄울, 나와 가까운 하객들 (가까운 순서)
    near({ player, selected, mineId }) {
      return guests
        .filter((g) => g !== selected && g.message.id !== mineId)
        .map((g) => ({ g, d: Math.hypot(g.x - player.x, g.z - player.z) }))
        .filter((n) => n.d < TAG_DISTANCE)
        .sort((a, b) => a.d - b.d)
        .slice(0, TAG_COUNT)
        .map((n) => n.g)
    },

    animate(dt, time, { player, selected, mineId }) {
      for (const { mesh, list } of all) {
        list.forEach((g, i) => {
          const near = !player.seat && Math.hypot(g.x - player.x, g.z - player.z) < LOOK_DISTANCE
          const want = g === selected ? 0 : near ? Math.atan2(player.x - g.x, player.z - g.z) : Math.PI
          g.rotation += turn(g.rotation, want) * Math.min(1, dt * 7) // 가까이 가거나 누르면 돌아봄
          g.hop = Math.max(0, g.hop - dt * 2)
          const size = g.message.id === mineId && !player.seat ? 0.001 : 1 // 내가 일어나면 자리는 비움
          mesh.setMatrixAt(i, placeInto(matrix,
            g.x, 0.4 + Math.sin(time * 1.8 + g.phase) * 0.012 + Math.sin(g.hop * Math.PI) * 0.28, g.z - 0.03,
            0, g.rotation + Math.sin(time * 0.6 + g.phase) * 0.06, Math.sin(time * 1.1 + g.phase) * 0.025, size))
        })
        mesh.instanceMatrix.needsUpdate = true
      }
    },
  }
}
