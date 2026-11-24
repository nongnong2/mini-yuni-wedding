import { useEffect } from 'react'

const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

// PC 방향키로 걷기. active일 때만 동작
export function useArrowKeys(hall, active) {
  useEffect(() => {
    if (!active) return
    const down = (e) => {
      if (!ARROWS.includes(e.code)) return
      e.preventDefault()
      hall.current?.setKey(e.code, true)
    }
    const up = (e) => hall.current?.setKey(e.code, false)
    const clear = () => hall.current?.clearKeys() // 다른 창으로 가면 누르던 키를 뗀 것으로
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
      clear()
    }
  }, [hall, active])
}
