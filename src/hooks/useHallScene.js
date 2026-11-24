import { useEffect, useRef, useState } from 'react'
import { wedding } from '../data/wedding'
import { createHall } from '../hall'
import { formatDate } from '../utils/date'

// 3D 하객석을 만들고, 화면이 닫히면 정리함.
// hall.current: createHall이 돌려준 것 (3D를 못 쓰면 null), scene: 화면에 필요한 3D의 상태
export function useHallScene({ canvasRef, overlayRef, messages, hidden, onBook, onDoor, onInvite }) {
  const hall = useRef(null)
  const [supported, setSupported] = useState(true) // 3D를 쓸 수 있는 기기인지
  const [portraits, setPortraits] = useState({}) // 캐릭터 그림 { woman, man }
  const [where, setWhere] = useState('lobby') // lobby: 예식장 입구, hall: 예식장 안
  const [seated, setSeated] = useState(false)
  const [mode, setMode] = useState('me') // 시점: stage, me, whole

  // 3D는 한 번만 만들고, 부를 함수는 항상 최신 것을 씀
  const handlers = useRef({})
  useEffect(() => { handlers.current = { onBook, onDoor, onInvite } })

  useEffect(() => {
    const { onlineHall, groom, bride, date, cover } = wedding
    try {
      hall.current = createHall({
        canvas: canvasRef.current,
        overlay: overlayRef.current,
        screen: { title: onlineHall.screenTitle, names: `${groom.name} ♥ ${bride.name}`, date: formatDate(date), photo: cover },
        labels: { book: onlineHall.book, door: onlineHall.door, invite: onlineHall.invite },
        on: {
          book: () => handlers.current.onBook(),
          door: () => handlers.current.onDoor(),
          invite: () => handlers.current.onInvite(),
          where: (next) => { setWhere(next); setSeated(false) },
          seat: setSeated,
          mode: setMode,
        },
      })
      setPortraits(hall.current.portraits)
    } catch (error) {
      console.error(error)
      setSupported(false) // 3D 대신 글 목록으로
    }
    return () => {
      hall.current?.dispose()
      hall.current = null
    }
  }, [canvasRef, overlayRef])

  useEffect(() => { hall.current?.setMessages(messages) }, [messages])

  useEffect(() => {
    if (!hidden) return
    hall.current?.pause(true)
    return () => hall.current?.pause(false)
  }, [hidden])

  return { hall, supported, portraits, where, seated, mode }
}
