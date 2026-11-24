import { useCallback, useEffect, useState } from 'react'

// 주소 끝: #hall이면 온라인 하객석, #hall-invitation이면 하객석을 잠시 숨기고 청첩장 보기
const HALL = '#hall'
const PEEK = '#hall-invitation'

function clearHash() {
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}
if (window.location.hash === PEEK) clearHash() // 하객석을 거치지 않고 이 주소로 바로 들어온 경우

// 주소를 바꾸는 방식이라 휴대폰의 뒤로 가기가 자연스럽게 동작함
export function useHallRoute() {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const update = () => {
      setHash(window.location.hash)
      if (window.location.hash === PEEK) window.scrollTo(0, 0) // 청첩장 맨 위부터
    }
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])

  const open = useCallback(() => { window.location.hash = HALL }, [])
  const peek = useCallback(() => { window.location.hash = PEEK }, [])
  const back = useCallback(() => window.history.back(), [])
  const close = useCallback(() => { clearHash(); setHash('') }, [])
  return { isOpen: hash === HALL || hash === PEEK, isPeeking: hash === PEEK, open, peek, back, close }
}
