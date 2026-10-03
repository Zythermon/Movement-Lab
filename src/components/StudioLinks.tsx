import { brand } from '../brand'

export function StudioLinks() {
  return (
    <footer className="studio">
      <p className="studio-kicker">{brand.lines.join(' · ')}</p>
      <p>
        <a href={brand.maps} target="_blank" rel="noreferrer">
          {brand.location}
        </a>
        <span> · {brand.address}</span>
      </p>
      <p>
        <a href={`tel:${brand.phoneTel}`}>{brand.phoneDisplay}</a>
        <span> · </span>
        <a href={brand.instagram} target="_blank" rel="noreferrer">
          {brand.handle}
        </a>
      </p>
    </footer>
  )
}
