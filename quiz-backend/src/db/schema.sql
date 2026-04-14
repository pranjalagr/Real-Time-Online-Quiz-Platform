CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    user_type TEXT DEFAULT 'GUEST' CHECK (user_type IN ('REGISTERED', 'GUEST')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT registered_or_guest CHECK (
        (user_type = 'REGISTERED' AND email IS NOT NULL AND password_hash IS NOT NULL) OR
        (user_type = 'GUEST' AND email IS NULL AND password_hash IS NULL)
    )
);

CREATE TABLE rooms(
    id SERIAL PRIMARY KEY,
    host_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_code TEXT UNIQUE NOT NULL,
    room_mode TEXT NOT NULL CHECK (room_mode IN ('SOLO', 'TEAM')),
    state TEXT NOT NULL CHECK (state IN ('CREATED', 'LOBBY', 'LIVE', 'ENDED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teams(
    id SERIAL PRIMARY KEY,
    room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(room_id, team_name)
);

CREATE TABLE room_users(
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('host', 'player')),
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, room_id)
);

CREATE TABLE quizzes(
    id SERIAL PRIMARY KEY,
    room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    duration_seconds INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE TABLE questions(
    id SERIAL PRIMARY KEY,
    quizzes_id INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_options TEXT[] NOT NULL,
    correct_option INT NOT NULL,
    question_order INT NOT NULL,
    CONSTRAINT valid_options CHECK (array_length(question_options, 1) = 4),
    CONSTRAINT valid_correct_option CHECK (correct_option BETWEEN 1 AND 4)
);

-- Single submission per team (multiplayer) OR per user (solo)
CREATE TABLE submissions(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    quiz_id INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    questions_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option INT NOT NULL CHECK (selected_option BETWEEN 1 AND 4),
    submitted_at TIMESTAMP DEFAULT NOW(),

    -- Constraint: Either solo (user only) or team (team only)
    CONSTRAINT solo_or_team CHECK (
        (team_id IS NULL AND user_id IS NOT NULL) OR
        (team_id IS NOT NULL AND user_id IS NOT NULL)
    )
    
    -- One submission per entity per question
    -- UNIQUE(COALESCE(team_id, -1), questions_id)
);

-- Leaderboard: Team-based for multiplayer, User-based for solo
CREATE TABLE leaderboard(
    id SERIAL PRIMARY KEY,
    room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,    -- Solo mode
    team_id INT REFERENCES teams(id) ON DELETE CASCADE,    -- Team mode
    score INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT solo_or_team CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR
        (user_id IS NULL AND team_id IS NOT NULL)
    ),
    UNIQUE(room_id, user_id, team_id)
);

CREATE UNIQUE INDEX unique_team_question
ON submissions (COALESCE(team_id, -1), questions_id);