import { useRef } from 'react'

const TAP_RANGE = 8 // 이만큼(px) 넘게 움직이면 누르기가 아니라 끌기
const TURN_SPEED = 0.006 // 1px 끌 때 도는 각도(라디안)

// 3D 화면. 짧게 누르면 tap, 옆으로 끌면 시점 회전
export default function HallCanvas({ hall, canvasRef, overlayRef, canTurn }) {
  const drag = useRef(null)

  function down(e) {
    drag.current = { x: e.clientX, y: e.clientY, yaw: hall.current?.yaw ?? 0, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function move(e) {
    const d = drag.current
    if (!d || !canTurn) return
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > TAP_RANGE) d.moved = true
    if (d.moved) hall.current?.setYaw(d.yaw - (e.clientX - d.x) * TURN_SPEED)
  }
  function up(e) {
    if (drag.current && !drag.current.moved) hall.current?.tap(e.clientX, e.clientY)
    drag.current = null
  }

  return (
    <>
      <canvas
        ref={canvasRef} className="hall-canvas" aria-label="온라인 웨딩홀"
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null }}
      />
      <div ref={overlayRef} className="hall-overlay" />
    </>
  )
}
