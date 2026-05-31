# ucms

A lightweight, self-hostable website builder for small organizations: clubs, parishes, and local businesses that want a simple website without hiring a developer. The interface is in German.

You build each site on a free-form canvas: drop in sections (hero, text, gallery, features, call to action, contact, and more), drag them anywhere, resize them, and set their colors. Each site gets its own header and footer. When it looks right, hit Veröffentlichen. One instance hosts many sites, each published under its own address at `your-domain/<slug>`.

The first account you create becomes the administrator. Public sign-up is closed after that; the admin invites further users and assigns them as editors to individual sites.

## Features

- Free-form visual editor: drag to position, drag handles to resize, per-element background, text color, radius, padding, opacity, shadow, and z-order
- Thirteen section types: hero, text, image, gallery, features, testimonial, call to action, contact, opening hours, FAQ, video, map, divider
- Multiple sites per instance, each served at `your-domain/<slug>`
- Configurable header (logo, navigation, sticky) and footer (text, links) per site
- Invited editors: the admin creates users and assigns them to the sites they may edit
- Image uploads to S3 when configured, with automatic fallback to database storage
- Undo and redo, autosave, and a guard against losing unsaved work
- Per-site brand color, font, meta description, and social share image
- SEO built in: meta tags, `robots.txt`, and `sitemap.xml`
- Draft and Publish: edit privately, publish when ready
- Email and password authentication
- German UI throughout
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

Open the app and you will be sent to `/setup` to create the administrator account. After that, sign in at `/login`, manage sites and users at `/admin`, and edit a site at `/admin/sites/<id>`. Published sites are public at `/<slug>`.

### Environment variables

See `.env.example`. The required ones are `DATABASE_URL` and `BETTER_AUTH_SECRET`. Generate a secret with `openssl rand -base64 32`.

Uploads use S3 when `BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` are set (with optional `AWS_REGION` and `AWS_ENDPOINT_URL_S3` for non-AWS providers). When they are not set, uploads are stored in the database, so no extra setup is needed for local development.

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
