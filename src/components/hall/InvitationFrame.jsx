import { useEffect } from 'react'
import { onAskToClose } from '../../utils/embed'

// 청첩장 주소. 뒤의 ?from=hall은 브라우저가 '자기 자신을 또 띄우는 것'으로 보고 막지 않게 붙임 (내용은 같음)
const ADDRESS = `${window.location.pathname}?from=hall`

// 하객석에서 보는 모바일 청첩장. 청첩장 주소를 그대로 불러옴
export default function InvitationFrame({ onBack }) {
  useEffect(() => onAskToClose(onBack), [onBack])
  return (
    <div className="hall-frame">
      <iframe src={ADDRESS} title="모바일 청첩장" allow="clipboard-write" />
      <div className="hall-frame-bar">
        <button className="hall-frame-back" onClick={onBack}>하객석으로 돌아가기</button>
      </div>
    </div>
  )
}
