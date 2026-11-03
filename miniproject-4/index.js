const express   require("express");
const path   require("path");
const fs   require("fs");
const session   require("express-session");
const crypto   require("crypto");
require("dotenv").config();

const pool   require("./db");

const app   express();
const FRONTEND_PORT   parseInt(process.env.PORT || "3000", 10);
const BACKEND_API_PORT   parseInt(process.env.API_PORT || "8000", 10);

// CORS middleware to allow React frontend (port 3000) to communicate with Node backend (port 8000)
app.use((req, res, next)  > {
  const origin   req.headers.origin || "http://localhost:3000";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method     "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dynamic template & asset path resolver
const viewDir   fs.existsSync(path.join(__dirname, "views")) ? path.join(__dirname, "views") : __dirname;
const publicDir   fs.existsSync(path.join(__dirname, "public")) ? path.join(__dirname, "public") : __dirname;

app.use(express.static(publicDir));
app.set("view engine", "ejs");
app.set("views", viewDir);

// Configure session management for user authentication state
app.use(session({
  secret: process.env.SESSION_SECRET || "cs312-super-secret-key-2026",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use((req, res, next)  > {
  res.locals.user   req.session.user || null;
  next();
});

// Ensure users table has profile columns (age, occupation, city) for Bonus Challenge
async function ensureSchemaColumns() {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(255);");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(255);");
  } catch (err) {
    console.warn("Schema column check notice:", err.message);
  }
}

// Password hashing helper (MD5)
function hashSecret(plain) {
  return crypto.createHash("md5").update(String(plain).trim()).digest("hex");
}

function verifySecret(inputPlain, storedPassword) {
  const hashedInput   hashSecret(inputPlain);
  return storedPassword     hashedInput || storedPassword     inputPlain;
}

//Authentication & Profile JSON Routes


// POST /signup - Register new user with profile details (age, occupation, city)
app.post(["/signup", "/api/signup"], async (req, res)  > {
  const { user_id, password, name, age, occupation, city }   req.body;
  const cleanId   (user_id || "").trim();
  const cleanName   (name || "").trim();
  const cleanPass   (password || "").trim();
  const cleanOccupation   (occupation || "").trim() || null;
  const cleanCity   (city || "").trim() || null;
  const parsedAge   age !   undefined && age !   null && String(age).trim() !   "" ? parseInt(age, 10) : null;

  if (!cleanId || !cleanPass || !cleanName) {
    return res.status(400).json({
      success: false,
      error: "Please fill out User ID, Password, and Full Name."
    });
  }

  try {
    const existing   await pool.query("SELECT user_id FROM users WHERE user_id   $1", [cleanId]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "This User ID is already taken. Please choose a different one."
      });
    }

    const hashed   hashSecret(cleanPass);
    const insertRes   await pool.query(
      "INSERT INTO users (user_id, password, name, age, occupation, city) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, name, age, occupation, city",
      [cleanId, hashed, cleanName, isNaN(parsedAge) ? null : parsedAge, cleanOccupation, cleanCity]
    );

    console.log(`[AUTH] New user account created: ${cleanId} (${cleanName})`);
    return res.status(201).json({
      success: true,
      message: "Account created successfully! Please sign in.",
      user: insertRes.rows[0]
    });
  } catch (err) {
    console.error("Database error during signup:", err.message);
    return res.status(500).json({
      success: false,
      error: "Database error occurred while creating account."
    });
  }
});

// POST /signin - Authenticate user against PostgreSQL users table
app.post(["/signin", "/api/signin"], async (req, res)  > {
  const { user_id, password }   req.body;
  const cleanId   (user_id || "").trim();
  const cleanPass   (password || "").trim();

  if (!cleanId || !cleanPass) {
    return res.status(400).json({
      success: false,
      error: "Please provide both User ID and Password."
    });
  }

  try {
    const result   await pool.query("SELECT * FROM users WHERE user_id   $1", [cleanId]);
    if (result.rows.length     0) {
      return res.status(401).json({
        success: false,
        error: "Invalid User ID or password. Please try again."
      });
    }

    const matchedUser   result.rows[0];
    if (!verifySecret(cleanPass, matchedUser.password)) {
      return res.status(401).json({
        success: false,
        error: "Invalid User ID or password. Please try again."
      });
    }

    const safeUser   {
      user_id: matchedUser.user_id,
      name: matchedUser.name,
      age: matchedUser.age,
      occupation: matchedUser.occupation,
      city: matchedUser.city
    };

    req.session.user   safeUser;
    console.log(`[AUTH] User signed in: ${matchedUser.user_id}`);

    return res.json({
      success: true,
      user: safeUser
    });
  } catch (err) {
    console.error("Database error during signin:", err.message);
    return res.status(500).json({
      success: false,
      error: "Could not connect to PostgreSQL database."
    });
  }
});

// POST /signout - Destroy active user session
app.post(["/signout", "/api/signout"], (req, res)  > {
  req.session.destroy(()  > {
    res.json({ success: true });
  });
});

app.get("/signout", (req, res)  > {
  req.session.destroy(()  > {
    res.redirect("/");
  });
});

// GET /profile/:userId - Bonus Challenge: Retrieve user profile and authored blogs
app.get(["/profile/:userId", "/api/profile/:userId"], async (req, res)  > {
  const userId   (req.params.userId || "").trim();
  try {
    const userRes   await pool.query(
      "SELECT user_id, name, age, occupation, city FROM users WHERE user_id   $1",
      [userId]
    );
    if (userRes.rows.length     0) {
      return res.status(404).json({ success: false, error: "User profile not found." });
    }

    const blogsRes   await pool.query(
      "SELECT * FROM blogs WHERE creator_user_id   $1 ORDER BY date_created DESC",
      [userId]
    );

    return res.json({
      success: true,
      user: userRes.rows[0],
      blogs: blogsRes.rows
    });
  } catch (err) {
    console.error("Error fetching profile:", err.message);
    return res.status(500).json({ success: false, error: "Failed to load profile." });
  }
});

// PUT /profile/:userId - Update user profile details
app.put(["/profile/:userId", "/api/profile/:userId"], async (req, res)  > {
  const currentId   (req.params.userId || "").trim();
  const { name, age, occupation, city, new_password }   req.body;
  const cleanName   (name || "").trim();
  const cleanOccupation   (occupation || "").trim() || null;
  const cleanCity   (city || "").trim() || null;
  const parsedAge   age !   undefined && age !   null && String(age).trim() !   "" ? parseInt(age, 10) : null;
  const cleanNewPass   (new_password || "").trim();

  if (!cleanName) {
    return res.status(400).json({ success: false, error: "Full Name cannot be blank." });
  }

  try {
    let updateRes;
    if (cleanNewPass.length > 0) {
      const hashed   hashSecret(cleanNewPass);
      updateRes   await pool.query(
        "UPDATE users SET name   $1, age   $2, occupation   $3, city   $4, password   $5 WHERE user_id   $6 RETURNING user_id, name, age, occupation, city",
        [cleanName, isNaN(parsedAge) ? null : parsedAge, cleanOccupation, cleanCity, hashed, currentId]
      );
    } else {
      updateRes   await pool.query(
        "UPDATE users SET name   $1, age   $2, occupation   $3, city   $4 WHERE user_id   $5 RETURNING user_id, name, age, occupation, city",
        [cleanName, isNaN(parsedAge) ? null : parsedAge, cleanOccupation, cleanCity, currentId]
      );
    }

    if (updateRes.rows.length     0) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    await pool.query("UPDATE blogs SET creator_name   $1 WHERE creator_user_id   $2", [cleanName, currentId]);

    const updatedUser   updateRes.rows[0];
    req.session.user   updatedUser;

    return res.json({
      success: true,
      user: updatedUser
    });
  } catch (err) {
    console.error("Error updating profile:", err.message);
    return res.status(500).json({ success: false, error: "Database error updating profile." });
  }
});


// Steps 3, 5, 6, 7 & 8: Blog JSON REST API Routes


// Step 3 & Step 6: GET /blogs - Return all blogs as JSON for React frontend
app.get(["/blogs", "/api/blogs"], async (req, res)  > {
  try {
    const result   await pool.query("SELECT * FROM blogs ORDER BY date_created DESC");
    return res.json(result.rows);
  } catch (err) {
    console.error("Failed to query blogs table:", err.message);
    return res.status(500).json({
      success: false,
      error: "Database connection failed. Ensure PostgreSQL and BlogDB are running."
    });
  }
});

// Step 5: POST /blogs - Create a new blog post in PostgreSQL and return JSON
app.post(["/blogs", "/api/blogs", "/posts"], async (req, res)  > {
  const activeUserId   (req.body.user_id || (req.session.user && req.session.user.user_id) || "").trim();
  const { title, body }   req.body;
  const cleanTitle   (title || "").trim();
  const cleanBody   (body || "").trim();

  if (!activeUserId) {
    return res.status(401).json({
      success: false,
      error: "Authentication required. Please sign in to create a post."
    });
  }

  if (!cleanTitle || !cleanBody) {
    return res.status(400).json({
      success: false,
      error: "Post title and content cannot be empty."
    });
  }

  try {
    // Verify user in PostgreSQL users table to get accurate creator_name
    const userCheck   await pool.query("SELECT user_id, name FROM users WHERE user_id   $1", [activeUserId]);
    if (userCheck.rows.length     0) {
      return res.status(401).json({
        success: false,
        error: "Invalid user account. Please sign in again."
      });
    }

    const creatorName   userCheck.rows[0].name;
    const insertResult   await pool.query(
      "INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *",
      [creatorName, activeUserId, cleanTitle, cleanBody]
    );

    console.log(`[BLOG] Post created: "${cleanTitle}" by ${activeUserId}`);
    return res.status(201).json({
      success: true,
      post: insertResult.rows[0]
    });
  } catch (err) {
    console.error("Error creating post in PostgreSQL:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to save blog post to database."
    });
  }
});

