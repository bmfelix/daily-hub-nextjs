import './weather.css'

const CLOUD = 'M13 31h21a8 8 0 0 0 .6-16A11 11 0 0 0 13.4 17 7 7 0 0 0 13 31z'

/** The moving sky behind the page, and the weather icons (used with <use href="#wx-…">). */
export function SkyArt() {
  return (
    <>
      <div className="sky-fx" aria-hidden="true">
        <span className="sun" />
        <span className="cloud cloud-1" />
        <span className="cloud cloud-2" />
        <span className="cloud cloud-3" />
        <span className="precip" />
        <span className="flash" />
      </div>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <symbol id="wx-clear" viewBox="0 0 48 48">
          <circle className="wx-sun" cx="24" cy="24" r="9" />
          <path
            className="wx-rays"
            d="M24 4v6M24 38v6M4 24h6M38 24h6M9.9 9.9l4.2 4.2M33.9 33.9l4.2 4.2M9.9 38.1l4.2-4.2M33.9 14.1l4.2-4.2"
          />
        </symbol>
        <symbol id="wx-cloudy" viewBox="0 0 48 48">
          <circle className="wx-sun" cx="31" cy="15" r="7" />
          <path
            className="wx-cloud"
            d="M13 38h21a8 8 0 0 0 .6-16A11 11 0 0 0 13.4 24 7 7 0 0 0 13 38z"
          />
        </symbol>
        <symbol id="wx-rain" viewBox="0 0 48 48">
          <path className="wx-cloud" d={CLOUD} />
          <path className="wx-drop" d="M17 36l-2 6M25 36l-2 6M33 36l-2 6" />
        </symbol>
        <symbol id="wx-snow" viewBox="0 0 48 48">
          <path className="wx-cloud" d={CLOUD} />
          <circle className="wx-flake" cx="16" cy="38" r="2" />
          <circle className="wx-flake" cx="24" cy="42" r="2" />
          <circle className="wx-flake" cx="32" cy="38" r="2" />
        </symbol>
        <symbol id="wx-storm" viewBox="0 0 48 48">
          <path className="wx-cloud wx-dark" d={CLOUD} />
          <path className="wx-bolt" d="M26 28l-6 9h5l-3 8 9-11h-5l3-6z" />
        </symbol>
        <symbol id="wx-fog" viewBox="0 0 48 48">
          <path
            className="wx-cloud"
            d="M13 29h21a8 8 0 0 0 .6-16A11 11 0 0 0 13.4 15 7 7 0 0 0 13 29z"
          />
          <path className="wx-mist" d="M9 35h30M13 41h22" />
        </symbol>
      </svg>
    </>
  )
}
