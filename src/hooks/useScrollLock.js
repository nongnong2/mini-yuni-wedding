import { useEffect } from 'react'

// active인 동안 뒤쪽 페이지가 스크롤되지 않게 함
export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [active])
}