// Step 7: GET /blogs/:id/verify-owner - Check post ownership in backend and forward to frontend
app.get(["/blogs/:id/verify-owner", "/api/blogs/:id/verify-owner"], async (req, res)  > {
  const blogId   parseInt(req.params.id, 10);
  const activeUserId   (req.query.user_id || (req.session.user && req.session.user.user_id) || "").trim();

  if (isNaN(blogId)) {
    return res.status(400).json({ authorized: false, error: "Invalid blog post ID." });
  }

  try {
    const result   await pool.query("SELECT * FROM blogs WHERE blog_id   $1", [blogId]);
    if (result.rows.length     0) {
      return res.status(404).json({ authorized: false, error: "Blog post not found." });
    }

    const post   result.rows[0];
    if (!activeUserId || post.creator_user_id !   activeUserId) {
      return res.status(403).json({
        authorized: false,
        error: `Access denied: You can only edit posts you created yourself (Post owner: @${post.creator_user_id}).`
      });
    }

    return res.json({ authorized: true, post });
  } catch (err) {
    return res.status(500).json({ authorized: false, error: "Error verifying post ownership." });
  }
});

// Step 7: PUT /blogs/:id - Update an existing blog post (Creator-only authorization enforced)
app.put(["/blogs/:id", "/api/blogs/:id"], async (req, res)  > {
  const blogId   parseInt(req.params.id, 10);
  const activeUserId   (req.body.user_id || (req.session.user && req.session.user.user_id) || "").trim();
  const { title, body }   req.body;
  const cleanTitle   (title || "").trim();
  const cleanBody   (body || "").trim();

  if (!activeUserId) {
    return res.status(401).json({
      success: false,
      error: "Please sign in to edit your blog posts."
    });
  }

  if (isNaN(blogId) || !cleanTitle || !cleanBody) {
    return res.status(400).json({
      success: false,
      error: "Valid blog ID, title, and content are required."
    });
  }

  try {
    const existing   await pool.query("SELECT * FROM blogs WHERE blog_id   $1", [blogId]);
    if (existing.rows.length     0) {
      return res.status(404).json({ success: false, error: "Blog post not found." });
    }

    if (existing.rows[0].creator_user_id !   activeUserId) {
      console.warn(`[AUTH_BLOCK] User ${activeUserId} attempted to edit post ${blogId} owned by ${existing.rows[0].creator_user_id}`);
      return res.status(403).json({
        success: false,
        error: "Access denied: You can only edit posts you created yourself."
      });
    }

    const updateResult   await pool.query(
      "UPDATE blogs SET title   $1, body   $2 WHERE blog_id   $3 AND creator_user_id   $4 RETURNING *",
      [cleanTitle, cleanBody, blogId, activeUserId]
    );

    console.log(`[BLOG] Post ${blogId} updated by ${activeUserId}`);
    return res.json({
      success: true,
      post: updateResult.rows[0]
    });
  } catch (err) {
    console.error("Error updating post in database:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to update blog post in database."
    });
  }
});

