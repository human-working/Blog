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

## API Routes - Auth MicroService

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | /api/auth/register | Create new user | ❌ |
| POST | /api/auth/login | Login and get tokens | ❌ |
| POST | /api/auth/refresh | Get new access token | ❌ |
| POST | /api/auth/logout | Invalidate refresh token | ❌ |

## API Routes - Post MicroService

| Method | Route | Description | Post |
|--------|-------|-------------|------|
| GET | /api/posts/user/:userId | Get posts by useId | ❌ |
| GET | /api/posts/search | Searches post by title | ❌ |
| GET | "/api/posts/category/:slug" | Gets posts by Category| ❌ |
| GET | /api/posts | Gets all posts | ❌ |


## Running Locally

```bash
# Start PostgreSQL
docker run --name postgres -e POSTGRES_PASSWORD=yourpassword -p 5432:5432 -d postgres

# Install dependencies
npm install

# Run in development
npm run dev
```

## Environment Variables
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=auth_db
NODE_ENV=development
JWT_SECRET=yoursecret
JWT_REFRESH_SECRET=yourrefreshsecret
```

## Testing

### Postman
- Industry standard tool for testing REST APIs without needing a frontend
- Requests are organised into collections — group routes by service (auth, posts, ai)
- Environments let you swap between localhost and production URLs in one click
- Each request can be saved and rerun — no need to retype body or headers each time
- Equivalent to running curl in the terminal but with a GUI