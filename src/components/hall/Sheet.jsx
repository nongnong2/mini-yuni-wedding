// 아래에서 올라오는 창. 바깥을 누르면 닫힘
export default function Sheet({ onClose, children }) {
  return (
    <div className="hall-sheet" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div>{children}</div>
    </div>
  )
}
