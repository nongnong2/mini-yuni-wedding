import { useEffect, useRef, useState } from 'react'

// 화면에 보이기 시작하면 아래에서 위로 부드럽게 나타나는 섹션 상자
export default function Section({ className = '', children }) {
  const ref = useRef(null) // 실제 <section> 요소를 가리키는 참조
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // IntersectionObserver: 요소가 화면 안에 들어왔는지 브라우저가 알려주는 기능
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect() // 한 번 나타나면 더 볼 필요 없음
      }
    }, { threshold: 0.15 })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className={`fade ${visible ? 'visible' : ''} ${className}`}>
      {children}
    </section>
  )
}
