import React, { useState, useEffect } from "react";
import PostList from "./PostList";

function MyProfile({ apiBase, currentUser, posts, onUserUpdated, onPostUpdated, onPostDeleted, onBackToHome }) {
  const [profile, setProfile] = useState(currentUser);
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState(currentUser ? currentUser.name : "");
  const [age, setAge] = useState(currentUser && currentUser.age ? String(currentUser.age) : "");
  const [occupation, setOccupation] = useState(currentUser && currentUser.occupation ? currentUser.occupation : "");
  const [city, setCity] = useState(currentUser && currentUser.city ? currentUser.city : "");
  const [newPassword, setNewPassword] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    const fetchProfileData = async () => {
      try {
        const res = await fetch(`${apiBase}/profile/${encodeURIComponent(currentUser.user_id)}`, {
          credentials: "include"
        });
        const data = await res.json();
        console.log("Fetched user profile from backend:", data);
        if (res.ok && data.user) {
          setProfile(data.user);
          setName(data.user.name || "");
          setAge(data.user.age !== null && data.user.age !== undefined ? String(data.user.age) : "");
          setOccupation(data.user.occupation || "");
          setCity(data.user.city || "");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfileData();
  }, [apiBase, currentUser]);

  if (!currentUser) {
    return (
      <div className="card">
        <h2>My Profile</h2>
        <p>Please sign in to view your profile and authored blog posts.</p>
      </div>
    );
  }

  const userBlogs = posts.filter((post) => post.creator_user_id === currentUser.user_id);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setStatusMsg("");
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Full Name cannot be empty.");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/profile/${encodeURIComponent(currentUser.user_id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          age: age ? parseInt(age, 10) : null,
          occupation: occupation.trim(),
          city: city.trim(),
          new_password: newPassword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Failed to update profile.");
      } else {
        setProfile(data.user);
        setEditingProfile(false);
        setNewPassword("");
        setStatusMsg("Profile details updated successfully.");
        if (onUserUpdated) {
          onUserUpdated(data.user);
        }
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      setErrorMsg("Unable to connect to backend server.");
    }
  };

  return (
    <div className="profile-section">
      <div className="card profile-card">
        <div className="profile-header">
          <div>
            <h2>My Profile</h2>
            <p className="card-subtitle">Personal account information and authored articles</p>
          </div>
          <div className="profile-header-actions">
            {!editingProfile && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setEditingProfile(true)}
              >
                Edit Profile Info
              </button>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={onBackToHome}>
              Back to All Posts
            </button>
          </div>
        </div>

        {statusMsg && <div className="alert alert-success">{statusMsg}</div>}
        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

        {!editingProfile ? (
          <div className="profile-details-grid">
            <div className="profile-detail-item">
              <span className="detail-label">Username (User ID)</span>
              <span className="detail-value"><code>@{profile.user_id}</code></span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Full Name</span>
              <span className="detail-value">{profile.name}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Age</span>
              <span className="detail-value">
                {profile.age !== null && profile.age !== undefined && profile.age !== ""
                  ? `${profile.age} years old`
                  : "Not specified"}
              </span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Occupation</span>
              <span className="detail-value">{profile.occupation || "Not specified"}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Current City</span>
              <span className="detail-value">{profile.city || "Not specified"}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Total Posts Authored</span>
              <span className="detail-value">{userBlogs.length}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="profile-edit-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="prof-name">Full Name *</label>
                <input
                  id="prof-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="prof-age">Age</label>
                <input
                  id="prof-age"
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="prof-occupation">Occupation</label>
                <input
                  id="prof-occupation"
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="prof-city">Current City</label>
                <input
                  id="prof-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prof-password">New Password (leave blank to keep current password)</label>
              <input
                id="prof-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Optional: enter new password"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Save Profile
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingProfile(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="my-blogs-container">
        <h3>My Authored Blog Posts ({userBlogs.length})</h3>
        {userBlogs.length === 0 ? (
          <div className="card empty-state">
            <p>You have not published any blog posts yet.</p>
          </div>
        ) : (
          <PostList
            apiBase={apiBase}
            posts={userBlogs}
            currentUser={currentUser}
            onPostUpdated={onPostUpdated}
            onPostDeleted={onPostDeleted}
          />
        )}
      </div>
    </div>
  );
}

export default MyProfile;
