import './brat.css'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..700;1,400..700&family=Cinzel:wght@500..800&display=swap'
const CODE_URL = 'https://github.com/bmfelix/BRAT'

const WHAT_YOU_SEE = [
  [
    'Now',
    "The big icon is the spell to press right now, with its key binding on it. It comes from Blizzard's own rotation assistant.",
  ],
  [
    'Next and then',
    'Smaller icons show the spells after it, so your hands are ready before the moment comes.',
  ],
  ['Soon', 'A heads-up with a countdown, a few seconds before a stronger spell is ready again.'],
  [
    'Ranks',
    'For spells you charge up, the icon shows how far to charge, such as "R2", based on how many enemies there are.',
  ],
]

const SOURCES = [
  [
    'What it uses',
    'What the top 100 or so players cast, boss by boss and dungeon by dungeon',
    "What Blizzard's assistant picked during your own fights",
  ],
  [
    'Where it lives',
    'Shipped inside the add-on and refreshed with each update',
    'Recorded on your computer as you play',
  ],
  [
    'Best for',
    'Playing the way top players do (the default)',
    'A rotation that fits your own talents',
  ],
]

const HOW_IT_WORKS = [
  [
    'Knows where you are',
    'Each raid boss and Mythic+ dungeon gets its own rotation, with a general raid or dungeon rotation to fall back on. Training dummies count too.',
  ],
  [
    'Counts the enemies',
    'Every rotation is split by how many enemies are nearby, from one to eight or more, counted from their nameplates.',
  ],
  [
    'Works around hidden data',
    'Since the Midnight expansion, the game hides cooldowns from add-ons during combat. BRAT times them itself from your casts and learns how much each spell shortens another.',
  ],
  [
    'Watches glowing buttons',
    'When a proc lights up a spell, BRAT learns how often it should come next, and moves it up when it should.',
  ],
  [
    'Three layers',
    'Recorded fights become averages, and averages become the rotation it serves. Both sources go through the same engine.',
  ],
  [
    'Checks its own work',
    'Every fight is recorded. BRAT scores its guesses against Blizzard and against top players, and calls a spec ready once it matches Blizzard 90% of the time.',
  ],
]

// [spec, class, status, confirmed in game]
const SPECS: [string, 'Priest' | 'Evoker', string, boolean][] = [
  ['Shadow', 'Priest', 'From guides, not yet confirmed in game', false],
  ['Discipline', 'Priest', 'Damage spells only. From guides, not yet confirmed in game', false],
  ['Holy', 'Priest', 'Damage spells only. Confirmed in game', true],
  ['Devastation', 'Evoker', 'From guides and Warcraft Logs, not yet confirmed in game', false],
]

const COMMANDS = [
  ['/brat', 'Opens the settings, where every option is explained'],
  ['/brat check', 'Checks everything BRAT depends on, with a fix for anything wrong'],
  ['/brat why', 'Explains the current suggestion'],
  ['/brat analyze', 'Scores your recorded fights and shows the results'],
  ['/brat source', 'Switches between Warcraft Logs and Learn from Blizzard'],
]

const BUILT_WITH = [
  [
    'Lua',
    'The add-on is written in Lua, the language World of Warcraft add-ons use. Test harnesses run its logic outside the game with LuaJIT.',
  ],
  [
    'PowerShell tools',
    "A data manager downloads top players' fights from Warcraft Logs and writes them into the add-on. Another tool studies your recorded fights on your computer.",
  ],
]

// [slot, element tint, icon, key, rank]
const SLOTS = [
  ['now', 'fire', 'flame', '1', ''],
  ['next', 'arcane', 'bolt', '2', 'R2'],
  ['then', 'holy', 'star', '3', ''],
]

function Panels({ items }: { items: string[][] }) {
  return items.map(([title, text]) => (
    <li className="brat-frame" key={title}>
      <h3>{title}</h3>
      <p>{text}</p>
    </li>
  ))
}

function Icons() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <symbol id="brat-flame" viewBox="0 0 24 24">
        <path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3-1-3 0-6 1-9.5z" />
      </symbol>
      <symbol id="brat-bolt" viewBox="0 0 24 24">
        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
      </symbol>
      <symbol id="brat-star" viewBox="0 0 24 24">
        <path d="m12 2 2.6 6.9 7.4.4-5.6 4.6 1.8 7.1-6.2-3.7-6.2 3.7 1.8-7.1L2 9.3l7.4-.4z" />
      </symbol>
      <symbol id="brat-moon" viewBox="0 0 24 24">
        <path d="M15 3a9 9 0 1 0 6 15A8 8 0 0 1 15 3z" />
      </symbol>
    </svg>
  )
}

