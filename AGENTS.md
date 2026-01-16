# Repository Guidelines

This repository currently contains product and technical planning documents for LaunchLoop. Implementation work is tracked in `docs/implementation-plan.md`.

## Project Structure & Module Organization

- `docs/spec.md`: product/UX requirements and user flows.
- `docs/tech-spec.md`: system architecture, services, and contracts.
- `docs/implementation-plan.md`: phased build plan and validation checklist.
- Planned code layout (per `docs/implementation-plan.md`): `/apps/api`, `/apps/worker`, `/apps/template-seed`, `/packages/shared`, and `/docs`.

## Build, Test, and Development Commands

Code is not scaffolded yet, so no runnable commands exist in this repo.
- Planned workspace commands (to be added with the monorepo setup): `pnpm -r install`, `pnpm -r build`, `pnpm -r test`.
- When you add commands, document them here with a short purpose line.

## Coding Style & Naming Conventions

Coding standards will be defined once the TypeScript monorepo is created.
- Expected stack: Node.js + TypeScript (see `docs/tech-spec.md`).
- Planned shared types and validators live in `/packages/shared`.
- Use descriptive file names and keep feature code within its service boundary (`/apps/api` vs `/apps/worker`).

## Testing Guidelines

No test framework is configured yet.
- When tests are added, include the runner, naming pattern (e.g., `*.test.ts`), and coverage targets.
- Add validation steps to `docs/implementation-plan.md` as required by the plan.

## Commit & Pull Request Guidelines

This repo is not initialized as a Git repository, so commit conventions are not established.
- When Git is initialized, use clear, scoped messages (e.g., `api: add project creation endpoint`).
- For PRs, include a short description, linked issue (if any), and validation notes or screenshots for UI changes.

## Security & Configuration Tips

- Secrets should live in per-service `.env` files (see `docs/tech-spec.md`).
- Production tokens should be scoped to the minimum permissions required (GitHub/Vercel/PostHog).
- Prefer documenting config in `docs/tech-spec.md` when adding new services.
