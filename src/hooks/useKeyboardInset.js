import { useEffect } from 'react'

// 아이폰은 키보드가 화면을 덮으므로, 가려진 높이를 CSS 변수 --keyboard로 알려 줌
export function useKeyboardInset(ref) {
  useEffect(() => {
    const v = window.visualViewport // 키보드를 뺀, 실제로 보이는 화면
    if (!v) return
    const update = () => {
      const covered = v.scale > 1.01 ? 0 : Math.max(0, window.innerHeight - v.height - v.offsetTop) // 화면을 확대한 경우는 제외
      ref.current?.style.setProperty('--keyboard', `${covered}px`)
    }
    v.addEventListener('resize', update)
    v.addEventListener('scroll', update)
    return () => {
      v.removeEventListener('resize', update)
      v.removeEventListener('scroll', update)
    }
  }, [ref])
}
