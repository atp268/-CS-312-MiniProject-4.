import React, { useState, useEffect } from "react";
import BlogPostForm from "./components/BlogPostForm";
import PostList from "./components/PostList";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import MyProfile from "./components/MyProfile";
import "./App.css";

function App() {
  const API_BASE = "http://localhost:8000";

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState("");
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("blogdb_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [activeView, setActiveView] = useState("home"); // "home" | "signin" | "signup" | "profile"
  const [authBannerMsg, setAuthBannerMsg] = useState("");

  // Step 3 & Step 6: Fetch posts from Node.js backend (http://localhost:8000/blogs) and log in console
  const fetchBlogs = async () => {
    setLoading(true);
    setBackendError("");
    try {
      const response = await fetch(`${API_BASE}/blogs`, {
        method: "GET",
        credentials: "include"
      });
      const data = await response.json();

      // Log returned data in console to verify frontend-backend connection (Step 3)
      console.log("Connected to Node.js backend (http://localhost:8000/blogs). Returned data:", data);

      if (Array.isArray(data)) {
        setPosts(data);
      } else if (data && Array.isArray(data.blogs)) {
        setPosts(data.blogs);
      }
    } catch (err) {
      console.error("Failed to fetch blogs from http://localhost:8000/blogs:", err);
      setBackendError("Could not connect to backend API at http://localhost:8000/blogs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleSignInSuccess = (userObj) => {
    setCurrentUser(userObj);
    try {
      localStorage.setItem("blogdb_user", JSON.stringify(userObj));
    } catch (e) {}
    setAuthBannerMsg("");
    setActiveView("home");
  };

  const handleSignUpSuccess = (msg) => {
    setAuthBannerMsg(msg || "Account registered! Please sign in.");
    setActiveView("signin");
  };

  const handleSignOut = async () => {
    try {
      await fetch(`${API_BASE}/signout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (e) {}
    setCurrentUser(null);
    try {
      localStorage.removeItem("blogdb_user");
    } catch (e) {}
    setActiveView("home");
  };

  // Step 5: Dynamically prepend new post to homepage list
  const handlePostCreated = (newPost) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  // Step 7: Dynamically replace edited post in homepage list
  const handlePostUpdated = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((p) => (p.blog_id === updatedPost.blog_id ? updatedPost : p))
    );
  };

  // Step 8: Dynamically remove deleted post from homepage list
  const handlePostDeleted = (deletedBlogId) => {
    setPosts((prevPosts) => prevPosts.filter((p) => p.blog_id !== deletedBlogId));
  };

  // Update user state when edited in My Profile
  const handleUserUpdated = (updatedUser) => {
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem("blogdb_user", JSON.stringify(updatedUser));
    } catch (e) {}
    // Refresh posts in case display name was changed
    fetchBlogs();
  };

  return (
    <div className="app-shell">
      {/* Top Navigation Bar */}
      <nav className="navbar">
        <div className="nav-brand-group">
          <button
            type="button"
            className="nav-brand-btn"
            onClick={() => setActiveView("home")}
          >
            BlogDB
          </button>
          <span className="tech-pill">React.js + PostgreSQL</span>
        </div>

        <div className="nav-links">
          <button
            type="button"
            className={`btn btn-nav ${activeView === "home" ? "nav-active" : ""}`}
            onClick={() => setActiveView("home")}
          >
            Home Feed
          </button>

          <a href={`${API_BASE}/tables`} className="btn btn-nav">
            SQL Tables
          </a>

          {currentUser ? (
            <>
              <button
                type="button"
                className={`btn btn-nav ${activeView === "profile" ? "nav-active" : ""}`}
                onClick={() => setActiveView("profile")}
              >
                My Profile ({currentUser.name})
              </button>
              <button
                type="button"
                className="btn btn-nav btn-signout"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`btn btn-nav ${activeView === "signin" ? "nav-active" : ""}`}
                onClick={() => {
                  setAuthBannerMsg("");
                  setActiveView("signin");
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setActiveView("signup")}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="container">
        <header className="page-header">
          <h1>Community Tech &amp; Dev Blog</h1>
          <p className="subtitle">
            Full-Stack React.js Frontend Connected to Node.js, Express &amp; PostgreSQL (BlogDB)
          </p>
        </header>

        {backendError && <div className="alert alert-error">{backendError}</div>}

        {activeView === "signin" && (
          <SignIn
            apiBase={API_BASE}
            initialSuccessMsg={authBannerMsg}
            onSignInSuccess={handleSignInSuccess}
            onSwitchToSignUp={() => setActiveView("signup")}
            onCancel={() => setActiveView("home")}
          />
        )}

        {activeView === "signup" && (
          <SignUp
            apiBase={API_BASE}
            onSignUpSuccess={handleSignUpSuccess}
            onSwitchToSignIn={() => setActiveView("signin")}
            onCancel={() => setActiveView("home")}
          />
        )}

        {activeView === "profile" && (
          <MyProfile
            apiBase={API_BASE}
            currentUser={currentUser}
            posts={posts}
            onUserUpdated={handleUserUpdated}
            onPostUpdated={handlePostUpdated}
            onPostDeleted={handlePostDeleted}
            onBackToHome={() => setActiveView("home")}
          />
        )}

        {activeView === "home" && (
          <>
            {currentUser ? (
              <BlogPostForm
                apiBase={API_BASE}
                currentUser={currentUser}
                onPostCreated={handlePostCreated}
              />
            ) : (
              <section className="card guest-banner">
                <div>
                  <h2>Want to publish your own blog post?</h2>
                  <p>
                    Sign in with your account or register a new profile to create, edit, and delete your own posts.
                  </p>
                </div>
                <div className="guest-banner-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setActiveView("signin")}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setActiveView("signup")}
                  >
                    Create Account
                  </button>
                </div>
              </section>
            )}

            {loading ? (
              <div className="card loading-state">Loading blog posts from PostgreSQL...</div>
            ) : (
              <PostList
                apiBase={API_BASE}
                posts={posts}
                currentUser={currentUser}
                onPostUpdated={handlePostUpdated}
                onPostDeleted={handlePostDeleted}
              />
            )}
          </>
        )}

        <footer className="site-footer">
          <p>CS 312 Blog Web Application - React.js, Express.js &amp; PostgreSQL</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
