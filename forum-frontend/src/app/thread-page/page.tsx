"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PostCard from "../components/post-card";
import { getPosts, getPostsByCategory, searchPosts } from "@/api/post";
import { useAuth } from "@/context/authContext";

const CATEGORIES = [
  { label: "all threads", slug: null, color: "#0A0A0A", count: "4.2k" },
  { label: "security", slug: "security", color: "#CC0000", count: "892" },
  { label: "AI", slug: "ai", color: "#009926", count: "1.1k" },
  { label: "debate", slug: "debate", color: "#888", count: "432" },
  { label: "fintech", slug: "fintech", color: "#CC6600", count: "311" },
  { label: "dev", slug: "dev", color: "#888", count: "2.1k" },
  { label: "ops", slug: "ops", color: "#888", count: "567" },
];

const TRENDING = [
  { title: "JWT vulnerabilities in 2026", meta: "892 replies · security" },
  { title: "Is Rust worth learning for backend?", meta: "441 replies · dev" },
  { title: "Claude vs GPT-4 for code generation", meta: "312 replies · AI" },
];

const ONLINE = [
  { name: "void_user", role: "mod" },
  { name: "arch_rat", role: "member" },
  { name: "0xdead", role: "member" },
  { name: "kernel_panic", role: "member" },
];

export default function ThreadsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<"latest" | "top" | "hot">("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // fetch posts based on active category or search
  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts", activeCategory, searchQuery],
    queryFn: () => {
      if (searchQuery) return searchPosts(searchQuery);
      if (activeCategory) return getPostsByCategory(activeCategory);
      return getPosts();
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setActiveCategory(null);
  };

  const handleCategoryClick = (slug: string | null) => {
    setActiveCategory(slug);
    setSearchQuery("");
    setSearchInput("");
  };

  const sortedPosts = posts ? [...posts].sort((a, b) => {
    if (sort === "top") return b.likes - a.likes;
    if (sort === "hot") return b.views - a.views;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }) : [];

  return (
    <main>
      {/* NAV */}
      <nav className="enav">
        <div className="enav-logo">
          <span className="enav-logo-dot" />
          VOID FORUM
        </div>
        <div className="enav-links">
          <span className="enav-link active">explore</span>
          <span className="enav-link" onClick={() => router.push("/feed")}>my feed</span>
          <span className="enav-link" onClick={() => router.push("/bookmarks")}>bookmarks</span>
        </div>
        <div className="enav-right">
          {user && <span className="enav-user">// {user.email}</span>}
          <button className="enav-btn" onClick={() => router.push("/posts/new")}>
            + new post
          </button>
        </div>
      </nav>

      <div className="explore-wrap">
        {/* SIDEBAR LEFT */}
        <div className="sidebar-left">
          <div className="sidebar-section">
            <div className="sidebar-label">categories</div>
            {CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                className={`sidebar-item ${activeCategory === cat.slug ? "active" : ""}`}
                onClick={() => handleCategoryClick(cat.slug)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {cat.slug && (
                    <div
                      className="sidebar-dot"
                      style={{ background: cat.color }}
                    />
                  )}
                  <span className="sidebar-item-label">{cat.label}</span>
                </div>
                <span className="sidebar-item-count">{cat.count}</span>
              </div>
            ))}
          </div>

          {user?.role === "moderator" || user?.role === "admin" ? (
            <div className="sidebar-section">
              <div className="sidebar-label">moderation</div>
              <div className="sidebar-item" onClick={() => router.push("/mod/flags")}>
                <span className="sidebar-item-label">flag queue</span>
                <span className="sidebar-item-count badge-lock" style={{ padding: "2px 6px", fontSize: "9px" }}>
                  pending
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* MAIN */}
        <div className="explore-main">
          <div className="explore-toolbar">
            <div className="explore-toolbar-left">
              <div className="explore-count">
                {isLoading ? "loading..." : `${sortedPosts.length} threads`}
              </div>
              <div className="explore-sort">
                {(["latest", "top", "hot"] as const).map((s) => (
                  <button
                    key={s}
                    className={`sort-btn ${sort === s ? "active" : ""}`}
                    onClick={() => setSort(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <form className="explore-search" onSubmit={handleSearch}>
              <input
                className="explore-search-input"
                type="text"
                placeholder="search threads..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button className="explore-search-btn" type="submit">search</button>
            </form>
          </div>

          <button
            className="new-post-btn"
            onClick={() => router.push("/posts/new")}
          >
            + start a new thread
          </button>

          <div className="post-list">
            {isLoading ? (
              <div className="explore-loading">// loading threads...</div>
            ) : sortedPosts.length === 0 ? (
              <div className="explore-loading">// no threads found</div>
            ) : (
              sortedPosts.map((post, i) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={i + 1}
                  onClick={() => router.push(`/posts/${post.id}`)}
                />
              ))
            )}
          </div>
        </div>

        {/* SIDEBAR RIGHT */}
        <div className="sidebar-right">
          <div className="sidebar-right-section">
            <div className="sidebar-right-label">// trending</div>
            {TRENDING.map((t, i) => (
              <div className="trending-item" key={i}>
                <div className="trending-num">0{i + 1}</div>
                <div>
                  <div className="trending-title">{t.title}</div>
                  <div className="trending-meta">{t.meta}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="sidebar-right-section">
            <div className="sidebar-right-label">// online now</div>
            {ONLINE.map((u) => (
              <div className="online-item" key={u.name}>
                <div className="online-dot" />
                <span className="online-name">{u.name}</span>
                <span className={`online-role ${u.role === "mod" ? "role-mod" : "role-user"}`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>

          <div className="sidebar-right-section">
            <div className="sidebar-right-label">// forum stats</div>
            <div className="stat-row">
              <div className="stat-row-label">members</div>
              <div className="stat-row-val green">14.2k</div>
            </div>
            <div className="stat-row">
              <div className="stat-row-label">threads</div>
              <div className="stat-row-val">{posts?.length ?? "—"}</div>
            </div>
            <div className="stat-row">
              <div className="stat-row-label">online now</div>
              <div className="stat-row-val green">1,247</div>
            </div>
          </div>

          {user && (
            <button
              className="sort-btn"
              style={{ width: "100%", borderTop: "1px solid #E8E8E8", padding: "14px" }}
              onClick={logout}
            >
              // logout
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
