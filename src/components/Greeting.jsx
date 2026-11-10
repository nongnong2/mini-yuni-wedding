import Section from './Section'
import { wedding } from '../data/wedding'

export default function Greeting() {
  const { groom, bride, greeting } = wedding
  return (
    <Section>
      <p className="section-title">INVITATION</p>
      <h2 className="section-heading">소중한 분들을 초대합니다</h2>
      <p className="greeting-text">{greeting}</p>

      <div className="parents">
        <p>
          {groom.father} · {groom.mother}<span className="rel">의 {groom.relation}</span>
          <strong>{groom.name}</strong>
        </p>
        <p>
          {bride.father} · {bride.mother}<span className="rel">의 {bride.relation}</span>
          <strong>{bride.name}</strong>
        </p>
      </div>
    </Section>
  )
}
