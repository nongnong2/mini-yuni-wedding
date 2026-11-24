import { wedding } from '../../data/wedding'
import { LIMITS } from '../../utils/guestbook'
import { AVATARS } from './avatars'

// 입장 전: 캐릭터와 이름 고르기
export default function StartCard({ portraits, avatar, onAvatar, name, onName, onEnter }) {
  return (
    <form className="hall-card" onSubmit={(e) => { e.preventDefault(); onEnter() }}>
      <h2>{wedding.onlineHall.welcome}</h2>
      <div className="hall-pick">
        {AVATARS.map(([kind, label]) => (
          <button key={kind} type="button" aria-pressed={avatar === kind} onClick={() => onAvatar(kind)}>
            {portraits[kind] && <img src={portraits[kind]} alt="" />}
            {label}
          </button>
        ))}
      </div>
      <input value={name} onChange={(e) => onName(e.target.value)} maxLength={LIMITS.name} placeholder={`이름 (${LIMITS.name}자까지)`} aria-label="이름" autoComplete="off" />
      <button className="hall-btn main wide">입장하기</button>
    </form>
  )
}
