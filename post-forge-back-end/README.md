# PostForge API

A GraphQL-first social media scheduling backend built with Laravel 11 using Clean Architecture principles.

## Tech Stack

- **Framework:** Laravel 11
- **PHP Version:** 8.3+
- **GraphQL:** Lighthouse
- **Authentication:** Laravel Sanctum
- **Queue:** Laravel Horizon (Redis)
- **Database:** MySQL 8
- **Development:** Laravel Sail (Docker)

## Supported Platforms

- Twitter/X
- Facebook
- Instagram
- LinkedIn
- TikTok

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/open-post.git
cd open-post/post-forge-back-end

# Copy environment file
cp .env.example .env

# Start Docker containers
./vendor/bin/sail up -d

# Install dependencies
./vendor/bin/sail composer install

# Generate application key
./vendor/bin/sail artisan key:generate

# Run migrations
./vendor/bin/sail artisan migrate

# Access GraphQL Playground
open http://localhost/graphiql
```

## Architecture

Open Post follows **Clean Architecture** (Uncle Bob) with strict layer separation:

```
app/
├── Foundation/          # Shared kernel (base classes, utilities)
├── Identity/            # User & authentication domain
├── Teams/               # Team management domain
├── Posts/               # Post & content domain
├── Media/               # Media attachments domain
├── SocialAccounts/      # OAuth connections domain
└── Publishing/          # Scheduling & publishing domain
```

### Layer Structure (per domain)

```
Domain/
├── Entities/            # Domain entities & value objects
│   ├── Models/          # Eloquent models (Infrastructure concern)
│   │   └── Factories/   # Model factories for testing
│   ├── Entity.php       # Pure PHP domain entity (DTO)
│   └── ValueObject.php  # Value objects (immutable)
├── UseCases/            # Application layer
│   ├── Contracts/       # Repository interfaces
│   ├── Requests/        # Input DTOs for use cases
│   ├── Exceptions/      # Domain-specific exceptions
│   └── *Interactor.php  # Use case implementations
├── IO/                  # Infrastructure layer
│   ├── DataAccess/      # Repository implementations
│   ├── GraphQL/         # Resolvers and mutations
│   └── Jobs/            # Queue jobs
├── Testing/             # Fakes and test doubles
└── Tests/               # Domain-specific tests
```

## Architectural Rules

### 1. No Business Logic in Controllers/Resolvers

GraphQL resolvers must be thin. They should only:
- Extract input from the request
- Call the appropriate Use Case
- Return the result

```php
// GOOD
final readonly class CreatePost
{
    public function __construct(
        private CreatePostInteractor $interactor,
    ) {}

    public function __invoke(Team $team, array $args, GraphQLContext $context): Post
    {
        $request = CreatePostRequest::from($args['input']);
        return $this->interactor->execute($context->user(), $team, $request);
    }
}

// BAD - Business logic in resolver
final readonly class CreatePost
{
    public function __invoke(Team $team, array $args, GraphQLContext $context): Post
    {
        // DON'T validate here
        // DON'T check permissions here
        // DON'T create models here
    }
}
```

### 2. No Eloquent in Domain Layer

Domain entities should be pure PHP objects (DTOs). Eloquent models live in `Entities/Models/` but are considered Infrastructure.

```php
// Domain Entity (app/Posts/Entities/Post.php)
class Post extends Data
{
    public function __construct(
        public string $id,
        public string $teamId,
        public PostContent $content,
        public PostStatus $status,
    ) {}
}

// Eloquent Model (app/Posts/Entities/Models/Post.php)
class Post extends Model
{
    // Eloquent-specific code
}
```

### 3. Infrastructure Depends on Domain, Never Reverse

```
┌─────────────────────────────────┐
│         GraphQL Layer           │  → Thin, delegates to Use Cases
├─────────────────────────────────┤
│       Application Layer         │  → Use Cases, business rules
│         (UseCases/)             │
├─────────────────────────────────┤
│         Domain Layer            │  → Entities, Value Objects, Interfaces
│         (Entities/)             │
├─────────────────────────────────┤
│      Infrastructure Layer       │  → Eloquent repos, external APIs
│           (IO/)                 │
└─────────────────────────────────┘
```

### 4. Repository Pattern

All data access goes through repository interfaces:

```php
// Interface (Domain layer)
interface PostRepository
{
    public function findById(string $id): ?Post;
    public function create(array $attributes): Post;
}

// Implementation (Infrastructure layer)
final readonly class EloquentPostRepository implements PostRepository
{
    public function findById(string $id): ?Post
    {
        return Post::find($id);
    }
}
```

### 5. Use Cases (Interactors)

All business logic lives in Use Cases:

```php
final readonly class CreatePostInteractor
{
    public function __construct(
        private PostRepository $postRepository,
        private PostAwareInteractor $postAwareInteractor,
    ) {}

    public function execute(User $actor, CreatePostRequest $request): Post
    {
        // 1. Authorization
        $this->postAwareInteractor->ensureActorCanCreatePost($actor, $request->team);

        // 2. Validation
        $this->validateScheduleTime($request->scheduledAt);

        // 3. Business logic
        return DB::transaction(fn () => $this->createPost($actor, $request));
    }
}
```

## Code Style

- Use `declare(strict_types=1)` in all PHP files
- Use `final readonly class` for service classes
- Use Enums for status fields
- Use Value Objects for complex data
- Use `spatie/laravel-data` for DTOs
- Run `./vendor/bin/pint` before committing

## Testing

```bash
# Run all tests
./vendor/bin/sail artisan test

# Run specific domain tests
./vendor/bin/sail artisan test app/Posts/Tests

# Run with coverage
./vendor/bin/sail artisan test --coverage
```

## GraphQL Endpoint

- **URL:** `POST /graphql`
- **Playground:** `GET /graphiql`

### Example Queries

```graphql
# Health check
query {
  health
}

# Login
mutation {
  login(input: { email: "user@example.com", password: "password" }) {
    token
    user {
      id
      name
    }
  }
}

# Create a post (authenticated)
mutation {
  team(id: "team-id") {
    createPost(input: {
      content: { text: "Hello World!" }
      platformIds: ["account-id"]
      scheduledAt: "2024-01-15 10:00:00"
    }) {
      id
      status
      scheduledAt
    }
  }
}
```

## Environment Variables

```env
# Database
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=post_forge
DB_USERNAME=sail
DB_PASSWORD=password

# Redis (for Horizon)
REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

# Queue
QUEUE_CONNECTION=redis

# Social Platform OAuth (add your credentials)
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
TIKTOK_CLIENT_ID=
TIKTOK_CLIENT_SECRET=
```

## Deployment (Laravel Forge)

1. Create a new site on Forge
2. Connect your GitHub repository
3. Configure environment variables
4. Enable Redis for queue processing
5. Configure Horizon daemon
6. Set up SSL certificate
7. Deploy!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the architectural rules
4. Write tests for new features
5. Run `./vendor/bin/pint` for code style
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.
