# Daily Hub · Next.js + Payload CMS

A personal dashboard. Each menu link is one module, and each module is one class that calls its own API or database collection.

This is one of three builds of the same app (Django, Next.js, Laravel), so the frameworks can be compared side by side.

[Payload](https://payloadcms.com) runs inside the same Next.js app. It provides the admin area at `/admin` and stores data in Postgres. It does two jobs here:

1. **Data layer for modules.** To-do, Notes, artists, songs, and radio plays are all Payload collections.
2. **Headless CMS, like WordPress pages.** The `pages` collection holds editable pages with rich text, drafts, and a "Show in menu" switch. A published page appears at `/<slug>` and, if switched on, in the menu.

## Modules

| Page     | Class            | Data source                                   |
|----------|------------------|-----------------------------------------------|
| Weather  | `WeatherModule`  | [Open-Meteo](https://open-meteo.com) (no key) |
| News     | `NewsModule`     | [Hacker News search API](https://hn.algolia.com/api) (no key) |
| To-do    | `TodoModule`     | Payload `tasks` collection                    |
| Concerts | `ConcertsModule` | [Ticketmaster Discovery API](https://developer.ticketmaster.com) (free key) |
| Notes    | `NotesModule`    | Payload `notes` collection                    |
| Radio    | `RadioModule`    | [iHeartRadio](https://www.iheart.com) song history (WEBN) and [Triton Digital](https://www.tritondigital.com) now-playing feed (WKRQ), no keys |
| Charts   | `ChartsModule`   | Payload `plays` collection |
| Agenda   | `AgendaModule`   | Google or Apple calendar links |
| Listening | `ListeningModule` | [Spotify Web API](https://developer.spotify.com/documentation/web-api) (your own app) |
| About    | `AboutModule`    | `src/modules/about/profile.ts`, [GitHub API](https://docs.github.com/rest) (no key) |
| How it's built | `BuiltModule` | Written by hand, linked from the footer |

Modules can also give the homepage a live card instead of their summary. Each station has its own card showing the song on air, with **Listen live** and a song preview. WEBN's newest song can appear about a minute after it starts, so its card may briefly say "Last played".

## How it is built

- `src/modules/HubModule.ts` defines the abstract `HubModule` class. Each module subclass returns its page data from `load()` and names a React server component (`View`) that renders it.
- API modules keep HTTP calls in a client class (for example `OpenMeteoClient`) passed to the constructor. Tests pass a fake instead, so they run without the internet.
- To-do and Notes write through Next.js server actions that call Payload's Local API (no HTTP round trip).
- `src/modules/index.ts` holds the `MODULES` list. The menu, the homepage cards, and the routes are built from it. `src/app/(frontend)/[slug]/page.tsx` renders a module if the slug matches one, otherwise a published CMS page.
- To add a module: write the class and its view, add an instance to `MODULES`, and add its slug to `src/modules/slugs.ts` (this stops a CMS page from taking the same address).
- The menu collapses into a "Menu" button below 1040px wide.

## Live updates

The station cards on the homepage update without a reload, using only Postgres (no extra servers):

1. The **listener** container (`src/listener/radio.ts`) asks both stations for their song every 15 seconds. The feeds cannot be subscribed to, so it polls.
2. When a song changes (or the current song ends), it sends the card data with Postgres `NOTIFY radio_updates`.
3. Each web server process holds one `LISTEN radio_updates` connection (`src/lib/radioUpdates.ts`) and passes every message to the open browser streams.
4. The homepage (`LiveRadioCard`) keeps a **Server-Sent Events** connection to `/live/radio`. A message means something changed, so it fetches fresh cards from `/live/card`, which include saved artwork and previews. The browser reconnects by itself if the stream drops.

Slow homepage cards stream in with React `Suspense`, so an outside service never holds up the page. The weather card runs in the browser, because only the browser knows where the visitor is.

## Artist pages

Click an artist on the homepage card or the Radio page to see everything MusicBrainz has on them: photo, origin, active years, rating, genres, members (with roles and years), the full discography with cover art, links (listen, official, social, concerts, buy, reference), aliases, related artists, and identifiers.

- **Fetched once, then saved** in two Payload collections: `artists` (the full MusicBrainz record and every release) and `artist-names` (which radio name matched which artist, including names with no match). Both are visible in the admin. Saved artists are refreshed after 30 days; unmatched names are retried after 7.
- **Fetched ahead of time.** The listener posts the artists on air to `/artists/prefetch` (protected by `PAYLOAD_SECRET`), and the website looks them up, so most clicks open instantly.
- **Loading screen.** `src/app/(frontend)/artists/loading.tsx` shows a "please wait" overlay during navigation. It fades in after 0.25 seconds, so saved artists never flash it.
- **Polite to MusicBrainz** (`src/lib/musicbrainz/client.ts`): every request names the app and a contact address, requests are queued at least 1.1 seconds apart, and a "slow down" reply (503) is retried once.
- **Careful matching** (`src/lib/musicbrainz/names.ts`): a result must match the name or an alias. For "A [+] B" or "A, B & C", the full name is tried first, then the first artist.

## Music and portfolio pages

- **Artist names** are searched by alias as well as name, so "Matchbox 20" finds Matchbox Twenty.
- **Artist pages** add Wikipedia text and photos. Covers come from the Cover Art Archive, then Apple. Wikipedia's album covers are non-free, so they are not used.
- **Song previews** use Apple, then Deezer. Deezer addresses expire within minutes, so only the track ID is saved and a fresh address is fetched when someone presses play. Google Play Music closed in 2020, and Spotify stopped giving new apps previews in 2024, so Spotify and YouTube Music are search links.
- **Listen live** plays each station directly from iHeart or Triton, including its ads.
- **Charts** counts every play the listener hears, per station and per week.
- **Concerts** lists Cincinnati, Dayton, and Columbus shows. Set `TICKETMASTER_API_KEY` in `.env`.
- **Agenda** reads iCal calendar links from `CALENDAR_URLS`, separated by commas. It is public on this build, because there is no login, so only add calendars you are happy to share.
- **Spotify** on the homepage shows playlists from `SPOTIFY_PLAYLIST_URL` (several, separated by commas) and what is playing, with top artists and tracks on the Listening page.

To-dos and notes can be changed by anyone who can reach the site, and the About page is edited in `src/modules/about/profile.ts`. Payload's own admin is left as it was and nothing here depends on it.

The listener has no database access for these features: it calls `/live/sync` on the website, which saves plays and looks up a few songs and artists each time.

To connect Spotify, add `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` to `.env`, add `http://127.0.0.1:3001/spotify/callback` as a redirect URI on your Spotify app, then open `http://127.0.0.1:3001/spotify/connect?key=` followed by your `SPOTIFY_CONNECT_KEY`.

## Keys and links

Everything here is optional. A feature without its setting explains itself on the page.

| Setting | Used for | Where to get it |
|---------|----------|-----------------|
| `SPOTIFY_PLAYLIST_URL` | The Spotify player on the homepage. Separate several with commas. | The share link of a public playlist |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | What is playing, and the Listening page | [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard). The app owner needs Spotify Premium. |
| `SPOTIFY_REDIRECT_URI` | Where Spotify returns after you connect | Add the same address to your Spotify app. Spotify does not accept `localhost`. |
| `TICKETMASTER_API_KEY` | Concerts | [developer.ticketmaster.com](https://developer.ticketmaster.com/) (the Consumer Key) |
| `CALENDAR_URLS` | Agenda. Separate several with commas. | Google: Settings > your calendar > Integrate calendar > **Secret address in iCal format**. Apple: turn on **Public Calendar**, then copy its share link. |
| `GITHUB_USERNAME` | Recent work on the About page | Your GitHub username |

Treat calendar links like passwords: anyone who has one can read that calendar.

## Design

All three builds share one look: a dark page with stage lights sweeping behind see-through cards, drifting music notes, and an equalizer under the current menu item. The homepage cards are numbered like the sides of an album. Fonts are Bricolage Grotesque, Instrument Sans, and Martian Mono from Google Fonts. Animations stop for visitors who ask their device to reduce motion.

## Run with Docker

1. `cp .env.example .env`, then set `PAYLOAD_SECRET`, `POSTGRES_PASSWORD`, and the same password inside `DATABASE_URL`.
2. `docker compose up -d --build` (the first build takes several minutes).
3. Open http://localhost:3001
4. Optional: open http://localhost:3001/admin and create an admin user to write CMS pages. Nothing else needs one.

Database migrations in `src/migrations/` run automatically when the server starts.

To reach it over HTTPS on your own devices with Tailscale: `tailscale serve --bg --https=3001 http://127.0.0.1:3001`.

Stop it with `docker compose down`.

## Tests

Unit tests (no database):

```sh
docker run --rm -v "$PWD":/app -v dhn_node_modules:/app/node_modules -w /app node:24-alpine \
  sh -c "npm ci && npm run test:unit"
```

Integration tests need a **separate** database, because they delete all tasks, notes, and pages:

```sh
docker compose exec db psql -U dailyhub -d dailyhub -c "CREATE DATABASE dailyhub_test"
docker run --rm --network daily-hub-nextjs_default --env-file .env \
  -e DATABASE_URL="postgres://dailyhub:<password>@db:5432/dailyhub_test" \
  -v "$PWD":/app -v dhn_node_modules:/app/node_modules -w /app node:24-alpine \
  sh -c "npm ci && npm run test:int"
```

## Changing collections

After editing a collection in `src/collections/`, regenerate types and create a migration (with the database running):

```sh
docker run --rm --network daily-hub-nextjs_default --env-file .env \
  -v "$PWD":/app -v dhn_node_modules:/app/node_modules -w /app node:24-alpine \
  sh -c "npx payload generate:types && npx payload migrate:create <name>"
```

## Stack

Next.js 16.4 · React 19.3 · Payload 3.92 · TypeScript · Node 24 · Postgres 17 (data and LISTEN/NOTIFY) · Server-Sent Events · ical-expander · Docker Compose
