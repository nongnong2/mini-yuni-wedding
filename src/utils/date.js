const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// '2027-05-15T12:30:00' → '2027년 5월 15일 토요일 오후 12시 30분'
export function formatDate(iso) {
  const d = new Date(iso)
  const h = d.getHours()
  const m = d.getMinutes()
  const time = `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}시${m ? ` ${m}분` : ''}`
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS[d.getDay()]}요일 ${time}`
}

export { WEEKDAYS }
