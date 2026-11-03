# CS 312 Mini-Project-4: Full-Stack Blog with React.js, Node.js, Express & PostgreSQL

An enhanced full-stack blog web application built with **React.js** (frontend), **Node.js & Express.js** (JSON REST API backend), and **PostgreSQL** (`BlogDB` database).

This project replaces the earlier EJS server-side templates with a dynamic **React.js** component architecture while maintaining relational database persistence, user authentication (`SignUp`, `SignIn`, `SignOut`), creator-only post authorization, and a **My Profile** section.

---

## Key Features

- **React.js Breakdown**:
  - `BlogPostForm.js`: Controlled React form using `useState` (`title`, `body`) bound with `value` and `onChange` handlers to create new posts.
  - `PostList.js`: Dynamically fetches and renders all blog posts from the Node.js backend using `.map()`, including **Edit** and **Delete** controls on each post.
  - `EditPostForm.js`: Pre-fills existing blog post values via `props`, verifies creator ownership with the backend, and replaces the updated post in homepage state dynamically.
  - `SignIn.js` & `SignUp.js`: Authentication forms communicating with the PostgreSQL `users` table via JSON endpoints.
  - `MyProfile.js` (Bonus Challenge): Displays all blog posts authored by the signed-in user along with their profile details (`user_id`, `name`, `age`, `occupation`, `city`) entered during signup.
- **Node.js & Express JSON Backend (`http://localhost:8000`)**:
  - `GET /blogs`: Returns all blog posts from PostgreSQL as JSON.
  - `POST /blogs`: Inserts a new blog post into PostgreSQL and returns the created post as JSON.
  - `PUT /blogs/:id`: Verifies creator ownership (`creator_user_id`) and updates the post in PostgreSQL.
  - `DELETE /blogs/:id`: Verifies creator ownership (`creator_user_id`) and deletes the post from PostgreSQL.
  - `POST /signup` & `POST /signin`: Performs user registration and authentication against PostgreSQL.
  - `GET /profile/:userId` & `PUT /profile/:userId`: Retrieves and updates user profile fields and authored posts.

---

## Project Structure

```text
cs312-miniproject-4/
├── index.js                         # Express JSON REST API (port 8000) & React host (port 3000)
├── db.js                            # PostgreSQL connection pool (BlogDB)
├── package.json                     # Backend dependencies
├── .env.example                     # Environment variable template
├── .gitignore                       # Ignores node_modules and .env
├── database/
│   └── schema.sql                   # PostgreSQL tables (users, blogs) & seed data
└── client/                          # React.js Frontend
    ├── package.json                 # React frontend configuration
    ├── public/
    │   └── index.html               # HTML root container
    └── src/
        ├── index.js                 # React DOM root mount
        ├── App.js                   # Main application state, routing & backend connection
        ├── App.css                  # Responsive CSS styling for desktop & mobile
        └── components/
            ├── BlogPostForm.js      # Step 5: Controlled form for creating blog posts
            ├── PostList.js          # Step 6 & 8: Dynamic post list (.map) with Edit & Delete
            ├── EditPostForm.js      # Step 7: Pre-filled edit form with ownership verification
            ├── SignIn.js            # Step 4: User sign-in component
            ├── SignUp.js            # Step 4: User sign-up component with profile fields
            └── MyProfile.js         # Bonus: User profile details & personal blog list
```

---

## Pre-Seeded User Accounts for Testing

| User ID | Password | Name | Age | Occupation | City |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `alice_coder` | `password123` | Alice Johnson | 22 | Software Engineer | Flagstaff, AZ |
| `bob_builder` | `securePass456` | Bob Smith | 24 | Systems Architect | Phoenix, AZ |
| `charlie_cs` | `campusAdmin789` | Charlie Davis | 21 | Computer Science Student | Tucson, AZ |

---

## Running Locally

1. Ensure PostgreSQL is running with the `BlogDB` database initialized via `database/schema.sql`.
2. Install dependencies and start the server:
   ```bash
   npm install
   npm start
   ```
3. Open in your browser:
   - **React Frontend**: `http://localhost:3000`
   - **JSON Blogs API**: `http://localhost:8000/blogs`
   - **Live SQL Table Viewer**: `http://localhost:8000/tables`
