import React, { useState } from "react";

function SignIn({ apiBase, initialSuccessMsg, onSignInSuccess, onSwitchToSignUp, onCancel }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!userId.trim() || !password.trim()) {
      setErrorMsg("Please enter both User ID and Password.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user_id: userId.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();
      console.log("Signin response from backend:", data);

      if (!response.ok || !data.success) {
        setErrorMsg(data.error || "Invalid User ID or password. Please try again.");
      } else {
        onSignInSuccess(data.user);
      }
    } catch (err) {
      console.error("Error submitting signin:", err);
      setErrorMsg("Unable to connect to the backend server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="card auth-card">
        <h2>Sign In</h2>
        <p className="auth-subtitle">
          Enter your credentials to publish articles and manage your posts.
        </p>

        {initialSuccessMsg && <div className="alert alert-success">{initialSuccessMsg}</div>}
        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="signin-userid">User ID</label>
            <input
              id="signin-userid"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter your User ID"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="signin-password">Password</label>
            <input
              id="signin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Signing In..." : "Sign In"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>

        <div className="demo-accounts-box">
          <div className="demo-accounts-title">Demo Pre-Seeded Accounts (Click to autofill):</div>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setUserId("alice_coder");
                setPassword("password123");
              }}
            >
              alice_coder
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setUserId("bob_builder");
                setPassword("securePass456");
              }}
            >
              bob_builder
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setUserId("charlie_cs");
                setPassword("campusAdmin789");
              }}
            >
              charlie_cs
            </button>
          </div>
        </div>

        <div className="auth-footer">
          Don't have an account yet?{" "}
          <button type="button" className="link-btn" onClick={onSwitchToSignUp}>
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
