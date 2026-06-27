# PROJECT EXPLORATION

This project explores the architecture and implementation of a production-grade forum application built with a microservices architecture. The intent is to move beyond monolithic application design and understand how large scale systems decompose functionality into isolated, independently deployable services.

Each service owns its own database, business logic and API — communicating over HTTP through a central gateway. This mirrors how companies like Reddit, Discord and Stack Overflow architect their backends at scale.

- **Authentication** — stateless JWT auth with refresh token rotation, bcrypt hashing and rate limiting rather than naive session handling
- **Search** — PostgreSQL full text search using tsvector and GIN indexes rather than naive string matching, understanding the performance implications of each approach
- **Media** — cloud based file storage via Cloudinary, separating file handling from application logic
- **Moderation** — flagging and content management workflows, thinking beyond the happy path
- **DevOps** — Docker containerisation ensuring environment consistency across development and production

The goal was not just to build a forum, but to make deliberate architectural decisions and understand the tradeoffs behind each one — the same decisions engineers face when building systems that need to scale.

# Auth Service

A production-ready authentication service built with Express, TypeORM, and PostgreSQL.

# Post Service

A production-ready authentication service built with Express, TypeORM, and PostgreSQL.

## Tech Stack
- Node.js + Express
- TypeScript
- TypeORM + PostgreSQL
- Docker
- JWT (jsonwebtoken)
- Redis
- bcrypt
- Zod
- Cloudinary
- Slugify
- Cloudify
- WebSockets

## What I Learned

### JWT (JSON Web Tokens)
- Tokens are stateless — no DB hit required on every request, the signature is verified mathematically
- Access tokens are short lived (15min) to minimise risk if stolen
- Refresh tokens are long lived (7days) and stored in the DB so they can be invalidated
- Token structure: Header.Payload.Signature — the signature proves it hasn't been tampered with

### Authentication Flow
- Password only travels over the network once (at login)
- Server returns an access token + refresh token on successful login
- Every subsequent request sends the access token in the Authorization header as a Bearer token
- When the access token expires the frontend silently calls the refresh endpoint to get a new one
- On logout the refresh token is deleted from the DB — both tokens are dead

### Middleware
- Middleware is a wrapper that sits between the request and the route handler
- The authenticate middleware extracts and verifies the Bearer token from the Authorization header
- If valid it attaches the decoded user (userId, email) to req.user and calls next()
- If invalid it blocks the request and returns 401 — the route never runs

### bcrypt
- Passwords are never stored in plain text
- bcrypt hashes the password with a salt before saving to the DB
- On login bcrypt compares the plain password against the stored hash
- Salt rounds (10) determine how computationally expensive the hash is — higher = more secure

### Axios Interceptors (Frontend)
- Request interceptor automatically attaches the access token to every outgoing request
- Response interceptor catches 401 errors, silently refreshes the token and retries the request
- The user never sees a login screen — stays authenticated seamlessly for 7 days
- Event driven pattern — only acts when something triggers it, no polling

### Redis Caching
- In-memory data store used to cache frequently accessed data — reads from Redis are sub-millisecond compared to a full database query
- Expensive queries such as full text search (tsvector) and high traffic routes like `GET /posts` are cached to avoid hitting PostgreSQL on every request
- Cache keys are scoped by route and parameters — `search:typescript`, `posts:category:general`, `posts:user:1` — so each unique query has its own cache entry
- TTL (time to live) of 60-120 seconds depending on the route — cache automatically expires and refreshes, balancing freshness with performance
- Cache invalidation on write — when a post is created or updated the relevant cache keys are deleted so stale data is never served
- Allows the application to handle significantly higher concurrent load without scaling the database 

### Docker
- PostgreSQL runs in a Docker container — no local install needed
- Guarantees the same environment across all machines
- One command spins up the entire database: `docker run --name postgres ...`

### TypeORM
- Entities are TypeScript classes that map to database tables
- `synchronize: true` in development auto creates tables from entities
- Repositories handle all DB queries — `find`, `findOne`, `save`, `create`
- `nullable: true` columns need explicit `type` declared for PostgreSQL compatibility


### PostgreSQL
- `tsvector` and `plainto_tsquery` used for full text search — strips common words, stems terms and matches semantically rather than exact string matching
- Materialised views used for pre-computing expensive queries 

### Zod
- Library used for server side validation 
- Prevents bypassing client side validation — frontend validation is a UX concern only, anyone can curl directly into the API and skip the UI entirely
- Protects against injection attacks, malformed payloads, buffer overflow attempts and mass assignment by rejecting unexpected or malformed data before it touches business logic or the database
- Enforces the principle of never trusting the client — every request is treated as potentially malicious regardless of where it came from

### Cloudinary
- Cloud based media storage — images and videos uploaded by users are stored on Cloudinary rather than the application server
- Multer handles `multipart/form-data` file uploads, streams the file to Cloudinary and saves the returned URL to the Media table

### reCAPTCHA v3
- Google's invisible bot detection — runs silently in the background, no "click the traffic lights" checkbox for real users
- Frontend sends a captcha token with every register and login request
- Backend verifies the token against Google's API and receives a score between 0.0 and 1.0 — 1.0 is very likely human
- Requests scoring below 0.5 are rejected before touching any business logic
- Protects against mass registration bots, credential stuffing and automated brute force attacks
- v3 was chosen over v2 specifically because it's frictionless — legitimate users never know it's there

