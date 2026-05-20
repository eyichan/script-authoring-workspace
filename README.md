# Script Authoring Workspace

A public Next.js template for a screenplay authoring workspace inspired by the
Laper workflow research. It turns typed screenplay source blocks into derived
production entities, while keeping the script itself as the canonical source of
truth.

## What It Does

- Write screenplay blocks for Scene, Action, Character, Parenthetical,
  Dialogue, Transition, Comment, and Subtitle.
- Use structured scene heading controls for interior/exterior prefixes and time
  of day.
- Use common screenplay transition presets with right-aligned transition output.
- Derive Scenes, Characters, and Locations from ordered script blocks.
- Create source Scene and Character blocks from either the Script sidebar or the
  Scenes/Characters workbench actions.
- Manage persisted Beats, Props, Assets, collaboration reviewers, and share
  links.
- Edit production metadata for Beats, Characters, Scenes, Locations, Props, and
  Script Cover fields.
- Confirm destructive actions before deleting projects, script blocks, Beats,
  Props, or Assets.
- Export FDX, Fountain, and lightweight native PDF packages from the same
  ordered script source, including Script Cover metadata.

## Tech Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS v4
- shadcn/base-ui primitives
- Prisma 7 with `@prisma/adapter-pg`
- Postgres 17 via Docker Compose
- Playwright for end-to-end workflow tests

## Requirements

- Node.js 20+
- npm
- Docker Desktop or another Docker Compose compatible runtime

## Quick Start

```powershell
npm install
Copy-Item .env.example .env.local
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open:

```text
http://localhost:3000
```

The local database URL in `.env.example` is:

```text
postgresql://script_author:script_author_password@127.0.0.1:54329/script_authoring?schema=public
```

Use `127.0.0.1` on this Windows host; Prisma previously failed to connect
through `localhost` for the Docker-published Postgres port.

## Production-Style Local Run

```powershell
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run build
npm run start -- --hostname 127.0.0.1 --port 3100
```

Open:

```text
http://127.0.0.1:3100
```

## Verification

```powershell
npm run lint
npm test
npm run build
npm run test:e2e
```

Current verified baseline:

- `npm run lint` passes.
- `npm test` passes with 10 domain tests.
- `npm run build` passes.
- `npm run test:e2e` passes with 12 Playwright workflow tests.

## Project Docs

- `docs/architecture.md` - current boundaries, source-of-truth rules, and data
  flows.
- `docs/progress.md` - implementation history and verification log.
- `docs/entity-workbench-detail-plan.md` - workbench detail editing plan and
  completed slices.
- `docs/product-workflow-hardening-2026-05-17.md` - workflow hardening decisions,
  confirmations, and export coverage.
- `docs/reference-workbench-routes.md` - reference route and ownership notes.
- `docs/implementation-plan.md` - original staged implementation plan.

## Repository Status

This repository is public-template ready:

- `package.json` is marked `"private": false`.
- Local environment files stay ignored.
- Build output, dependency folders, Playwright reports, and local logs stay
  ignored.
- Secrets should live in `.env.local`, never in committed files.

The current implementation is suitable for local use, template reuse, and public
source distribution. It is not yet deployed as a hosted production web app.
