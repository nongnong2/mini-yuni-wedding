import { useState } from 'react'
import { wedding } from '../../data/wedding'
import { LIMITS } from '../../utils/guestbook'
import { AVATARS } from './avatars'
import Sheet from './Sheet'

// 방명록 쓰기. onAvatar가 있으면 캐릭터도 고름 (3D를 못 쓰는 기기)
export default function WriteForm({ defaultName, onPost, onClose, avatar, onAvatar }) {
  const [form, setForm] = useState({ name: defaultName, text: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false) // 저장 중 (두 번 눌러도 한 번만 저장)
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    const data = { name: form.name.trim(), text: form.text.trim(), password: form.password }
    if (!data.name || !data.text) { setError('이름과 축하 글을 모두 적어 주세요.'); return }
    if (data.password.length < LIMITS.password) { setError(`비밀번호는 ${LIMITS.password}자 이상으로 적어 주세요.`); return }
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
    <Sheet onClose={() => { if (!busy) onClose() }}> {/* 저장 중에 바깥을 잘못 눌러 닫히지 않게. 취소는 언제나 가능 */}
      <form className="hall-form" onSubmit={submit}>
        <h2>방명록 쓰기</h2>
        {onAvatar && (
          <div className="hall-row">
            {AVATARS.map(([kind, label]) => (
              <button key={kind} type="button" className="hall-btn" aria-pressed={avatar === kind} onClick={() => onAvatar(kind)}>{label}</button>
            ))}
          </div>
        )}
        <label>이름<input name="name" value={form.name} onChange={change} maxLength={LIMITS.name} autoComplete="off" /></label>
        <label>축하 글<textarea name="text" value={form.text} onChange={change} maxLength={LIMITS.text} placeholder={`${LIMITS.text}자까지`} /></label>
        <label>비밀번호 (글을 지울 때 필요, {LIMITS.password}자 이상)<input name="password" type="password" value={form.password} onChange={change} maxLength={30} autoComplete="new-password" /></label>
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
