## Security Considerations

Below are the specific threats considered and the mitigations implemented.

### Defense in Depth
No single layer of protection is trusted on its own. Multiple independent layers are stacked so that if one fails, others still hold:
- **Network layer** — only the gateway is exposed publicly; auth-service, posts-service and the database sit on an internal Docker network unreachable from outside
- **Application layer** — internal service-to-service calls require a shared `x-internal-secret` header, so even a misconfigured network exposure doesn't grant access
- **Authentication layer** — every protected route verifies a JWT before processing the request
- **Authorization layer** — authenticated users can only modify resources they own

### IDOR (Insecure Direct Object Reference)
Initial design mistake caught during development: `authorId` was being read directly from the request body, meaning any client could claim to be any user simply by changing a number. Fixed by deriving identity exclusively from the verified JWT payload (`req.user.userId`) rather than trusting client-supplied data.

### Broken Object Level Authorization (BOLA)
Being authenticated is not the same as being authorized. `PATCH /posts/:id` checks not just that a valid token was provided, but that `post.authorId === req.user.userId` before allowing the edit — preventing any logged-in user from editing another user's content.

### Principle of Least Privilege
Internal service endpoints (e.g. `auth-service`'s user lookup used by `posts-service`) return only the minimum fields required (`id`, `email`, `username`) — never the password hash or refresh token, even internally.

### Server-Side Validation
All input is validated server-side with Zod regardless of any frontend validation, since client-side checks are trivially bypassed via curl, Postman, or browser dev tools. Server-side validation protects against malformed payloads, unexpected fields, and injection-style inputs before they ever reach business logic or the database.

### Password Storage
Passwords are hashed with bcrypt (salted, 10 rounds) before being stored. Plaintext passwords are never persisted or logged.

### Token Strategy
- Short-lived access tokens (15 min) limit the damage window if a token is leaked
- Long-lived refresh tokens (7 days) are stored server-side and can be invalidated on logout
- Stateless verification means no database hit is required to validate a request, which also limits what an attacker gains by intercepting traffic — tokens carry no sensitive data beyond user id and email

### Rate Limiting
Auth routes are rate limited to slow down brute-force credential stuffing attempts.

### Container Isolation
Each service runs in its own Docker container, limiting the blast radius of a compromise — a vulnerability in one service does not grant direct filesystem or process access to another. Secrets are injected via environment variables at runtime, never hardcoded into images or committed to version control.

### Known Limitations / Next Steps
- No automated dependency vulnerability scanning yet (planned: Trivy or `npm audit` in CI)
- No Web Application Firewall in front of the gateway 
- AI-assisted penetration testing will be conducted manually against local environment; findings and fixes documented separately