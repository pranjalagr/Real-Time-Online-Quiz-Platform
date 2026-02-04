CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms(
  id SERIAL PRIMARY KEY,
  host_id INT REFERENCES users(id) ON DELETE CASCADE,
  room_code TEXT UNIQUE NOT NULL,
  state TEXT CHECK (state IN ('CREATED','LOBBY','LIVE','ENDED')) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quizzes(
    id SERIAL PRIMARY KEY,
    room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
    quiz_topic TEXT NOT NULL,
    duration_seconds INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE TABLE questions(
    id SERIAL PRIMARY KEY,
    quizzes_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_options TEXT[] NOT NULL,
    correct_option INT NOT NULL,
    question_order INT NOT NULL
);

CREATE TABLE submissions(
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    questions_id INT REFERENCES questions(id) ON DELETE CASCADE,
    selected_option INT NOT NULL,
    submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE leaderboard(
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
    score INT DEFAULT 0,
    PRIMARY KEY (user_id, room_id)
);

CREATE TABLE room_users(
   user_id INT REFERENCES users(id) ON DELETE CASCADE,
    room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
   role TEXT NOT NULL,
   PRIMARY KEY (user_id, room_id),
    CONSTRAINT role_check
        CHECK (role IN ('host', 'player'))
);