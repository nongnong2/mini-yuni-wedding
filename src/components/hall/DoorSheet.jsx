import Sheet from './Sheet'

// 글을 남기지 않고 문 앞에 왔을 때의 안내
export default function DoorSheet({ onClose, onWrite, onPass }) {
  return (
    <Sheet onClose={onClose}>
      <h2>방명록을 먼저 남겨 주세요</h2>
      <p>손님맞이대에서 축하 글을 남기시면 문이 열립니다.</p>
      <div className="hall-row">
        <button className="hall-btn" onClick={onPass}>그냥 둘러보기</button>
        <button className="hall-btn main" onClick={onWrite}>방명록 쓰기</button>
      </div>
    </Sheet>
  )
}
