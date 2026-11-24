import { COUPLE } from '../places/hall'
import { makeWalker } from './avatars'

// 단상 위의 신랑신부
export function createCouple(group) {
  const groom = makeWalker('groom')
  const bride = makeWalker('bride')
  for (const [c, s] of [[groom, -1], [bride, 1]]) {
    c.group.position.set(COUPLE.x + s * 0.5, COUPLE.y, COUPLE.z)
    c.group.rotation.y = -s * 0.22
    c.group.scale.setScalar(1.12)
    group.add(c.group)
  }
  bride.armL.rotation.x = bride.armR.rotation.x = -0.7
  groom.armR.rotation.x = -0.35

  return {
    animate(time) {
      for (const [c, offset] of [[groom, 0], [bride, 1.3]]) {
        c.body.rotation.z = Math.sin(time * 1.6 + offset) * 0.03
        c.head.rotation.z = Math.sin(time * 1.6 + offset) * 0.06
      }
      groom.armL.rotation.z = -1.9 + Math.sin(time * 5) * 0.28 * (Math.sin(time * 0.7) > 0 ? 1 : 0) // 손 흔들기
    },
  }
}
