import { lazy, Suspense } from 'react'
import Cover from './components/Cover'
import Greeting from './components/Greeting'
import Calendar from './components/Calendar'
import Gallery from './components/Gallery'
import Location from './components/Location'
import OnlineHall from './components/OnlineHall'
import Account from './components/Account'
import { wedding } from './data/wedding'
import { useHallRoute } from './hooks/useHallRoute'
import { useToast } from './hooks/useToast'

// lazy: 입장할 때만 3D 홀 코드를 내려받음 → 청첩장 첫 화면은 그대로 가볍게
const HallScreen = lazy(() => import('./components/hall/HallScreen'))

export default function App() {
  const [toast, showToast] = useToast()
  const hall = useHallRoute()

  // 텍스트를 클립보드에 복사
  const copy = async (text) => {
    await navigator.clipboard.writeText(text)
    showToast('복사되었습니다')
  }

  return (
    <main className="invitation">
      <Cover />
      <Greeting />
      <Calendar />
      <Gallery />
      <Location onCopy={copy} />
      <OnlineHall onEnter={hall.open} />
      <Account onCopy={copy} />
      <footer>{wedding.groom.name} ♥ {wedding.bride.name}</footer>
      {hall.isOpen && (
        <Suspense fallback={<div className="hall-loading">온라인 하객석을 여는 중입니다</div>}>
          <HallScreen hidden={hall.isPeeking} onClose={hall.close} onInvite={hall.peek} onToast={showToast} />
        </Suspense>
      )}
      {hall.isPeeking && <button className="hall-back" onClick={hall.back}>하객석으로 돌아가기</button>}
      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}
