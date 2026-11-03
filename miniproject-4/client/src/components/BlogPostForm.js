import React, { useState } from "react";

function BlogPostForm({ apiBase, currentUser, onPostCreated }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleBodyChange = (e) => {
    setBody(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim() || !body.trim()) {
      setErrorMsg("Both post title and content are required.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/blogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          user_id: currentUser.user_id,
          creator_name: currentUser.name
        })
      });

      const data = await response.json();
      console.log("Created blog post response from backend:", data);

      if (!response.ok || !data.success) {
        setErrorMsg(data.error || "Failed to publish blog post.");
      } else {
        setTitle("");
        setBody("");
        if (onPostCreated) {
          onPostCreated(data.post);
        }
      }
    } catch (err) {
      console.error("Error submitting new blog post:", err);
      setErrorMsg("Failed to connect to backend server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card create-post-card">
      <h2>Create a New Blog Post</h2>
      <p className="card-subtitle">
        Publishing as <strong>{currentUser.name}</strong> (<code>@{currentUser.user_id}</code>)
      </p>

      {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="post-title">Post Title</label>
          <input
            id="post-title"
            type="text"
            name="title"
            value={title}
            onChange={handleTitleChange}
            placeholder="Enter a descriptive title for your article..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="post-body">Article Content</label>
          <textarea
            id="post-body"
            name="body"
            rows="4"
            value={body}
            onChange={handleBodyChange}
            placeholder="Write your blog content here..."
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Publishing..." : "Publish Post"}
        </button>
      </form>
    </section>
  );
}

export default BlogPostForm;
