// 잠깐 보였다 사라지는 안내
export default function Hint({ where, wrote }) {
  const text = where === 'hall'
    ? '바닥을 누르면 걸어가요. 하객을 누르면 글이 보여요'
    : wrote ? '문을 누르면 예식장으로 들어가요' : '바닥을 눌러 걷고, 방명록을 눌러 보세요'
  return <p className={where === 'lobby' ? 'hall-hint lobby' : 'hall-hint'}>{text}</p>
}
