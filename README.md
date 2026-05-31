# ucms

A lightweight, self-hostable content management system for small organizations: clubs, parishes, and local businesses that want a simple website without hiring a developer.

You get a public site with pages and a news feed, and an admin area to edit everything. Content is written in Markdown with a live preview. The first account you create becomes the administrator, and public sign-up is closed after that.

## Features

- Pages with custom slugs, navigation control, and draft/published states
- News posts with a public feed and individual post pages
- Markdown editing with live preview
- Site settings (name, tagline, description, footer, contact email)
- Email and password authentication
- Light and dark mode
- Single Docker image, runs anywhere

## Tech stack

TanStack Start (React) and TanStack Router, oRPC for the type-safe API, Drizzle ORM on PostgreSQL, better-auth for sessions, Tailwind CSS v4, all on the Bun runtime.

## Running locally

You need [Bun](https://bun.sh) and a PostgreSQL database.

```bash
bun install
cp .env.example .env        # then edit the values
bun run db:migrate          # create the tables
bun run dev                 # http://localhost:3000
```

Open the site and you will be sent to `/setup` to create the administrator account. After that, sign in at `/login` and manage content under `/admin`.

### Environment variables

See `.env.example`. The required ones are `DATABASE_URL` and `BETTER_AUTH_SECRET`. Generate a secret with `openssl rand -base64 32`.

## Useful commands

```bash
bun run dev               # start the dev server
bun run build             # production build
bun run start             # serve the production build
bun run test              # run tests
bun run lint              # check formatting and lint rules
bun run format            # apply fixes
bun run db:generate       # create a migration from schema changes
bun run db:migrate        # apply migrations
bun run icons             # regenerate the favicon set from public/favicon.svg
```

## Deployment

The project ships a multi-stage `Dockerfile`. The container runs database migrations on startup and then serves the app on the port given by the `PORT` environment variable.

```bash
docker build -t ucms .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e BETTER_AUTH_SECRET=... \
  -e BETTER_AUTH_URL=https://your-domain \
  ucms
```

### Railway

Railway detects the `Dockerfile` automatically. Attach a PostgreSQL service and set `DATABASE_URL` to `${{Postgres.DATABASE_URL}}`, then set `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`. The health check at `/api/health` is configured in `railway.toml`.

## License

MIT. See [LICENSE](./LICENSE).
