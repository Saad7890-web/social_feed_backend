# Social Feed Backend

A production-minded backend for a social feed application built with **Node.js**, **Express**, **PostgreSQL**, **Redis**, and **Cloudinary**. The codebase is organized around a modular, write-safe, cache-aware architecture designed to support a large number of feed reads, comments, likes, and image uploads without turning the API into a bottleneck.

## What this project does

This backend powers a social feed with:

- email/password registration and login
- cookie-based session authentication
- protected global feed access
- public and private posts
- comments and nested replies
- likes for posts and comments
- direct browser image uploads through Cloudinary
- Redis-backed caching and rate limiting
- health and readiness endpoints for deployment checks

## Architecture overview

The design follows a simple rule: **PostgreSQL is the source of truth, Redis is a performance layer, and the API only enforces business rules**.

### Authentication

The app uses **server-side sessions** instead of storing JWTs in browser storage.

- passwords are hashed with `bcrypt`
- sessions are stored in Postgres as hashed session tokens
- the real session token is sent in an `HttpOnly` cookie
- session data can be revoked or expired centrally
- login and registration are rate-limited

This approach keeps authentication safer and makes logout and invalidation straightforward.

### Authorization

Authorization is enforced on the server for every protected request.

- `requireAuth` checks the session cookie on the server
- private posts are visible only to the owner
- ownership is checked before update and delete operations
- the client never decides access rules

### Feed design

The feed is optimized for scale and simplicity.

- it is a global feed
- public posts are visible to everyone who is authenticated
- the owner can see their own private posts
- pagination uses **cursor/keyset pagination** instead of offset pagination
- results are sorted by `created_at DESC, id DESC`

Cursor pagination keeps performance stable as the table grows.

### Comments and replies

Comments and replies are stored in one table using `parent_comment_id`.

- top-level comments use `parent_comment_id = null`
- replies point to the parent comment
- comments are loaded lazily by post
- replies are loaded only when requested

This keeps the schema simpler and reduces query complexity.

### Likes

Likes are modeled with unique join tables.

- one row per user/content pair
- duplicate likes are prevented by database constraints
- unlike removes the row
- like counters are updated in the same transaction
- the API returns counts plus a small preview of likers

### Images

Image uploads are handled through **Cloudinary**.

- the server signs the upload request
- the browser uploads directly to Cloudinary
- the API receives only the metadata it needs
- private images can use authenticated delivery

This reduces server bandwidth and keeps the API lightweight.

### Caching

Redis is used only for hot, temporary data.

- feed pages
- post details
- rate limiting
- short-lived content invalidation

Redis is intentionally **not** treated as the source of truth.

## Tech stack

- **Node.js** — runtime
- **Express 5** — HTTP API layer
- **PostgreSQL** — primary database
- **Redis** — cache and rate limiting
- **Cloudinary** — image storage and delivery
- **bcrypt** — password hashing
- **helmet** — security headers
- **cookie-parser** — cookie handling
- **compression** — response compression
- **pino / pino-http** — logging
- **zod** — environment and input validation

## File structure

```text
social-feed-backend/
├── db/
│   └── migrations/
│       ├── 001_init.sql
│       └── 002_cloudinary_images.sql
├── scripts/
│   ├── migrate.js
│   └── rollback.js
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   ├── db/
│   ├── middlewares/
│   ├── modules/
│   │   ├── auth/
│   │   ├── comments/
│   │   ├── likes/
│   │   ├── posts/
│   │   ├── uploads/
│   │   └── users/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   └── utils/
├── .env.example
├── package.json
└── README.md
```

## Database model

### users

Stores user profile and authentication data.

- `id`
- `first_name`
- `last_name`
- `email`
- `password_hash`
- timestamps

### sessions

Stores hashed sessions with expiry and revocation support.

- `id`
- `user_id`
- `session_token_hash`
- `expires_at`
- `created_at`
- `revoked_at`

### posts

Stores post content and metadata.

- `id`
- `author_id`
- `body`
- `image_key`
- `visibility`
- `like_count`
- `comment_count`
- timestamps

### comments

Stores top-level comments and replies in one table.

- `id`
- `post_id`
- `user_id`
- `parent_comment_id`
- `body`
- `like_count`
- `reply_count`
- timestamps

### join tables

