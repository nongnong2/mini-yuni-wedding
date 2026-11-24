import { useEffect, useRef, useState } from 'react'
import { createHall } from '../hall/scene'
import { wedding } from '../data/wedding'
import { formatDate } from '../utils/date'
import { addMessage, deleteMessage, loadMessages } from '../utils/guestbook'

const AVATARS = [['woman', '여자'], ['man', '남자']]
const STICK_RANGE = 46 // 조이스틱을 끝까지 민 거리(px)
const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

const MODE_NAMES = { stage: '신랑신부', me: '나', whole: '홀 전체' }

// hidden: 청첩장을 보는 동안 잠시 숨김 (있던 자리는 그대로)
export default function HallScreen({ hidden, onClose, onInvite, onToast }) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const knobRef = useRef(null)
  const hall = useRef(null) // createHall이 돌려준 홀
  const drag = useRef(null)
  const [noWebgl, setNoWebgl] = useState(false) // 3D를 못 쓰는 기기
  const [portraits, setPortraits] = useState({})
  const [step, setStep] = useState('start') // start: 캐릭터 고르기, play: 홀 안
  const [where, setWhere] = useState('lobby') // lobby: 예식장 입구, hall: 예식장 안
  const [seated, setSeated] = useState(false)
  const [mode, setMode] = useState('me') // 시점: stage, me, whole
  const [mineId, setMineId] = useState('') // 방금 내가 남긴 글
  const [sheet, setSheet] = useState('') // 열린 창: '', 'write', 'list', 'door'
  const [avatar, setAvatar] = useState('woman')
  const [name, setName] = useState('')
  const [messages, setMessages] = useState([])
  const [loadState, setLoadState] = useState('loading') // loading, ok, error

  // 홀 만들기 (화면이 닫히면 정리)
  useEffect(() => {
    try {
      hall.current = createHall({
        canvas: canvasRef.current,
        overlay: overlayRef.current,
        screen: {
          title: wedding.onlineHall.screenTitle,
          names: `${wedding.groom.name} ♥ ${wedding.bride.name}`,
          date: formatDate(wedding.date),
          photo: wedding.cover,
        },
        labels: { book: wedding.onlineHall.book, door: wedding.onlineHall.door, invite: wedding.onlineHall.invite },
        onBook: () => setSheet('write'),
        onInvite,
        onDoor: () => setSheet('door'),
        onWhere: (next) => { setWhere(next); setSeated(false) },
        onSeat: setSeated,
        onMode: setMode,
      })
      setPortraits(hall.current.portraits)
    } catch {
      setNoWebgl(true) // 3D 대신 글 목록으로
    }
    return () => {
      hall.current?.dispose()
      hall.current = null
    }
  }, [])

  // 아이폰은 키보드가 화면을 덮으므로, 가려진 높이만큼 창을 올림
  useEffect(() => {
    const v = window.visualViewport
    if (!v) return
    const update = () => {
      const covered = v.scale > 1.01 ? 0 : Math.max(0, window.innerHeight - v.height - v.offsetTop) // 화면을 확대한 경우는 제외
      rootRef.current?.style.setProperty('--keyboard', `${covered}px`)
    }
    v.addEventListener('resize', update)
    v.addEventListener('scroll', update)
    return () => {
      v.removeEventListener('resize', update)
      v.removeEventListener('scroll', update)
    }
  }, [])

  // 홀이 보이는 동안에는 뒤쪽 청첩장이 스크롤되지 않게
  useEffect(() => {
    if (hidden) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [hidden])
  useEffect(() => {
    if (!hidden) return
    hall.current?.pause(true)
    return () => hall.current?.pause(false)
  }, [hidden])

  // 방명록 불러오기
  useEffect(() => {
    let alive = true
    loadMessages()
      .then((list) => { if (alive) { setMessages(list); setLoadState('ok') } })
      .catch(() => { if (alive) setLoadState('error') })
    return () => { alive = false }
  }, [])

  useEffect(() => { hall.current?.setMessages(messages) }, [messages])

  // PC 방향키
  useEffect(() => {
    if (step !== 'play' || sheet || hidden) return
    const down = (e) => {
      if (!ARROWS.includes(e.code)) return
      e.preventDefault()
      hall.current?.setKey(e.code, true)
    }
    const up = (e) => hall.current?.setKey(e.code, false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      hall.current?.clearKeys()
    }
  }, [step, sheet, hidden])

  function enter(e) {
    e.preventDefault()
    document.activeElement?.blur() // 휴대폰 키보드 닫기
    hall.current.enter(avatar)
    setStep('play')
  }

  // 조이스틱
  function moveStick(e) {
    const box = e.currentTarget.getBoundingClientRect()
    let x = (e.clientX - box.left - box.width / 2) / STICK_RANGE
    let y = (e.clientY - box.top - box.height / 2) / STICK_RANGE
    const length = Math.hypot(x, y)
    if (length > 1) { x /= length; y /= length }
    hall.current.setStick(x, y)
    knobRef.current.style.transform = `translate(${x * 34}px, ${y * 34}px)`
  }
  function endStick() {
    hall.current?.setStick(0, 0)
    knobRef.current.style.transform = ''
  }

  // 화면: 짧게 누르면 tap, 옆으로 끌면 시점 회전
  function canvasDown(e) {
    drag.current = { x: e.clientX, y: e.clientY, yaw: hall.current?.yaw ?? 0, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function canvasMove(e) {
    const d = drag.current
    if (!d || step !== 'play') return
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) d.moved = true
    if (d.moved) hall.current.setYaw(d.yaw - (e.clientX - d.x) * 0.006)
  }
  function canvasUp(e) {
    if (drag.current && !drag.current.moved) hall.current?.tap(e.clientX, e.clientY)
    drag.current = null
  }

  async function post(form) {
    const message = await addMessage({ ...form, avatar })
    const next = [...messages, message].slice(-100)
    setName(form.name)
    setMessages(next)
    setMineId(message.id)
    setSheet('')
    onToast('방명록을 남겼습니다')
    hall.current?.wrote(message.id)
  }
  async function remove(id, password) {
    await deleteMessage(id, password)
    setMessages((list) => list.filter((m) => m.id !== id))
    onToast('글을 삭제했습니다')
  }

  const wrote = messages.some((m) => m.id === mineId)
  const countText = { loading: '방명록 불러오는 중', ok: `방명록 ${messages.length}개`, error: '방명록을 불러오지 못했습니다' }[loadState]

  return (
    <div ref={rootRef} className="hall" hidden={hidden}>
      <canvas
        ref={canvasRef} className="hall-canvas" aria-label="온라인 웨딩홀"
        onPointerDown={canvasDown} onPointerMove={canvasMove} onPointerUp={canvasUp} onPointerCancel={() => { drag.current = null }}
      />
      <div ref={overlayRef} className="hall-overlay" />

      <div className="hall-top">
        {wedding.groom.name} ♥ {wedding.bride.name}
        <small>{countText}</small>
      </div>
      <div className="hall-bar">
        {!noWebgl && <button className="hall-btn" onClick={() => setSheet('list')}>글만 보기</button>}
        <button className="hall-btn" onClick={onClose}>나가기</button>
      </div>

      {step === 'start' && !noWebgl && (
        <form className="hall-card" onSubmit={enter}>
          <h2>{wedding.onlineHall.welcome}</h2>
          <div className="hall-pick">
            {AVATARS.map(([kind, label]) => (
              <button key={kind} type="button" aria-pressed={avatar === kind} onClick={() => setAvatar(kind)}>
                {portraits[kind] && <img src={portraits[kind]} alt="" />}
                {label}
              </button>
            ))}
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={10} placeholder="이름 (10자까지)" aria-label="이름" autoComplete="off" />
          <button className="hall-btn main wide">입장하기</button>
        </form>
      )}

      {step === 'play' && (
        <>
          {!seated && <p key={where + wrote} className={where === 'lobby' ? 'hall-hint lobby' : 'hall-hint'}>{where === 'hall' ? '바닥을 누르면 걸어가요. 하객을 누르면 글이 보여요' : wrote ? '문을 누르면 예식장으로 들어가요' : '손님맞이대의 방명록을 눌러 보세요'}</p>}
          <div
            className="hall-stick"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); moveStick(e) }}
            onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) moveStick(e) }}
            onPointerUp={endStick} onPointerCancel={endStick}
          >
            <i ref={knobRef} />
          </div>
          {where === 'hall' && <button className="hall-btn hall-invite" onClick={onInvite}>{wedding.onlineHall.invite}</button>}
          {where === 'hall' && (
            <div className="hall-actions">
              {seated
                ? <button className="hall-btn" onClick={() => hall.current.stand()}>일어나기</button>
                : wrote && <button className="hall-btn main" onClick={() => hall.current.sit()}>내 자리에 앉기</button>}
              <button className="hall-btn" onClick={() => hall.current.nextMode()}>시점 전환: {MODE_NAMES[mode]}</button>
              <button className="hall-btn" onClick={() => hall.current.toLobby()}>로비로 나가기</button>
            </div>
          )}
        </>
      )}

      {(sheet === 'list' || (noWebgl && sheet !== 'write')) && (
        <MessageList
          messages={messages} loadState={loadState} onRemove={remove}
          onClose={noWebgl ? onClose : () => setSheet('')} onWrite={noWebgl ? () => setSheet('write') : null}
        />
      )}
      {sheet === 'door' && (
        <Sheet onClose={() => setSheet('')}>
          <h2>방명록을 먼저 남겨 주세요</h2>
          <p>손님맞이대에서 축하 글을 남기시면 문이 열립니다.</p>
          <div className="hall-row">
            <button className="hall-btn" onClick={() => { setSheet(''); hall.current.passDoor() }}>그냥 둘러보기</button>
            <button className="hall-btn main" onClick={() => setSheet('write')}>방명록 쓰기</button>
          </div>
        </Sheet>
      )}
      {sheet === 'write' && <WriteForm defaultName={name} onPost={post} onClose={() => setSheet('')} avatar={avatar} onAvatar={noWebgl ? setAvatar : null} />}
    </div>
  )
}

