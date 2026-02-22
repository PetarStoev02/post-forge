# PostForge

**PostForge** is an open source, developer-focused platform for creating, scheduling, and publishing social media posts from one place. Think Buffer or Hootsuite—but open source, self-hostable, API-first, and built for developers and indie hackers.

Features: post composer, calendar scheduling, multi-platform publishing, workspace management, API access, webhooks, and optional AI-powered generation with your own API keys. Target stack: Next.js + Node/NestJS (roadmap); currently **Laravel + React**. Docker-based and self-hostable.

## Project Structure

```
post-forge/
├── README.md
├── post-forge-back-end/     # Backend - Laravel 11 GraphQL API
└── post-forge-front-end/    # Frontend - React + shadcn/ui
```

## Backend (Laravel 11)

The backend is a GraphQL-first API built with Clean Architecture principles.

### Tech Stack

- Laravel 11 + PHP 8.3
- Lighthouse GraphQL
- Laravel Sanctum (Authentication)
- Laravel Horizon (Redis Queues)
- MySQL 8
- Laravel Sail (Docker)

### Supported Platforms

- Twitter/X
- Facebook
- Instagram
- LinkedIn
- TikTok

### Getting Started

```bash
cd post-forge-back-end

# Copy environment file
cp .env.example .env

# Start Docker containers
./vendor/bin/sail up -d

# Run migrations
./vendor/bin/sail artisan migrate

# Access GraphQL Playground
open http://localhost/graphiql
```

See [post-forge-back-end/README.md](post-forge-back-end/README.md) for detailed backend documentation.

### Local setup with Herd (Laravel Herd + Post Forge MySQL)

If you use [Laravel Herd](https://herd.laravel.com) instead of Sail:

1. **Herd site**: Add a site in Herd linked to `post-forge-back-end`. The URL will be `http://post-forge-back-end.test`.
2. **MySQL**: In Herd, use (or rename) a MySQL service to **Post Forge** and note its port (e.g. 3309). In `post-forge-back-end/.env` set:
   - `APP_URL=http://post-forge-back-end.test` (or `https://` if you use Herd's HTTPS)
   - `DB_HOST=127.0.0.1`
   - `DB_PORT=3309` (or your Post Forge MySQL port)
   - `DB_USERNAME=root` and `DB_PASSWORD=` (or your Herd MySQL credentials)
   - `SANCTUM_STATEFUL_DOMAINS=post-forge-back-end.test,localhost,127.0.0.1`
3. **Run migrations**: `cd post-forge-back-end && php artisan migrate`
4. Frontend: the default GraphQL URL is already `http://post-forge-back-end.test/graphql`; run `pnpm dev` in `post-forge-front-end`.

## Frontend (React + shadcn/ui)

The frontend is built with:

- React 19
- TypeScript
- shadcn/ui
- Tailwind CSS
- Apollo Client (GraphQL)

### Getting Started

```bash
cd post-forge-front-end

# Install dependencies
pnpm install

# Start dev server (set VITE_GRAPHQL_URL to backend GraphQL URL, e.g. http://localhost/graphql)
pnpm dev
```

## Architecture

This project follows **Clean Architecture** principles:

- No business logic in controllers/resolvers
- Repository pattern for data access
- Use Cases (Interactors) for business logic
- Domain entities separate from Eloquent models

See the [post-forge-back-end/README.md](post-forge-back-end/README.md) for detailed architectural guidelines.

## Documentation

- [Roadmap](docs/ROADMAP.md) — MVP, v1, and v2 plans
- [Architecture](docs/ARCHITECTURE.md) — High-level design, data models, AI/social/workers/plugins

## License

MIT License