### Twilio
- SMS provider used to deliver MFA verification codes to users' phone numbers
- 6 digit code generated using `crypto.randomInt` — cryptographically random, not predictable
- Code expires after 10 minutes — stored in DB alongside expiry timestamp
- After successful verification code is immediately nulled from DB — single use only
- MFA check happens before JWT tokens are issued — a stolen password alone is not enough to access an account
- Integrates directly with the login flow — if `mfaEnabled` is true on the user, SMS is sent and `mfaRequired: true` is returned instead of tokens

### SendGrid
- Transactional email service used for account verification emails
- On registration a cryptographically random token is generated via `crypto.randomBytes(32)` and saved to the user
- Token is sent as a link in the verification email — user clicks it to prove they own the email address
- Unverified users are blocked from logging in — email ownership must be confirmed before account access is granted
- Token is nulled from DB after successful verification — single use only
- Prevents throwaway/fake email registrations and ensures a valid contact method exists for every account

## API Routes - Auth MicroService

### Auth
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | /api/auth/register | Register new user, sends verification email | ❌ |
| POST | /api/auth/login | Login with email + password, issues JWT tokens | ❌ |
| POST | /api/auth/refresh | Exchange refresh token for new access token | ❌ |
| POST | /api/auth/logout | Invalidate refresh token and end session | ✅ |
| GET | /api/auth/verify | Verify email address via token link | ❌ |
| GET | /api/auth/users/:id | Get user by id (internal service use only) | 🔒 |

### MFA
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | /api/auth/mfa/send | Send SMS verification code to user's phone | ✅ |
| POST | /api/auth/mfa/verify | Verify SMS code and issue JWT tokens | ✅ |


> ✅ Requires authentication (Bearer token)
> 🔒 Internal service use only (x-internal-secret header required)

## API Routes - Post MicroService

### Posts
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | /api/posts | Create a new post | ✅ |
| GET | /api/posts | Get all posts | ❌ |
| GET | /api/posts/:id | Get single post by id | ❌ |
| GET | /api/posts/user/:userId | Get posts by userId | ❌ |
| GET | /api/posts/search | Full text search posts | ❌ |
| GET | /api/posts/category/:slug | Get posts by category | ❌ |
| PATCH | /api/posts/:id | Update a post | ✅ |
| DELETE | /api/posts/:id | Soft delete a post | ✅ |

### Replies
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | /api/reply | Create a reply | ✅ |
| GET | /api/reply/post/:postId | Get replies by postId | ❌ |
| PATCH | /api/reply/:id | Update a reply | ✅ |
| DELETE | /api/reply/:id | Delete a reply | ✅ |

### Media
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | /api/media/upload | Upload image or video | ✅ |
| GET | /api/media/post/:postId | Get media by postId | ❌ |
| GET | /api/media/reply/:replyId | Get media by replyId | ❌ |
| PATCH | /api/media/:id | Update media | ✅ |
| DELETE | /api/media/:id | Delete media | ✅ |

### Categories
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | /api/categories | Create a category | ✅ |
| GET | /api/categories | Get all categories | ❌ |

### Flags
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | /api/flags | Flag a post or reply | ✅ |
| GET | /api/flags | Get all pending flags | ✅ 🛡️ |
| GET | /api/flags/mine | Get flags reviewed by logged in mod | ✅ 🛡️ |
| PATCH | /api/flags/:id | Update flag status | ✅ 🛡️ |

> 🛡️ Moderator access required
> ✅ Requires authentication (Bearer token)


## Running Locally

```bash
# Start PostgreSQL
docker run --name postgres -e POSTGRES_PASSWORD=yourpassword -p 5432:5432 -d postgres

# Start Redis
docker run --name redis -p 6379:6379 -d redis

# Create databases
docker exec -it postgres psql -U postgres -c "CREATE DATABASE auth_db;"
docker exec -it postgres psql -U postgres -c "CREATE DATABASE posts_db;"

# Install dependencies — run in each service folder
cd auth-service && npm install
cd ../post-service && npm install

# Run services — each in a separate terminal
cd auth-service && npm run dev
cd post-service && npm run dev
```

## Environment Variables

### auth-service


```
DB_HOST=localhost
DB_PORT=5432
REDIS_HOST=localhost
REDIS_PORT=6379
DB_USER=postgres
DB_PASSWORD=Johnyou145
DB_NAME=posts_db
NODE_ENV=development
JWT_SECRET=supersecretjwtkey123
JWT_REFRESH_SECRET=supersecretrefreshkey456
INTERNAL_SERVICE_SECRET=somelongrandomstring
CLOUDINARY_CLOUD_NAME=forumapp
CLOUDINARY_API_KEY=386561424842296
CLOUDINARY_API_SECRET=TzShGWIsKwyMDisWRR1g-c8a06w
```


### post-service


```
DB_HOST=localhost
DB_PORT=5432
REDIS_HOST=localhost
REDIS_PORT=6379
DB_USER=postgres
DB_PASSWORD=Johnyou145
DB_NAME=posts_db
NODE_ENV=development
JWT_SECRET=supersecretjwtkey123
JWT_REFRESH_SECRET=supersecretrefreshkey456
INTERNAL_SERVICE_SECRET=somelongrandomstring
CLOUDINARY_CLOUD_NAME=forumapp
CLOUDINARY_API_KEY=386561424842296
CLOUDINARY_API_SECRET=TzShGWIsKwyMDisWRR1g-c8a06w

```

## Testing

### Postman
- Industry standard tool for testing REST APIs without needing a frontend
- Requests are organised into collections — group routes by service (auth, posts, ai)
- Environments let you swap between localhost and production URLs in one click
- Each request can be saved and rerun — no need to retype body or headers each time
- Equivalent to running curl in the terminal but with a GUI

## AI PENTESTING TOOL