function Sheet({ onClose, children }) {
  return (
    <div className="hall-sheet" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div>{children}</div>
    </div>
  )
}

function WriteForm({ defaultName, onPost, onClose, avatar, onAvatar }) {
  const [form, setForm] = useState({ name: defaultName, text: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false) // 저장 중 (두 번 눌러도 한 번만 저장)
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    const data = { name: form.name.trim(), text: form.text.trim(), password: form.password }
    if (!data.name || !data.text) { setError('이름과 축하 글을 모두 적어 주세요.'); return }
    if (data.password.length < 6) { setError('비밀번호는 6자 이상으로 적어 주세요.'); return }
    setBusy(true)
    setError('')
    try {
      await onPost(data)
    } catch {
      setError('저장하지 못했습니다. 잠시 후 다시 시도해 주세요.')
      setBusy(false)
    }
  }

  return (
    <Sheet onClose={onClose}>
      <form className="hall-form" onSubmit={submit}>
        <h2>방명록 쓰기</h2>
        {onAvatar && (
          <div className="hall-row">
            {AVATARS.map(([kind, label]) => (
              <button key={kind} type="button" className="hall-btn" aria-pressed={avatar === kind} onClick={() => onAvatar(kind)}>{label}</button>
            ))}
          </div>
        )}
        <label>이름<input name="name" value={form.name} onChange={change} maxLength={10} autoComplete="off" /></label>
        <label>축하 글<textarea name="text" value={form.text} onChange={change} maxLength={200} placeholder="200자까지" /></label>
        <label>비밀번호 (글을 지울 때 필요, 6자 이상)<input name="password" type="password" value={form.password} onChange={change} maxLength={30} autoComplete="new-password" /></label>
        <small>{wedding.onlineHall.notice}</small>
        {error && <p className="hall-error" role="alert">{error}</p>}
        <div className="hall-row">
          <button type="button" className="hall-btn" onClick={onClose}>취소</button>
          <button className="hall-btn main" disabled={busy}>{busy ? '저장 중' : '남기기'}</button>
        </div>
      </form>
    </Sheet>
  )
}