// Step 8: DELETE /blogs/:id - Delete a blog post (Creator-only authorization enforced)
app.delete(["/blogs/:id", "/api/blogs/:id"], async (req, res)  > {
  const blogId   parseInt(req.params.id, 10);
  const activeUserId   (
    (req.body && req.body.user_id) ||
    req.query.user_id ||
    (req.session.user && req.session.user.user_id) ||
    ""
  ).trim();

  if (!activeUserId) {
    return res.status(401).json({
      success: false,
      error: "Please sign in to delete your blog posts."
    });
  }

  if (isNaN(blogId)) {
    return res.status(400).json({ success: false, error: "Invalid blog post ID." });
  }

  try {
    const existing   await pool.query("SELECT * FROM blogs WHERE blog_id   $1", [blogId]);
    if (existing.rows.length     0) {
      return res.status(404).json({ success: false, error: "Blog post not found." });
    }

    if (existing.rows[0].creator_user_id !   activeUserId) {
      console.warn(`[AUTH_BLOCK] User ${activeUserId} attempted to delete post ${blogId} owned by ${existing.rows[0].creator_user_id}`);
      return res.status(403).json({
        success: false,
        error: "Access denied: You can only delete posts you created yourself."
      });
    }

    await pool.query(
      "DELETE FROM blogs WHERE blog_id   $1 AND creator_user_id   $2",
      [blogId, activeUserId]
    );

    console.log(`[BLOG] Post ${blogId} permanently deleted by ${activeUserId}`);
    return res.json({
      success: true,
      deletedId: blogId
    });
  } catch (err) {
    console.error("Error deleting post from database:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to delete post from database."
    });
  }
});

