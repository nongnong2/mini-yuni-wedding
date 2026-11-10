import { wedding } from '../data/wedding'
import { formatDate } from '../utils/date'

export default function Cover() {
  const { groom, bride, cover, venue } = wedding
  return (
    <section className="cover">
      <img className="cover-img" src={cover} alt="메인 사진" />
      <h1 className="cover-names">
        {groom.name}<span>♥</span>{bride.name}
      </h1>
      <p className="cover-date">{formatDate(wedding.date)}</p>
      <p className="cover-date">{venue.name} {venue.hall}</p>
    </section>
  )
}
