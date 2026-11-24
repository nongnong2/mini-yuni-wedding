import { lazy, Suspense, useEffect, useState } from 'react'
import Cover from './components/Cover'
import Greeting from './components/Greeting'
import Calendar from './components/Calendar'
import Gallery from './components/Gallery'
import Location from './components/Location'
import OnlineHall from './components/OnlineHall'
import Account from './components/Account'
import { wedding } from './data/wedding'

// lazy: 입장할 때만 3D 홀 코드를 내려받음 → 청첩장 첫 화면은 그대로 가볍게
const HallScreen = lazy(() => import('./components/HallScreen'))

// 주소 끝: #hall이면 온라인 하객석, #hall-invitation이면 하객석을 잠시 숨기고 청첩장 보기
const HALL = '#hall'
const PEEK = '#hall-invitation'
const clearHash = () => window.history.replaceState(null, '', window.location.pathname + window.location.search)
if (window.location.hash === PEEK) clearHash() // 하객석을 거치지 않고 이 주소로 바로 들어온 경우

export default function App() {
  const [toast, setToast] = useState('') // 화면 아래 잠깐 뜨는 알림 문구

  const [hash, setHash] = useState(window.location.hash)
  const peek = hash === PEEK

  // 알림을 2초간 보여줌
  const showToast = (text) => {
    setToast(text)
    setTimeout(() => setToast(''), 2000)
  }

  // 텍스트를 클립보드에 복사
  const copy = async (text) => {
    await navigator.clipboard.writeText(text)
    showToast('복사되었습니다')
  }

  // 뒤로 가기를 누르면 홀이 닫히도록 주소의 변화를 지켜봄
  useEffect(() => {
    const update = () => {
      setHash(window.location.hash)
      if (window.location.hash === PEEK) window.scrollTo(0, 0) // 청첩장 맨 위부터
    }
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])

  const closeHall = () => {
    clearHash() // 주소에서 #hall만 지움
    setHash('')
  }

  return (
    <main className="invitation">
      <Cover />
      <Greeting />
      <Calendar />
      <Gallery />
      <Location onCopy={copy} />
      <OnlineHall onEnter={() => { window.location.hash = 'hall' }} />
      <Account onCopy={copy} />
      <footer>{wedding.groom.name} ♥ {wedding.bride.name}</footer>
      {(hash === HALL || peek) && (
        <Suspense fallback={<div className="hall hall-loading">온라인 하객석을 여는 중입니다</div>}>
          <HallScreen hidden={peek} onClose={closeHall} onInvite={() => { window.location.hash = PEEK }} onToast={showToast} />
        </Suspense>
      )}
      {peek && <button className="hall-back" onClick={() => window.history.back()}>하객석으로 돌아가기</button>}
      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}
