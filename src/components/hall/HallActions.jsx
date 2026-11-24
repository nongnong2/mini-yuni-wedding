import { wedding } from '../../data/wedding'

const MODE_NAMES = { stage: '신랑신부', me: '나', whole: '홀 전체' }

// 예식장 안에서 쓰는 버튼들
export default function HallActions({ hall, wrote, seated, mode, onInvite }) {
  return (
    <>
      <button className="hall-btn hall-invite" onClick={onInvite}>{wedding.onlineHall.invite}</button>
      <div className="hall-actions">
        {seated && <button className="hall-btn" onClick={() => hall.current.stand()}>일어나기</button>}
        {!seated && wrote && <button className="hall-btn main" onClick={() => hall.current.sit()}>내 자리에 앉기</button>}
        <button className="hall-btn" onClick={() => hall.current.nextMode()}>시점 전환: {MODE_NAMES[mode]}</button>
        <button className="hall-btn" onClick={() => hall.current.toLobby()}>로비로 나가기</button>
      </div>
    </>
  )
}
