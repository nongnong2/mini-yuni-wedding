import { useCallback, useEffect, useRef, useState } from 'react'

// 화면 아래 2초간 뜨는 알림. [문구, 알림 띄우기 함수]
export function useToast() {
  const [toast, setToast] = useState('')
  const timer = useRef(0)
  const showToast = useCallback((text) => {
    clearTimeout(timer.current) // 앞 알림의 타이머가 새 알림을 일찍 지우지 않게
    setToast(text)
    timer.current = setTimeout(() => setToast(''), 2000)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  return [toast, showToast]
}
