import './radio.css'

const LCD_FONT = 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap'

/** The radio look's stylesheet, font, and broadcast tower. Used by the Radio and Charts pages. */
export function Airwaves() {
  return (
    <>
      <link rel="stylesheet" href={LCD_FONT} precedence="default" />
      <div className="airwaves" aria-hidden="true">
        <span className="wave" />
        <span className="wave" />
        <span className="wave" />
        <svg viewBox="0 0 90 160">
          <path d="M45 14 18 158M45 14l27 144M37 52h16M31 86h28M25 120h40M37 52l22 34M53 52 31 86M31 86l34 34M59 86 25 120" />
          <circle cx="45" cy="10" r="5" />
        </svg>
      </div>
    </>
  )
}
