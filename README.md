# Open Post

A modern social media scheduling platform built with Laravel 11 (GraphQL API) and React (shadcn/ui).

## Project Structure

```
open-post/
├── open-post-back-end/     # Backend - Laravel 11 GraphQL API
└── open-post-front-end/    # Frontend - React + shadcn/ui (coming soon)
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
cd open-post-back-end

# Copy environment file
cp .env.example .env

# Start Docker containers
./vendor/bin/sail up -d

# Run migrations
./vendor/bin/sail artisan migrate

# Access GraphQL Playground
open http://localhost/graphiql
```

See [open-post-back-end/README.md](open-post-back-end/README.md) for detailed backend documentation.

## Frontend (React + shadcn/ui)

Coming soon! The frontend will be built with:

- React 18
- TypeScript
- shadcn/ui
- Tailwind CSS
- Apollo Client (GraphQL)

## Architecture

This project follows **Clean Architecture** principles:

- No business logic in controllers/resolvers
- Repository pattern for data access
- Use Cases (Interactors) for business logic
- Domain entities separate from Eloquent models

See the [open-post-back-end/README.md](open-post-back-end/README.md) for detailed architectural guidelines.

## License

MIT License
