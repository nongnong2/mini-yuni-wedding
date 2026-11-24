const STILL = { x: 0, z: 0 }

// PC 방향키의 입력
export function createControls() {
  const keys = new Set()
  return {
    still: STILL,
    setKey(code, down) { if (down) keys.add(code); else keys.delete(code) },
    clear() { keys.clear() },
    // 화면 기준 입력을 공간 기준 방향으로 바꿈 (yaw: 카메라의 좌우 각도)
    direction(yaw) {
      const x = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0)
      const y = (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0)
      const length = Math.hypot(x, y)
      if (!length) return STILL
      return { x: (x * Math.cos(yaw) + y * Math.sin(yaw)) / length, z: (-x * Math.sin(yaw) + y * Math.cos(yaw)) / length }
    },
  }
}
