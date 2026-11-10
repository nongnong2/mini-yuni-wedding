import { useState } from 'react'
import Cover from './components/Cover'
import Greeting from './components/Greeting'
import Calendar from './components/Calendar'
import Gallery from './components/Gallery'

export default function App() {
  const [toast, setToast] = useState('') // 화면 아래 잠깐 뜨는 알림 문구

  // 텍스트를 클립보드에 복사하고 알림을 2초간 보여줌
  const copy = async (text) => {
    await navigator.clipboard.writeText(text)
    setToast('복사되었습니다')
    setTimeout(() => setToast(''), 2000)
  }

  return (
    <main className="invitation">
      <Cover />
      <Greeting />
      <Calendar />
      <Gallery />
      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}
