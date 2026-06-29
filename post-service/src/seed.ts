import "reflect-metadata";
import { DataSource } from "typeorm";
import { Category } from "./entities/Category";
import { Post } from "./entities/Post";
import { AppDataSource } from "./data-source";

/**
 * UI categories (what your frontend shows)
 */
const CATEGORIES = [
  { label: "all threads", slug: null, color: "#0A0A0A", count: "4.2k" },
  { label: "security", slug: "security", color: "#CC0000", count: "892" },
  { label: "AI", slug: "ai", color: "#009926", count: "1.1k" },
  { label: "debate", slug: "debate", color: "#888", count: "432" },
  { label: "fintech", slug: "fintech", color: "#CC6600", count: "311" },
  { label: "dev", slug: "dev", color: "#888", count: "2.1k" },
  { label: "ops", slug: "ops", color: "#888", count: "567" },
];


/**
 * Realistic forum-style posts
 */
const POSTS = [
  {
    title: "JWT vulnerabilities in 2026 — are we still doing this wrong?",
    content: `
I've been reviewing production APIs recently and I keep seeing the same JWT mistakes everywhere.

Common issues:
- Tokens stored in localStorage (still happening in 2026)
- No refresh rotation strategy
- Extremely long-lived access tokens
- Weak secrets used across environments

At this point I'm wondering if JWT is even the right default for most systems anymore.

Feels like session-based auth is quietly making a comeback in a lot of serious systems.
    `.trim(),
    authorId: 1,
    authorUsername: "admin",
    categorySlug: "security",
  },

  {
    title: "Is Rust worth learning for backend in 2026?",
    content: `
I'm currently working with Node + TypeScript and it's been solid, but Rust keeps coming up in backend discussions.

What I'm trying to understand:
- Is the performance gain actually meaningful for typical APIs?
- Do companies adopt Rust outside of infra / systems work?
- Is the learning curve justified for production backend work?

I get the appeal, but I'm struggling to see where it fits in a real-world SaaS product.

Would love honest experiences, not hype.
    `.trim(),
    authorId: 2,
    authorUsername: "devguy",
    categorySlug: "dev",
  },

  {
    title: "Claude vs GPT-4 for real coding workflows",
    content: `
I've been alternating between Claude and GPT-4 for actual development work.

My rough breakdown so far:
- Claude handles large file refactoring really well
- GPT-4 is better for debugging logic step-by-step
- Both still hallucinate edge-case behaviour in backend systems

I don't think one replaces the other — they feel like different tools.

Curious how others are integrating them into daily dev workflows.
    `.trim(),
    authorId: 3,
    authorUsername: "ai_enthusiast",
    categorySlug: "ai",
  },

  {
    title: "We underestimated rate limiting and it broke production",
    content: `
Sharing a painful lesson from a recent incident.

We shipped a feature that unexpectedly went semi-viral and our API got hammered.

What went wrong:
- Rate limiting was IP-based instead of user-based
- No burst control (just flat limits)
- Redis limiter wasn't properly shared across instances
- No load testing that reflected real traffic

Result:
Database CPU maxed out → cascading failures → partial outage (~40 minutes)

We’ve since moved to token bucket + per-user quotas + gateway throttling.

Don't treat rate limiting as "later problem".
    `.trim(),
    authorId: 4,
    authorUsername: "infra_ops",
    categorySlug: "ops",
  },

  {
    title: "Fintech APIs are getting harder to integrate — anyone else?",
    content: `
I've been integrating multiple fintech APIs recently and the complexity feels like it's increasing rather than improving.

Common friction points:
- Every provider has different webhook verification methods
- Idempotency is inconsistent across platforms
- Sandboxes rarely match production behaviour
- Compliance requirements vary wildly even for similar features

It feels like everyone is reinventing the same plumbing differently.

Curious if others in fintech are seeing this trend too.
    `.trim(),
    authorId: 5,
    authorUsername: "finbuilder",
    categorySlug: "fintech",
  },

  {
    title: "Hot take: most teams adopt microservices too early",
    content: `
This is probably unpopular, but I think most early-stage teams hurt themselves with microservices.

Typical pattern:
- Start with 3–6 services "for scalability"
- Debugging becomes distributed log archaeology
- Local development becomes slow and painful
- Latency increases due to internal network hops

For most teams under ~20 engineers, a well-structured monolith is usually faster and safer.

Microservices make sense — just later than people think.
    `.trim(),
    authorId: 6,
    authorUsername: "systemthinker",
    categorySlug: "debate",
  },
];

/**
 * Seeder
 */
async function seed() {
  await AppDataSource.initialize();

  const categoryRepo = AppDataSource.getRepository(Category);
  const postRepo = AppDataSource.getRepository(Post);

  console.log("🌱 Seeding categories...");

  for (const c of CATEGORIES) {
    if (!c.slug) continue;

    const exists = await categoryRepo.findOne({
      where: { slug: c.slug },
    });

    if (!exists) {
      const category = categoryRepo.create({
        name: c.label,
        slug: c.slug,
        description: null,
      });

      await categoryRepo.save(category);
    }
  }

  console.log("🌱 Seeding posts...");

  for (const p of POSTS) {
    const exists = await postRepo.findOne({
      where: { title: p.title },
    });

    if (!exists) {
      const post = postRepo.create({
        ...p,
        views: Math.floor(Math.random() * 5000),
        likes: Math.floor(Math.random() * 800),
        isPinned: false,
        isLocked: false,
        isFlagged: false,
        isHidden: false,
        hasMedia: false,
      });

      await postRepo.save(post);
    }
  }

  console.log("✅ Seed complete");
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
});