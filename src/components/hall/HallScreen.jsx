import { useRef, useState } from 'react'
import { useArrowKeys } from '../../hooks/useArrowKeys'
import { useGuestbook } from '../../hooks/useGuestbook'
import { useHallScene } from '../../hooks/useHallScene'
import { useKeyboardInset } from '../../hooks/useKeyboardInset'
import { useScrollLock } from '../../hooks/useScrollLock'
import '../../styles/hall.css'
import DoorSheet from './DoorSheet'
import HallActions from './HallActions'
import HallCanvas from './HallCanvas'
import HallTop from './HallTop'
import Hint from './Hint'
import Joystick from './Joystick'
import MessageList from './MessageList'
import StartCard from './StartCard'
import WriteForm from './WriteForm'

// 온라인 하객석 전체 화면. 각 부품을 모아 상태를 이어 주는 곳.
// hidden: 청첩장을 보는 동안 잠시 숨김 (있던 자리는 그대로)
export default function HallScreen({ hidden, onClose, onInvite, onToast }) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const [entered, setEntered] = useState(false) // 캐릭터를 골라 입장했는지
  const [sheet, setSheet] = useState('') // 열린 창: '', 'write', 'list', 'door'
  const [avatar, setAvatar] = useState('woman')
  const [name, setName] = useState('')
  const [mineId, setMineId] = useState('') // 방금 내가 남긴 글
  const closeSheet = () => setSheet('')

  const guestbook = useGuestbook()
  const { messages } = guestbook
  const { hall, supported, portraits, where, seated, mode } = useHallScene({
    canvasRef, overlayRef, messages, hidden, onInvite,
    onBook: () => setSheet('write'),
    onDoor: () => setSheet('door'),
  })
  useKeyboardInset(rootRef)
  useScrollLock(!hidden)
  useArrowKeys(hall, entered && !sheet && !hidden)

  const wrote = messages.some((m) => m.id === mineId)

  function enter() {
    document.activeElement?.blur() // 휴대폰 키보드 닫기
    hall.current.enter(avatar)
    setEntered(true)
  }
  async function post(form) {
    const message = await guestbook.add({ ...form, avatar })
    setName(form.name)
    setMineId(message.id)
    closeSheet()
    onToast('방명록을 남겼습니다')
    hall.current?.wrote(message.id)
  }
  async function remove(id, password) {
    await guestbook.remove(id, password)
    onToast('글을 삭제했습니다')
  }

  return (
    <div ref={rootRef} className="hall" hidden={hidden}>
      <HallCanvas hall={hall} canvasRef={canvasRef} overlayRef={overlayRef} canTurn={entered} />
      <HallTop count={messages.length} status={guestbook.status} onList={supported ? () => setSheet('list') : null} onClose={onClose} />

      {supported && !entered && (
        <StartCard portraits={portraits} avatar={avatar} onAvatar={setAvatar} name={name} onName={setName} onEnter={enter} />
      )}
      {entered && (
        <>
          {!seated && <Hint key={where + wrote} where={where} wrote={wrote} />}
          <Joystick onMove={(x, y) => hall.current?.setStick(x, y)} />
          {where === 'hall' && <HallActions hall={hall} wrote={wrote} seated={seated} mode={mode} onInvite={onInvite} />}
        </>
      )}

      {(sheet === 'list' || (!supported && sheet !== 'write')) && (
        <MessageList
          messages={messages} status={guestbook.status} onRemove={remove}
          onClose={supported ? closeSheet : onClose} onWrite={supported ? null : () => setSheet('write')}
        />
      )}
      {sheet === 'door' && (
        <DoorSheet onClose={closeSheet} onWrite={() => setSheet('write')} onPass={() => { closeSheet(); hall.current.passDoor() }} />
      )}
      {sheet === 'write' && (
        <WriteForm defaultName={name} onPost={post} onClose={closeSheet} avatar={avatar} onAvatar={supported ? null : setAvatar} />
      )}
    </div>
  )
}
