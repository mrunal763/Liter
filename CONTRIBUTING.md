# Contributing to LITER

Thanks for helping improve LITER. This guide keeps the codebase consistent and the repository safe to work in.

## Getting started

1. Read the [README](README.md) for prerequisites and local setup (JDK 21, Maven 3.9+, Node 18+, PostgreSQL 15).
2. Architecture details live in [implementation.md](implementation.md); product scope and requirement status in [requirement.md](requirement.md).
3. Copy `frontend/.env.example` to `frontend/.env`; never commit your `.env`.

## Branching & commits

* Branch from `main` for any change; keep branches short-lived.
* Prefer small, single-purpose commits. Suggested style:
  * `feat: add payments page with FIFO summary`
  * `fix: reject deliveries before customer start date`
  * `docs: update API surface in implementation.md`
  * `chore: bump Spring Boot to 3.3.x`
* Reference requirement IDs from `requirement.md` in commits or PRs when a change implements or deviates from a requirement.

## Code style

* Java: standard Spring conventions; 4-space indent; keep controllers thin and push business rules into services.
* TypeScript/React: 2-space indent, function components, hooks; keep `AuthContext` the only global state unless a case for more is made.
* Formatting is standardized via `.editorconfig`; the repo normalizes to LF line endings via `.gitattributes`.

## Tests

* Backend: `mvn test` (needs a scratch PostgreSQL via `DB_*` env vars — never your production database).
* Frontend: `npm run lint` (oxlint). UI tests are on the roadmap.
* Any change to billing, pricing, or payment allocation must include or update tests.

## Security hygiene (non-negotiable)

* **Never commit credentials.** DB passwords, JWT secrets, and API keys go in environment variables only.
* `application.yml` must keep empty-default placeholders (`${DB_PASSWORD:}` style) — no real values.
* `.env`, key files, and dumps are gitignored; check `git status` before committing.
* CI runs a secret scan (gitleaks) on every push — a red check blocks merges.

## PR checklist

- [ ] `mvn -B clean verify` passes locally
- [ ] `npm run build` and `npm run lint` pass
- [ ] Docs updated (`README.md`, `requirement.md` status markers, `implementation.md`) when behavior changes
- [ ] No secrets, dumps, or build artifacts in the diff
