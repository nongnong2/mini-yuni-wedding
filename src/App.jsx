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

export default function App() {
  const [toast, setToast] = useState('') // 화면 아래 잠깐 뜨는 알림 문구

  const [hallOpen, setHallOpen] = useState(window.location.hash === '#hall') // 주소 끝이 #hall이면 온라인 홀

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
    const update = () => setHallOpen(window.location.hash === '#hall')
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])

  const closeHall = () => {
    // 주소에서 #hall만 지움
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    setHallOpen(false)
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
      {hallOpen && (
        <Suspense fallback={<div className="hall hall-loading">온라인 하객석을 여는 중입니다</div>}>
          <HallScreen onClose={closeHall} onToast={showToast} />
        </Suspense>
      )}
      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}