- `post_likes`
- `comment_likes`

These tables enforce unique likes per user and content item.

## Scalability choices

The codebase is intentionally shaped for high read volume and large content growth.

- **Keyset pagination** avoids slow offset scans
- **Composite indexes** support feed, author, comment, and reply queries
- **Redis caching** reduces repeated reads for hot posts and feed pages
- **Direct uploads** keep media traffic off the API server
- **Write-safe counters** keep like and comment counts consistent
- **Server-side auth** prevents client-side access bugs
- **Graceful shutdown** closes Redis and Postgres cleanly

## Important design decisions

### Why cookie-based sessions instead of JWT in localStorage

Cookie sessions are easier to revoke, safer against token exposure in browser storage, and work well with server-side authorization.

### Why comments and replies share one table

A single table keeps the schema simpler, reduces duplication, and makes reply traversal easier.

### Why Postgres first and Redis second

Postgres remains the durable truth. Redis is only for cache, rate limiting, and temporary acceleration.

### Why cursor pagination

Cursor pagination stays fast even when the feed becomes very large. Offset pagination gets slower as rows increase.

### Why direct Cloudinary uploads

Uploading directly from the browser reduces load on the API server and avoids duplicate file transfer.

## API summary

### Health

- `GET /health`
- `GET /ready`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Users

- `GET /api/users/me`
- `GET /api/users/:id`

### Posts

- `GET /api/posts/feed`
- `GET /api/posts/:id`
- `POST /api/posts`
- `PATCH /api/posts/:id`
- `DELETE /api/posts/:id`

### Comments

- `GET /api/posts/:postId/comments`
- `POST /api/posts/:postId/comments`
- `GET /api/comments/:commentId`
- `DELETE /api/comments/:commentId`
- `GET /api/comments/:commentId/replies`
- `POST /api/comments/:commentId/replies`

### Likes

- `GET /api/posts/:postId/likes`
- `POST /api/posts/:postId/like`
- `DELETE /api/posts/:postId/like`
- `GET /api/comments/:commentId/likes`
- `POST /api/comments/:commentId/like`
- `DELETE /api/comments/:commentId/like`

### Uploads

- `POST /api/uploads/images/sign`
- `POST /api/uploads/images/verify`

## Environment variables

Copy `.env.example` to `.env` and fill in the values.

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgres://postgres:password@localhost:5432/social_feed
FRONTEND_ORIGIN=http://localhost:3000
COOKIE_NAME=sf_session
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
COOKIE_DOMAIN=
CSRF_COOKIE_NAME=sf_csrf
GLOBAL_RATE_LIMIT_WINDOW_MS=900000
GLOBAL_RATE_LIMIT_MAX=600
LOG_LEVEL=info
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=
MAX_IMAGE_SIZE_BYTES=8388608
REDIS_URL=
CACHE_TTL_SECONDS=30
POST_CACHE_TTL_SECONDS=60
RATE_LIMIT_POINTS=600
RATE_LIMIT_DURATION_SECONDS=900
```

## How to run the project

### 1) Install dependencies

```bash
npm install
```

### 2) Create your environment file

```bash
cp .env.example .env
```

### 3) Run migrations

```bash
npm run migrate
```

### 4) Start the server in development

```bash
npm run dev
```

### 5) Start the server in production mode

```bash
npm start
```

## Deployment notes

Before deploying, make sure you have:

- a working PostgreSQL database
- Redis configured
- Cloudinary credentials set
- correct `FRONTEND_ORIGIN`
- secure cookie settings in production

For production, set:

- `NODE_ENV=production`
- `COOKIE_SECURE=true`
- `COOKIE_SAMESITE=lax` or `strict`
- a valid `COOKIE_DOMAIN` when needed

## Operational notes

- `src/server.js` handles graceful shutdown for Redis and Postgres
- `src/app.js` applies security, compression, parsing, rate limiting, and CSRF protection
- the app disables `x-powered-by`
- error handling is centralized
- route handlers are organized by feature module

## Contributing / extending

When adding new features, keep the same pattern:

- validate input with Zod
- enforce authorization in the service layer or middleware
- use Postgres as the source of truth
- cache only hot reads in Redis
- invalidate caches after writes
- keep database queries indexed and cursor-friendly

---

This project is built to stay simple at the API layer while still being ready for scale.
