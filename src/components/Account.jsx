import { useState } from 'react'
import Section from './Section'
import { wedding } from '../data/wedding'

// 신랑측/신부측 한 묶음: 제목을 누르면 계좌 목록이 펼쳐지는 아코디언
function AccountGroup({ title, list, onCopy }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="account-group">
      <button className="account-toggle" onClick={() => setOpen(!open)}>
        {title}
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && list.map((a) => (
        <div className="account-item" key={a.number}>
          <div>
            <p className="role">{a.role} {a.name}</p>
            <p>{a.bank} {a.number}</p>
          </div>
          <button className="btn" onClick={() => onCopy(`${a.bank} ${a.number}`)}>복사</button>
        </div>
      ))}
    </div>
  )
}

export default function Account({ onCopy }) {
  const { groom, bride } = wedding.accounts
  return (
    <Section>
      <p className="section-title">ACCOUNT</p>
      <h2 className="section-heading">마음 전하실 곳</h2>
      <AccountGroup title="신랑측 계좌번호" list={groom} onCopy={onCopy} />
      <AccountGroup title="신부측 계좌번호" list={bride} onCopy={onCopy} />
    </Section>
  )
}
