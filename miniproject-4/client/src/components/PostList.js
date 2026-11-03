import React, { useState } from "react";
import EditPostForm from "./EditPostForm";

function PostList({ apiBase, posts, currentUser, onPostUpdated, onPostDeleted }) {
  const [editingPostId, setEditingPostId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const handleEditClick = async (post) => {
    setActionError("");
    setActionSuccess("");

    if (!currentUser) {
      setActionError("Please sign in first to edit your blog posts.");
      return;
    }

    // Verify ownership with backend authorization endpoint and forward result to frontend
    try {
      const response = await fetch(
        `${apiBase}/blogs/${post.blog_id}/verify-owner?user_id=${encodeURIComponent(currentUser.user_id)}`,
        {
          method: "GET",
          credentials: "include"
        }
      );
      const data = await response.json();

      if (!response.ok || !data.authorized) {
        setActionError(
          data.error || `Access denied: Only @${post.creator_user_id} can edit "${post.title}".`
        );
        return;
      }

      setEditingPostId(post.blog_id);
    } catch (err) {
      if (currentUser.user_id !== post.creator_user_id) {
        setActionError(`Access denied: You can only edit posts that you created.`);
        return;
      }
      setEditingPostId(post.blog_id);
    }
  };

  const handleDeleteClick = async (post) => {
    setActionError("");
    setActionSuccess("");

    if (!currentUser) {
      setActionError("Please sign in first to delete your blog posts.");
      return;
    }

    try {
      const response = await fetch(`${apiBase}/blogs/${post.blog_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user_id: currentUser.user_id
        })
      });

      const data = await response.json();
      console.log("Delete blog post response from backend:", data);

      if (!response.ok || !data.success) {
        setActionError(
          data.error || `Access denied: Only @${post.creator_user_id} can delete "${post.title}".`
        );
      } else {
        setActionSuccess(`Post "${post.title}" was deleted.`);
        if (onPostDeleted) {
          onPostDeleted(post.blog_id);
        }
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      setActionError("Unable to connect to the backend server to delete post.");
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "";
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return String(dateValue);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  return (
    <section className="posts-feed">
      <div className="feed-header">
        <h2>Published Articles ({posts.length})</h2>
      </div>

      {actionError && <div className="alert alert-error">{actionError}</div>}
      {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}

      {posts.length === 0 ? (
        <div className="empty-state">
          <p>No blog posts have been published yet. Sign in and create the first post above.</p>
        </div>
      ) : (
        <div className="posts-list">
          {posts.map((post) => {
            const isOwner = currentUser && currentUser.user_id === post.creator_user_id;

            if (editingPostId === post.blog_id) {
              return (
                <EditPostForm
                  key={post.blog_id}
                  apiBase={apiBase}
                  post={post}
                  currentUser={currentUser}
                  onPostUpdated={(updatedPost) => {
                    setEditingPostId(null);
                    setActionSuccess(`Post "${updatedPost.title}" updated successfully.`);
                    onPostUpdated(updatedPost);
                  }}
                  onCancel={() => setEditingPostId(null)}
                />
              );
            }

            return (
              <article key={post.blog_id} className="card post-card">
                <div className="post-header">
                  <div>
                    <h3 className="post-title">{post.title}</h3>
                    <div className="post-meta">
                      <span>
                        By <strong>{post.creator_name}</strong> (<code>@{post.creator_user_id}</code>)
                      </span>
                      <span className="meta-separator">|</span>
                      <span>{formatDate(post.date_created)}</span>
                    </div>
                  </div>
                  {isOwner && <span className="owner-badge">Your Post</span>}
                </div>

                <div className="post-body">{post.body}</div>

                <div className="post-actions">
                  <button
                    type="button"
                    className={`btn btn-sm ${isOwner ? "btn-edit" : "btn-outline"}`}
                    onClick={() => handleEditClick(post)}
                    title={isOwner ? "Edit your post" : "Only the post creator can edit"}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${isOwner ? "btn-delete" : "btn-outline"}`}
                    onClick={() => handleDeleteClick(post)}
                    title={isOwner ? "Delete your post" : "Only the post creator can delete"}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default PostList;