function MessageList({ messages, loadState, onRemove, onClose, onWrite }) {
  const [target, setTarget] = useState('') // 지우려는 글 id
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    try {
      await onRemove(target, password)
      setTarget('')
    } catch (err) {
      setError(err.code === 'permission-denied' ? '비밀번호가 맞지 않습니다.' : '삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }
  function open(id) {
    setTarget(id)
    setPassword('')
    setError('')
  }

  return (
    <Sheet onClose={onClose}>
      <h2>축하 글 {messages.length}개</h2>
      {loadState === 'error' && <p>방명록을 불러오지 못했습니다. 잠시 후 다시 들어와 주세요.</p>}
      {loadState === 'ok' && !messages.length && <p>아직 글이 없습니다. 첫 축하 인사를 남겨 주세요.</p>}
      <ul className="hall-messages">
        {[...messages].reverse().map((m) => (
          <li key={m.id}>
            <b>{m.name}</b>
            <button className="hall-delete" onClick={() => open(m.id)}>삭제</button>
            <p>{m.text}</p>
            {target === m.id && (
              <form className="hall-row" onSubmit={submit}>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="글 비밀번호" aria-label="글 비밀번호" autoComplete="off" />
                <button className="hall-btn">삭제하기</button>
              </form>
            )}
            {target === m.id && error && <p className="hall-error" role="alert">{error}</p>}
          </li>
        ))}
      </ul>
      <div className="hall-row">
        <button className="hall-btn" onClick={onClose}>닫기</button>
        {onWrite && <button className="hall-btn main" onClick={onWrite}>방명록 쓰기</button>}
      </div>
    </Sheet>
  )
}
