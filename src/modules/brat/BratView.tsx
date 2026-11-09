const ON_SCREEN = [
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

const SPECS = [
  ['Shadow', 'Priest', 'From guides, not yet confirmed in game'],
  ['Discipline', 'Priest', 'Damage spells only. From guides, not yet confirmed in game'],
  ['Holy', 'Priest', 'Damage spells only. Confirmed in game'],
  ['Devastation', 'Evoker', 'From guides and Warcraft Logs, not yet confirmed in game'],
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

function Panels({ items }: { items: string[][] }) {
  return items.map(([title, text]) => (
    <li className="panel" key={title}>
      <h3>{title}</h3>
      <p>{text}</p>
    </li>
  ))
}

function Rows({ rows }: { rows: string[][] }) {
  return rows.map(([label, ...cells]) => (
    <tr key={label}>
      <th scope="row">{label}</th>
      {cells.map((cell, i) => (
        <td key={i}>{cell}</td>
      ))}
    </tr>
  ))
}

export function BratView() {
  return (
    <>
      <p className="kicker">Side project · World of Warcraft</p>
      <h1>BRAT</h1>

      <p className="about-headline">
        Brad&apos;s Rotation Assistant Technology is a World of Warcraft add-on. In a fight, it
        shows the spell to press now and the ones coming next, based on what the best players do.
      </p>

      <section className="artist-section about-section">
        <h2>On screen</h2>
        <ul className="project-list">
          <Panels items={ON_SCREEN} />
        </ul>
      </section>

      <section className="artist-section about-section">
        <h2>Where the advice comes from</h2>
        <div className="table-scroll">
          <table className="compare">
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col">Warcraft Logs</th>
                <th scope="col">Learn from Blizzard</th>
              </tr>
            </thead>
            <tbody>
              <Rows rows={SOURCES} />
            </tbody>
          </table>
        </div>
        <p className="meta">
          An A/B mode switches source every fight, so the damage from each can be compared.
        </p>
      </section>

      <section className="artist-section about-section">
        <h2>How it works</h2>
        <ul className="project-list">
          <Panels items={HOW_IT_WORKS} />
        </ul>
      </section>

      <section className="artist-section about-section">
        <h2>Supported specs</h2>
        <div className="table-scroll">
          <table className="compare">
            <thead>
              <tr>
                <th scope="col">Spec</th>
                <th scope="col">Class</th>
                <th scope="col">Status (patch 12.1.5)</th>
              </tr>
            </thead>
            <tbody>
              <Rows rows={SPECS} />
            </tbody>
          </table>
        </div>
      </section>

      <section className="artist-section about-section">
        <h2>Commands</h2>
        <div className="table-scroll">
          <table className="compare">
            <tbody>
              <Rows rows={COMMANDS} />
            </tbody>
          </table>
        </div>
      </section>

      <section className="artist-section about-section">
        <h2>How it&apos;s built</h2>
        <ul className="project-list">
          <Panels items={BUILT_WITH} />
          <li className="panel">
            <h3>The code</h3>
            <p>BRAT is open source.</p>
            <p className="project-links">
              <a href="https://github.com/bmfelix/BRAT" rel="noopener" target="_blank">
                Code
              </a>
            </p>
          </li>
        </ul>
      </section>
    </>
  )
}
