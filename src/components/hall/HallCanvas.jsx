import { useRef } from 'react'

const TAP_RANGE = 12 // 이만큼(px) 넘게 움직이면 누르기가 아니라 끌기
const HOLD_DELAY = 220 // 이만큼(밀리초) 누르고 있으면 손가락을 따라 걸음
const TURN_SPEED = 0.006 // 1px 끌 때 도는 각도(라디안)

// 3D 화면. 톡 누르면 tap, 꾹 누르고 있으면 손가락을 따라 걷기, 바로 옆으로 끌면 시점 회전
export default function HallCanvas({ hall, canvasRef, overlayRef, active }) {
  const press = useRef(null) // 지금 누르고 있는 손가락 { id, x, y, yaw, kind, timer }

  function down(e) {
    if (press.current || !active) return // 손가락 하나만 따름
    const p = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: hall.current?.yaw ?? 0, kind: 'tap' }
    p.timer = setTimeout(() => { if (hall.current?.startHold(p.x, p.y)) p.kind = 'hold' }, HOLD_DELAY)
    press.current = p
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function move(e) {
    const p = press.current
    if (p?.id !== e.pointerId) return
    if (p.kind === 'hold') { hall.current?.moveHold(e.clientX, e.clientY); return }
    if (p.kind === 'tap' && Math.hypot(e.clientX - p.x, e.clientY - p.y) > TAP_RANGE) {
      p.kind = 'turn'
      clearTimeout(p.timer)
    }
    if (p.kind === 'turn') hall.current?.setYaw(p.yaw - (e.clientX - p.x) * TURN_SPEED)
  }
  function up(e) {
    const p = press.current
    if (p?.id !== e.pointerId) return
    if (p.kind === 'tap') hall.current?.tap(p.x, p.y)
    end(e)
  }
  function end(e) {
    const p = press.current
    if (p?.id !== e.pointerId) return
    clearTimeout(p.timer)
    hall.current?.endHold()
    press.current = null
  }

  return (
    <>
      <canvas
        ref={canvasRef} className="hall-canvas" aria-label="온라인 웨딩홀"
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onLostPointerCapture={end}
      />
      <div ref={overlayRef} className="hall-overlay" />
    </>
  )
}
