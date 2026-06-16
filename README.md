# Auth Service

A production-ready authentication service built with Express, TypeORM, and PostgreSQL.

## Tech Stack
- Node.js + Express
- TypeScript
- TypeORM + PostgreSQL
- Docker
- JWT (jsonwebtoken)
- bcrypt

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

## API Routes

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | /api/auth/register | Create new user | ❌ |
| POST | /api/auth/login | Login and get tokens | ❌ |
| POST | /api/auth/refresh | Get new access token | ❌ |
| POST | /api/auth/logout | Invalidate refresh token | ❌ |

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