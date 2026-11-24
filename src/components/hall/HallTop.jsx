import { wedding } from '../../data/wedding'

// 위쪽: 이름과 글 수, 버튼
export default function HallTop({ count, status, onList, onClose }) {
  const countText = { loading: '방명록 불러오는 중', ok: `방명록 ${count}개`, error: '방명록을 불러오지 못했습니다' }[status]
  return (
    <>
      <div className="hall-top">
        {wedding.groom.name} ♥ {wedding.bride.name}
        <small>{countText}</small>
      </div>
      <div className="hall-bar">
        {onList && <button className="hall-btn" onClick={onList}>글만 보기</button>}
        <button className="hall-btn" onClick={onClose}>나가기</button>
      </div>
    </>
  )
}
