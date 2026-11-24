import Section from './Section'
import { wedding } from '../data/wedding'

export default function OnlineHall({ onEnter }) {
  const { label, title, desc, button } = wedding.onlineHall
  return (
    <Section>
      <p className="section-title">{label}</p>
      <h2 className="section-heading">{title}</h2>
      <p className="greeting-text">{desc}</p>
      <button className="btn hall-enter" onClick={onEnter}>{button}</button>
    </Section>
  )
}
