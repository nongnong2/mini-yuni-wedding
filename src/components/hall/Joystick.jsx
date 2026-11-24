import { useRef } from 'react'

const RANGE = 46 // 끝까지 민 거리(px)
const KNOB_RANGE = 34 // 손잡이가 움직이는 거리(px)

// 왼쪽 아래 조이스틱. onMove(x, y)에 -1~1 값을 알려 줌
export default function Joystick({ onMove }) {
  const knob = useRef(null)

  function set(x, y) {
    onMove(x, y)
    knob.current.style.transform = `translate(${x * KNOB_RANGE}px, ${y * KNOB_RANGE}px)`
  }
  function move(e) {
    const box = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - box.left - box.width / 2) / RANGE
    const y = (e.clientY - box.top - box.height / 2) / RANGE
    const length = Math.max(1, Math.hypot(x, y)) // 동그라미 밖으로 나가지 않게
    set(x / length, y / length)
  }

  return (
    <div
      className="hall-stick"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e) }}
      onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e) }}
      onPointerUp={() => set(0, 0)} onPointerCancel={() => set(0, 0)}
    >
      <i ref={knob} />
    </div>
  )
}
