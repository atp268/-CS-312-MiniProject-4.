import React, { useState, useEffect } from "react";

function EditPostForm({ apiBase, post, currentUser, onPostUpdated, onCancel }) {
  const [title, setTitle] = useState(post ? post.title : "");
  const [body, setBody] = useState(post ? post.body : "");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setBody(post.body);
    }
  }, [post]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!currentUser || currentUser.user_id !== post.creator_user_id) {
      setErrorMsg("Access denied: You can only edit blog posts that you created.");
      return;
    }

    if (!title.trim() || !body.trim()) {
      setErrorMsg("Post title and content cannot be empty.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/blogs/${post.blog_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          user_id: currentUser.user_id
        })
      });

      const data = await response.json();
      console.log("Update blog post response from backend:", data);

      if (!response.ok || !data.success) {
        setErrorMsg(data.error || "Failed to update blog post.");
      } else {
        onPostUpdated(data.post);
      }
    } catch (err) {
      console.error("Error updating post:", err);
      setErrorMsg("Failed to connect to backend server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card edit-post-card">
      <h2>Edit Blog Post</h2>
      <p className="card-subtitle">
        Editing Post #{post.blog_id} by <strong>{post.creator_name}</strong> (<code>@{post.creator_user_id}</code>)
      </p>

      {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor={`edit-title-${post.blog_id}`}>Post Title</label>
          <input
            id={`edit-title-${post.blog_id}`}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor={`edit-body-${post.blog_id}`}>Article Content</label>
          <textarea
            id={`edit-body-${post.blog_id}`}
            rows="6"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving Changes..." : "Save Changes"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditPostForm;
