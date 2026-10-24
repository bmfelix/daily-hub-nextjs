# Daily Hub · Next.js + Payload CMS

A personal dashboard. Each menu link is one module, and each module is one class that calls its own API or database collection.

This is one of three builds of the same app (Django, Next.js, Laravel), so the frameworks can be compared side by side.

[Payload](https://payloadcms.com) runs inside the same Next.js app. It provides the admin area at `/admin` and stores data in Postgres. It does two jobs here:

1. **Data layer for modules.** To-do and Notes save to the Payload `tasks` and `notes` collections.
2. **Headless CMS, like WordPress pages.** The `pages` collection holds editable pages with rich text, drafts, and a "Show in menu" switch. A published page appears at `/<slug>` and, if switched on, in the menu.

## Modules

| Page     | Class            | Data source                                   |
|----------|------------------|-----------------------------------------------|
| Weather  | `WeatherModule`  | [Open-Meteo](https://open-meteo.com) (no key) |
| News     | `NewsModule`     | [Hacker News search API](https://hn.algolia.com/api) (no key) |
| To-do    | `TodoModule`     | Payload `tasks` collection                    |
| Currency | `CurrencyModule` | [Frankfurter](https://frankfurter.dev) (no key) |
| Notes    | `NotesModule`    | Payload `notes` collection                    |
| Radio    | `RadioModule`    | [iHeartRadio](https://www.iheart.com) song history (WEBN) and [Triton Digital](https://www.tritondigital.com) now-playing feed (WKRQ), no keys |

Modules can also give the homepage a live card instead of their summary. The Radio card shows the song playing now on each station. WEBN's newest song can appear about a minute after it starts, so its card may briefly say "Last played".

## How it is built

- `src/modules/HubModule.ts` defines the abstract `HubModule` class. Each module subclass returns its page data from `load()` and names a React server component (`View`) that renders it.
- API modules keep HTTP calls in a client class (for example `OpenMeteoClient`) passed to the constructor. Tests pass a fake instead, so they run without the internet.
- To-do and Notes write through Next.js server actions that call Payload's Local API (no HTTP round trip).
- `src/modules/index.ts` holds the `MODULES` list. The menu, the homepage cards, and the routes are built from it. `src/app/(frontend)/[slug]/page.tsx` renders a module if the slug matches one, otherwise a published CMS page.
- To add a module: write the class and its view, add an instance to `MODULES`, and add its slug to `src/modules/slugs.ts` (this stops a CMS page from taking the same address).
- The menu collapses into a "Menu" button below 640px wide.

## Live updates

The Radio card on the homepage updates without a reload, using only Postgres (no extra servers):

1. The **listener** container (`src/listener/radio.ts`) asks both stations for their song every 15 seconds. The feeds cannot be subscribed to, so it polls.
2. When a song changes (or the current song ends), it sends the card data with Postgres `NOTIFY radio_updates`.
3. Each web server process holds one `LISTEN radio_updates` connection (`src/lib/radioUpdates.ts`) and passes every message to the open browser streams.
4. The homepage card (`LiveRadioCard`) keeps a **Server-Sent Events** connection to `/live/radio` and re-renders when a message arrives. The browser reconnects by itself if the stream drops.

## Run with Docker

1. `cp .env.example .env`, then set `PAYLOAD_SECRET`, `POSTGRES_PASSWORD`, and the same password inside `DATABASE_URL`.
2. `docker compose up -d --build` (the first build takes several minutes).
3. Open http://localhost:3001
4. Open http://localhost:3001/admin and create the first admin user.

Database migrations in `src/migrations/` run automatically when the server starts.

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

Next.js 16.4 · React 19.3 · Payload 3.92 · TypeScript · Node 24 · Postgres 17 (data and LISTEN/NOTIFY) · Server-Sent Events · Docker Compose
