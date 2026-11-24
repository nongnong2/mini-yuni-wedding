const DEAD_ZONE = 0.12 // 이보다 조금 민 것은 무시
const NONE = { x: 0, z: 0 }

// 조이스틱과 방향키의 입력을 모음
export function createControls() {
  const stick = { x: 0, y: 0 }
  const keys = new Set()
  return {
    setStick(x, y) { stick.x = x; stick.y = y },
    setKey(code, down) { if (down) keys.add(code); else keys.delete(code) },
    clear() { stick.x = stick.y = 0; keys.clear() },
    // 화면 기준 입력을 공간 기준 방향으로 바꿈 (yaw: 카메라의 좌우 각도)
    direction(yaw) {
      let x = stick.x + (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0)
      let y = stick.y + (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0)
      const length = Math.hypot(x, y)
      if (length <= DEAD_ZONE) return NONE
      if (length > 1) { x /= length; y /= length }
      return { x: x * Math.cos(yaw) + y * Math.sin(yaw), z: -x * Math.sin(yaw) + y * Math.cos(yaw) }
    },
  }
}