export function BratView() {
  return (
    <>
      <link rel="stylesheet" href={FONTS} precedence="default" />
      <div className="brat">
        <div className="brat-embers" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} />
          ))}
        </div>
        <Icons />

        <section className="brat-hero">
          <div>
            <p className="kicker">Side project · World of Warcraft add-on</p>
            <h1>BRAT</h1>
            <p className="brat-tagline">Brad&apos;s Rotation Assistant Technology</p>
            <p className="about-headline">
              In a fight, BRAT shows the spell to press now and the ones coming next, based on what
              the best players do.
            </p>
            <a className="brat-button" href={CODE_URL} rel="noopener" target="_blank">
              View the code
            </a>
          </div>

          <figure className="brat-demo brat-frame">
            <div
              className="brat-bar"
              role="img"
              aria-label="BRAT's display: a large spell icon to press now, two smaller ones for next and then, and one coming off cooldown soon."
            >
              {SLOTS.map(([slot, tint, icon, key, rank]) => (
                <div className={`brat-slot brat-${slot}`} key={slot}>
                  <span className={`brat-icon brat-${tint}`}>
                    <svg>
                      <use href={`#brat-${icon}`} />
                    </svg>
                    <span className="brat-key">{key}</span>
                    {rank && <span className="brat-rank">{rank}</span>}
                  </span>
                  <span className="brat-slot-label">{slot}</span>
                </div>
              ))}
              <div className="brat-slot brat-soon">
                <span className="brat-icon brat-shadow brat-cooldown">
                  <svg>
                    <use href="#brat-moon" />
                  </svg>
                  <span className="brat-count">3</span>
                </span>
                <span className="brat-slot-label">Soon</span>
              </div>
            </div>
            <figcaption>
              A sketch of BRAT in a fight. Key bindings sit in the corner, and &quot;R2&quot; means
              charge the spell to rank 2.
            </figcaption>
          </figure>
        </section>

        <section className="brat-section">
          <h2>What you see</h2>
          <ul className="brat-grid">
            <Panels items={WHAT_YOU_SEE} />
          </ul>
        </section>

        <section className="brat-section">
          <h2>Where the advice comes from</h2>
          <div className="brat-tooltip">
            <table>
              <thead>
                <tr>
                  <th scope="col" />
                  <th scope="col">Warcraft Logs</th>
                  <th scope="col">Learn from Blizzard</th>
                </tr>
              </thead>
              <tbody>
                {SOURCES.map(([label, logs, blizzard]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td>{logs}</td>
                    <td>{blizzard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="brat-note">
            An A/B mode switches source every fight, so the damage from each can be compared.
          </p>
        </section>

        <section className="brat-section">
          <h2>How it works</h2>
          <ul className="brat-grid brat-runes">
            <Panels items={HOW_IT_WORKS} />
          </ul>
        </section>

        <section className="brat-section">
          <h2>Supported specs</h2>
          <div className="brat-tooltip">
            <table>
              <thead>
                <tr>
                  <th scope="col">Spec</th>
                  <th scope="col">Class</th>
                  <th scope="col">Status (patch 12.1.5)</th>
                </tr>
              </thead>
              <tbody>
                {SPECS.map(([spec, className, status, confirmed]) => (
                  <tr key={spec}>
                    <th scope="row">{spec}</th>
                    <td className={`brat-${className.toLowerCase()}`}>{className}</td>
                    <td>
                      <span
                        className={`brat-status ${confirmed ? 'brat-status-ok' : 'brat-status-wip'}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="brat-section">
          <h2>Commands</h2>
          <dl className="brat-chat">
            {COMMANDS.map(([command, text]) => (
              <div key={command}>
                <dt>{command}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="brat-section">
          <h2>How it&apos;s built</h2>
          <ul className="brat-grid">
            <Panels items={BUILT_WITH} />
            <li className="brat-frame">
              <h3>The code</h3>
              <p>BRAT is open source.</p>
              <a className="brat-button" href={CODE_URL} rel="noopener" target="_blank">
                Code
              </a>
            </li>
          </ul>
        </section>
      </div>
    </>
  )
}
