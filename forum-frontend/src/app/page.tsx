import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Void Forum — Speak Without Filters",
  description: "An underground forum for unfiltered discourse. No algorithms, no shadowbans.",
};

export default function Home() {
  return (
    <main style={{ background: "#fff", color: "#0A0A0A", fontFamily: "'JetBrains Mono', monospace", margin: 0, padding: 0 }}>

      {/* NAV */}
      <nav className="bnav">
        <div className="bnav-logo">
          <span className="bnav-logo-dot" />
          VOID FORUM
        </div>
        <div className="bnav-links">
          <a href="/login">Log in</a>
          <a href="/rNPegister">Sign up</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="bhero">
        <h1 className="bhero-headline">
          Speak<br />
          <span className="bgreen">Without</span><br />
          Filters.
        </h1>
        <div className="bhero-bottom">
          <p className="bhero-sub">
            An underground forum for unfiltered discourse. No algorithms, no engagement bait, no shadowbans. Just threads that matter.
          </p>
          <div className="bhero-right">
            <a href="/register"><button className="bbtn">Start Now →</button></a>
            <a href="/threads"><button className="bbtn-ghost">// browse threads</button></a>
          </div>
        </div>
      </section>

      {/* BROWSER MOCKUP */}
      <div className="bpreview">
        <div className="bpreview-bar">
          <div className="bpreview-dot" style={{ background: "#FF5F57" }} />
          <div className="bpreview-dot" style={{ background: "#FEBC2E" }} />
          <div className="bpreview-dot" style={{ background: "#28C840" }} />
        </div>
        <div className="bpreview-content">
          <div className="bpreview-row">
            <div className="bpreview-idx">001</div>
            <div className="bpreview-title">Why every startup&apos;s auth is broken by design</div>
            <div className="btag tr">security</div>
          </div>
          <div className="bpreview-row">
            <div className="bpreview-idx">002</div>
            <div className="bpreview-title">Microservices are overengineered nonsense — change my mind</div>
            <div className="btag tw">debate</div>
          </div>
          <div className="bpreview-row">
            <div className="bpreview-idx">003</div>
            <div className="bpreview-title">The real cost of LLM inference nobody talks about</div>
            <div className="btag tg">AI</div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="bstats">
        <div className="bstat">
          <div className="bstat-num bg">14.2k</div>
          <div className="bstat-label">active members</div>
        </div>
        <div className="bstat">
          <div className="bstat-num">892</div>
          <div className="bstat-label">threads this week</div>
        </div>
        <div className="bstat">
          <div className="bstat-num">48ms</div>
          <div className="bstat-label">avg response time</div>
        </div>
        <div className="bstat">
          <div className="bstat-num">Zero</div>
          <div className="bstat-label">shadowbans</div>
        </div>
      </div>

      {/* RECENT THREADS */}
      <section className="bposts">
        <div className="bsec">// recent threads</div>

        {[
          { idx: "001", title: "Why every startup's auth is broken by design", user: "void_user", time: "2h ago", tag: "security", tagClass: "tr", replies: "34 replies" },
          { idx: "002", title: "Microservices are overengineered nonsense — change my mind", user: "arch_rat", time: "5h ago", tag: "debate", tagClass: "tw", replies: "128 replies" },
          { idx: "003", title: "The real cost of LLM inference at scale nobody talks about", user: "kernel_panic", time: "8h ago", tag: "AI", tagClass: "tg", replies: "67 replies" },
          { idx: "004", title: "Redis saved my career — a love letter to caching", user: "cache_me", time: "12h ago", tag: "dev", tagClass: "tw", replies: "91 replies" },
          { idx: "005", title: "Fintech still using MD5 passwords in 2026 — a thread", user: "0xdead", time: "1d ago", tag: "security", tagClass: "tr", replies: "203 replies" },
        ].map((post) => (
          <div className="bpost-row" key={post.idx}>
            <div className="bpost-idx">{post.idx}</div>
            <div>
              <div className="bpost-title">{post.title}</div>
              <div className="bpost-meta">{post.user} · {post.time}</div>
            </div>
            <div className={`btag ${post.tagClass}`}>{post.tag}</div>
            <div className="bpost-replies">{post.replies}</div>
          </div>
        ))}
      </section>

      {/* FOOTER */}
      <footer className="bfooter">
        <div className="bfooter-left">VOID FORUM</div>
        <div className="bfooter-right">No ads · No tracking · No mercy</div>
      </footer>

    </main>
  );
}
