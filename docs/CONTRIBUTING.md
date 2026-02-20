# Contributing to PostForge

Thank you for considering contributing to PostForge.

## Getting started

1. Fork the repository and clone it locally.
2. Set up the backend: see [post-forge-back-end/README.md](../post-forge-back-end/README.md).
3. Set up the frontend: see root [README.md](../README.md) (Frontend section).
4. Follow the architectural rules in [post-forge-back-end/README.md](../post-forge-back-end/README.md) (backend) and project conventions in the frontend (e.g. CLAUDE.md in post-forge-front-end if present).

## Development

- Backend: run tests with `./vendor/bin/sail artisan test` from `post-forge-back-end`; run `./vendor/bin/pint` for code style.
- Frontend: run `pnpm lint` and `pnpm test` from `post-forge-front-end`.

## Submitting changes

1. Create a feature branch from `main` or `develop`.
2. Make your changes; ensure tests and lint pass.
3. Open a pull request with a clear description of the change.

## Architecture and roadmap

See [ARCHITECTURE.md](ARCHITECTURE.md) and [ROADMAP.md](ROADMAP.md) for design and product direction.
