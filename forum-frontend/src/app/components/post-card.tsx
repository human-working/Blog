// src/components/PostCard.tsx
import { Post } from "@/types/Post";

interface PostCardProps {
  post: Post;
  index: number;
  onClick?: () => void;
}

export default function PostCard({ post, index, onClick }: PostCardProps) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="post-card" onClick={onClick}>
      <div className="post-card-idx">
        {String(index).padStart(3, "0")}
      </div>

      <div className="post-card-body">
        <div className="post-card-meta">
          <span className="post-card-author">{post.authorUsername}</span>
          <span className="post-card-dot">·</span>
          <span className="post-card-date">{formattedDate}</span>
          {post.isPinned && <span className="post-card-badge badge-pin">pinned</span>}
          {post.isLocked && <span className="post-card-badge badge-lock">locked</span>}
        </div>

        <h2 className="post-card-title">{post.title}</h2>

        <p className="post-card-preview">
          {post.content.length > 120
            ? post.content.slice(0, 120) + "..."
            : post.content}
        </p>

        <div className="post-card-footer">
          <div className="post-card-stats">
            <span className="post-card-stat">👁 {post.views}</span>
            <span className="post-card-stat">♥ {post.likes}</span>
            {post.hasMedia && <span className="post-card-stat">📎 media</span>}
          </div>
          {post.categorySlug && (
            <div className="post-card-tag tw">{post.categorySlug}</div>
          )}
        </div>
      </div>
    </div>
  );
}