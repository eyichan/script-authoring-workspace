# Script Authoring Workspace

A Next.js screenplay authoring workspace based on the Laper workflow research.

The product goal is to move beyond a static demo:

- write typed screenplay blocks,
- derive scenes, characters, and locations from the script,
- manage manual beats and props,
- preserve locked storyboard and generated asset workflows,
- persist projects with Postgres.

## Project Docs

- `docs/implementation-plan.md`
- `docs/architecture.md`
- `docs/progress.md`

## Development

```bash
npm install
npm run db:generate
docker compose up -d postgres
npm run db:migrate
npm run db:seed
npm run dev
```

Open:

```text
http://localhost:3000
```

The included `.env.example` uses the local Docker Postgres service from
`docker-compose.yml`. Copy it to `.env.local` before running database-backed
development commands.

## Verification

```bash
npm test
npm run lint
npm run build
npm run test:e2e
```

## Template Notes

This repository is public-template ready: generated dependencies, local build
artifacts, Playwright reports, and real environment files are ignored. Keep
project-specific secrets in `.env.local` only.
