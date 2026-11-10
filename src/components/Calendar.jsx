import Section from './Section'
import { wedding } from '../data/wedding'
import { formatDate, WEEKDAYS } from '../utils/date'

const DAY_MS = 24 * 60 * 60 * 1000 // 하루를 밀리초로

export default function Calendar() {
  const date = new Date(wedding.date)
  const year = date.getFullYear()
  const month = date.getMonth() // 0 = 1월

  const firstWeekday = new Date(year, month, 1).getDay()     // 1일이 무슨 요일인지 (0=일)
  const daysInMonth = new Date(year, month + 1, 0).getDate() // 다음 달 0일 = 이번 달 마지막 날

  // 1일 앞쪽은 빈칸(null)으로 채워서 요일 위치를 맞춤
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // D-day: 시간은 빼고 날짜끼리만 비교
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weddingDay = new Date(year, month, date.getDate())
  const diff = Math.round((weddingDay - today) / DAY_MS)
  const ddayText =
    diff > 0 ? <>결혼식까지 <strong>{diff}일</strong> 남았습니다</>
    : diff === 0 ? <><strong>오늘</strong> 결혼합니다</>
    : <>결혼한 지 <strong>{-diff}일</strong> 되었습니다</>

  return (
    <Section>
      <p className="section-title">WEDDING DAY</p>
      <h2 className="section-heading">{formatDate(wedding.date)}</h2>

      <div className="calendar">
        <p className="calendar-month">{month + 1}월</p>
        <div className="calendar-grid">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`weekday ${i === 0 ? 'sun' : ''}`}>{w}</div>
          ))}
          {cells.map((day, i) => (
            <div
              key={i}
              className={`day ${i % 7 === 0 ? 'sun' : ''} ${day === date.getDate() ? 'wedding-day' : ''}`}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      <p className="dday">{ddayText}</p>
    </Section>
  )
}
