import React, { useState } from "react";

function SignUp({ apiBase, onSignUpSuccess, onSwitchToSignIn, onCancel }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [occupation, setOccupation] = useState("");
  const [city, setCity] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!userId.trim() || !password.trim() || !name.trim()) {
      setErrorMsg("Please fill out User ID, Password, and Full Name.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user_id: userId.trim(),
          password: password.trim(),
          name: name.trim(),
          age: age ? parseInt(age, 10) : null,
          occupation: occupation.trim(),
          city: city.trim()
        })
      });

      const data = await response.json();
      console.log("Signup response from backend:", data);

      if (!response.ok || !data.success) {
        setErrorMsg(data.error || "Registration failed. Please try a different User ID.");
      } else {
        onSignUpSuccess("Account created successfully! Please sign in below.");
      }
    } catch (err) {
      console.error("Error submitting signup:", err);
      setErrorMsg("Unable to connect to the backend server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="card auth-card">
        <h2>Create an Account</h2>
        <p className="auth-subtitle">
          Register a new account to publish, edit, and manage your blog posts.
        </p>

        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="signup-userid">User ID (Username) *</label>
            <input
              id="signup-userid"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g., alex_dev"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-name">Full Name *</label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Alex Rivera"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password">Password *</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a strong password"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="signup-age">Age</label>
              <input
                id="signup-age"
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 21"
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-city">Current City</label>
              <input
                id="signup-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Flagstaff, AZ"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signup-occupation">Occupation</label>
            <input
              id="signup-occupation"
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="e.g., Computer Science Student"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Creating Account..." : "Sign Up"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <button type="button" className="link-btn" onClick={onSwitchToSignIn}>
            Sign In here
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
