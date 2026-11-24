import { useState } from 'react'
import Sheet from './Sheet'

// 글만 보기 (최신 글부터). onWrite가 있으면 쓰기 버튼도 보여줌 (3D를 못 쓰는 기기)
export default function MessageList({ messages, status, onRemove, onClose, onWrite }) {
  const [target, setTarget] = useState('') // 지우려는 글 id
  return (
    <Sheet onClose={onClose}>
      <h2>축하 글 {messages.length}개</h2>
      {status === 'error' && <p>방명록을 불러오지 못했습니다. 잠시 후 다시 들어와 주세요.</p>}
      {status === 'ok' && !messages.length && <p>아직 글이 없습니다. 첫 축하 인사를 남겨 주세요.</p>}
      <ul className="hall-messages">
        {[...messages].reverse().map((m) => (
          <li key={m.id}>
            <b>{m.name}</b>
            <button className="hall-delete" onClick={() => setTarget(m.id)}>삭제</button>
            <p>{m.text}</p>
            {target === m.id && <DeleteForm onRemove={(password) => onRemove(m.id, password)} />}
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

function DeleteForm({ onRemove }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await onRemove(password) // 지워지면 이 글과 함께 이 칸도 사라짐
    } catch (err) {
      setError(err.code === 'permission-denied' ? '비밀번호가 맞지 않습니다.' : '삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.')
      setPassword('') // 다시 적을 수 있게 비움
      setBusy(false)
    }
  }

  return (
    <>
      <form className="hall-row" onSubmit={submit}>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="글 비밀번호" aria-label="글 비밀번호" autoComplete="off" />
        <button className="hall-btn" disabled={busy}>삭제하기</button>
      </form>
      {error && <p className="hall-error" role="alert">{error}</p>}
    </>
  )
}
