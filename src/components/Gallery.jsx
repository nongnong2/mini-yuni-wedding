import { useEffect, useRef, useState } from 'react'
import Section from './Section'
import { wedding } from '../data/wedding'

export default function Gallery() {
  const photos = wedding.gallery
  const [index, setIndex] = useState(null) // 확대 중인 사진 번호 (null이면 닫힘)
  const touchX = useRef(0)                 // 스와이프 시작 위치

  // % 연산으로 마지막 다음은 처음으로, 처음 이전은 마지막으로 순환
  const prev = () => setIndex((i) => (i - 1 + photos.length) % photos.length)
  const next = () => setIndex((i) => (i + 1) % photos.length)
  const close = () => setIndex(null)

  // 확대 중에는 키보드 ← → Esc 지원 + 뒤 페이지 스크롤 막기
  useEffect(() => {
    if (index === null) return
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [index])

  // 손가락을 50px 이상 좌우로 밀면 사진 넘기기
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchX.current
    if (dx > 50) prev()
    if (dx < -50) next()
  }

  return (
    <Section>
      <p className="section-title">GALLERY</p>
      <h2 className="section-heading">우리의 순간들</h2>

      <div className="gallery-grid">
        {photos.map((src, i) => (
          <img key={src} src={src} alt={`사진 ${i + 1}`} loading="lazy" onClick={() => setIndex(i)} />
        ))}
      </div>

      {index !== null && (
        <div
          className="lightbox"
          onClick={close} // 바깥(검은 배경)을 누르면 닫힘
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={onTouchEnd}
        >
          {/* stopPropagation: 사진·버튼 클릭이 배경 클릭(닫기)으로 번지지 않게 막음 */}
          <img src={photos[index]} alt={`사진 ${index + 1}`} onClick={(e) => e.stopPropagation()} />
          <button className="close" onClick={close} aria-label="닫기">×</button>
          <button className="prev" onClick={(e) => { e.stopPropagation(); prev() }} aria-label="이전">‹</button>
          <button className="next" onClick={(e) => { e.stopPropagation(); next() }} aria-label="다음">›</button>
          <p className="counter">{index + 1} / {photos.length}</p>
        </div>
      )}
    </Section>
  )
}
