

--- 1. Create Users Table (includes profile fields for My Profile section)
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    occupation VARCHAR(255),
    city VARCHAR(255)
);

-- Ensure columns exist if upgrading from an earlier schema
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(255);

-- 2. Create Blogs Table
CREATE TABLE IF NOT EXISTS blogs (
    blog_id SERIAL PRIMARY KEY,
    creator_name VARCHAR(255) NOT NULL,
    creator_user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_creator FOREIGN KEY (creator_user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);


-- 3. Initial Seed Data (At least 3 users & 5 blog posts)


-- Seed Users:
-- Passwords below are MD5 hashes of:
--   'password123'   -> 482c811da5d5b4bc6d497ffa98491e38
--   'securePass456' -> b68097d74f26dbcae324d081f2674e27
--   'campusAdmin789'-> b82669e46a75f8263cfec3d43ca6e6a1
INSERT INTO users (user_id, password, name, age, occupation, city) VALUES 
('alice_coder', '482c811da5d5b4bc6d497ffa98491e38', 'Alice Johnson', 22, 'Software Engineer', 'Flagstaff, AZ'),
('bob_builder', 'b68097d74f26dbcae324d081f2674e27', 'Bob Smith', 24, 'Systems Architect', 'Phoenix, AZ'),
('charlie_cs', 'b82669e46a75f8263cfec3d43ca6e6a1', 'Charlie Davis', 21, 'Computer Science Student', 'Tucson, AZ')
ON CONFLICT (user_id) DO UPDATE SET
    age = EXCLUDED.age,
    occupation = EXCLUDED.occupation,
    city = EXCLUDED.city;

-- Seed Blogs:
INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created) VALUES
('Alice Johnson', 'alice_coder', 'Getting Started with Express & PostgreSQL', 
 'Connecting a relational database like PostgreSQL to Express completely changes how web applications work. Gone are the days of data disappearing on server restart!', 
 CURRENT_TIMESTAMP - INTERVAL '4 days'),

('Alice Johnson', 'alice_coder', 'Why Relational Integrity Matters', 
 'Foreign key constraints ensure referential integrity. Linking creator_user_id directly to the users table guarantees that only valid registered authors own blogs.', 
 CURRENT_TIMESTAMP - INTERVAL '3 days'),

('Bob Smith', 'bob_builder', 'Session-Based Authentication in Node.js', 
 'Using express-session allows us to persist a user''s identity across requests safely without exposing sensitive database fields to the client browser.', 
 CURRENT_TIMESTAMP - INTERVAL '2 days'),

('Bob Smith', 'bob_builder', 'Responsive UI & Modern Web Best Practices', 
 'A clean blog needs to look great whether viewed on an iPhone screen or an ultrawide desktop monitor. Fluid card layouts make reading enjoyable anywhere.', 
 CURRENT_TIMESTAMP - INTERVAL '1 day'),

('Charlie Davis', 'charlie_cs', 'Full-Stack Evolution: From Memory to PostgreSQL', 
 'Watching this project evolve from a simple in-memory proof of concept to a fully authenticated, multi-user SQL backend has been an awesome learning milestone.', 
 CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
