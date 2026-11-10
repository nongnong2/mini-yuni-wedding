import Section from './Section'
import { wedding } from '../data/wedding'

export default function Location({ onCopy }) {
  const { venue, transport } = wedding
  const query = encodeURIComponent(venue.address) // 주소를 URL에 넣을 수 있는 형태로 변환

  // 각 지도 앱의 검색 링크 (API 키 없이 동작)
  const maps = [
    { name: '네이버 지도', url: `https://map.naver.com/p/search/${query}` },
    { name: '카카오맵', url: `https://map.kakao.com/link/search/${query}` },
    { name: '티맵', url: `tmap://search?name=${query}` }, // 티맵 앱이 설치된 휴대폰에서만 열림
  ]

  return (
    <Section>
      <p className="section-title">LOCATION</p>
      <h2 className="section-heading">오시는 길</h2>

      <p className="venue-name">{venue.name} {venue.hall}</p>
      <p className="venue-address">{venue.address}<br />Tel. {venue.tel}</p>
      <button className="btn" onClick={() => onCopy(venue.address)}>주소 복사</button>

      <div className="map-buttons">
        {maps.map((m) => (
          <a key={m.name} className="btn" href={m.url} target="_blank" rel="noreferrer">{m.name}</a>
        ))}
      </div>

      <div className="transport">
        {transport.map((t) => (
          <div key={t.title}>
            <h4>{t.title}</h4>
            <p>{t.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}