//                                                                     
// Live PostgreSQL Database Table Viewer (/tables)
//                                                                     
app.get(["/tables", "/db"], async (req, res)  > {
  try {
    const usersResult   await pool.query("SELECT * FROM users ORDER BY user_id ASC");
    const blogsResult   await pool.query("SELECT * FROM blogs ORDER BY blog_id ASC");

    let queryResult   null;
    let queryError   null;
    const customSql   req.query.sql ? req.query.sql.trim() : null;

    if (customSql) {
      if (!customSql.toLowerCase().startsWith("select")) {
        queryError   "Only SELECT queries are permitted in the web viewer console.";
      } else {
        try {
          queryResult   await pool.query(customSql);
        } catch (qErr) {
          queryError   qErr.message;
        }
      }
    }

    res.render("tables", {
      users: usersResult.rows,
      blogs: blogsResult.rows,
      customSql: customSql,
      queryResult: queryResult,
      queryError: queryError
    });
  } catch (err) {
    console.error("Error loading tables view:", err.message);
    res.status(500).send("Database error: " + err.message);
  }
});

//                                                                     
// React.js Frontend Asset & Bundle Serving
//                                                                     
const clientDir   path.join(__dirname, "client");

app.get("/App.css", (req, res)  > {
  const cssPath   path.join(clientDir, "src", "App.css");
  if (fs.existsSync(cssPath)) {
    res.type("text/css").send(fs.readFileSync(cssPath, "utf8"));
  } else {
    res.type("text/css").send("");
  }
});

// Dynamically bundle the React components from client/src/ for in-browser execution
app.get("/react-bundle.js", (req, res)  > {
  try {
    const componentFiles   [
      path.join(clientDir, "src", "components", "EditPostForm.js"),
      path.join(clientDir, "src", "components", "PostList.js"),
      path.join(clientDir, "src", "components", "BlogPostForm.js"),
      path.join(clientDir, "src", "components", "SignIn.js"),
      path.join(clientDir, "src", "components", "SignUp.js"),
      path.join(clientDir, "src", "components", "MyProfile.js"),
      path.join(clientDir, "src", "App.js")
    ];

    let combined   "const { useState, useEffect }   React;\n\n";
    for (const filePath of componentFiles) {
      if (fs.existsSync(filePath)) {
        let code   fs.readFileSync(filePath, "utf8");
        // Strip ES module import/export lines so all components share global Babel scope
        code   code
          .replace(/^\s*import\s+.*?;?\s*$/gm, "")
          .replace(/^\s*export\s+default\s+\w+;?\s*$/gm, "");
        combined +  `\n// --- ${path.basename(filePath)} ---\n` + code + "\n";
      }
    }

    combined +  `
// Mount React 18 Application
const rootElement   document.getElementById("root");
const root   ReactDOM.createRoot(rootElement);
root.render(<App />);
`;

    res.type("application/javascript").send(combined);
  } catch (err) {
    console.error("Error building React bundle:", err.message);
    res.status(500).send("// Error loading React bundle");
  }
});

// Serve React index.html for root and SPA client routes
app.get("*", (req, res)  > {
  const reactHtmlPath   path.join(clientDir, "public", "index.html");
  if (fs.existsSync(reactHtmlPath)) {
    return res.sendFile(reactHtmlPath);
  }
  res.status(404).send("React client index.html not found.");
});

// Start server on both Frontend Port (3000) and Backend API Port (8000)
async function startServers() {
  await ensureSchemaColumns();

  app.listen(FRONTEND_PORT, ()  > {
    console.log(`                                                    `);
    console.log(`  React Frontend running at http://localhost:${FRONTEND_PORT}`);
    console.log(`                                                    `);
  });

  if (BACKEND_API_PORT !   FRONTEND_PORT) {
    app.listen(BACKEND_API_PORT, async ()  > {
      console.log(`  Node.js JSON API running at http://localhost:${BACKEND_API_PORT}/blogs`);
      try {
        const res   await pool.query("SELECT current_database(), current_user");
        console.log(`  Connected to PostgreSQL Database: ${res.rows[0].current_database} as ${res.rows[0].current_user}`);
      } catch (err) {
        console.warn(`  [Notice] PostgreSQL connection notice: ${err.message}`);
      }
      console.log(`                                                    `);
    });
  }
}

startServers();
