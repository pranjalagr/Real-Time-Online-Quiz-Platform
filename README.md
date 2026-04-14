# Real-Time Online Quiz Platform

A full-stack quiz platform for hosting and playing live quizzes in real time. Hosts can create rooms, generate quizzes from a topic or a PDF, and run quiz sessions for players joining through room codes. The platform is designed for both individual and team-based play, with live leaderboard updates powered by WebSockets.

## Overview

This project is built around a host-and-player flow:

- Hosts sign in with email and password
- Hosts create a room and choose a quiz mode
- Quizzes can be created from a topic or from a PDF
- Players join using a room code and a display name
- The host starts the quiz and answers are submitted live
- Leaderboards update in real time as the game progresses

The system is structured as a full-stack app with a Node.js backend and a React frontend.

## Core Features

- Host authentication and guest player join flow
- Live room creation and join by room code
- Solo and team-based quiz modes
- Quiz creation from topic prompts
- Quiz generation from uploaded PDFs
- Real-time gameplay using Socket.IO
- Live leaderboard updates
- PostgreSQL-backed persistence for users, rooms, quizzes, questions, submissions, and leaderboard state

## Quiz Generation Modes

### 1. Topic-based quiz generation

The host provides a topic and question requirements, and the backend generates quiz questions through an LLM-based workflow.

### 2. PDF-based quiz generation

The host uploads a PDF and the backend processes it through a document pipeline:

- the backend creates a presigned upload URL
- the frontend uploads the PDF to S3
- a Redis-backed queue stores the processing job
- workers extract text and process the PDF
- a RAG-style flow is used to generate quiz questions from the content

The architecture also supports adding prompt-based refinements so hosts can request extra questions or guide the generation style.

## Architecture Notes

The platform is designed around these main ideas:

- `Host`: creates rooms, creates quizzes, starts the game
- `Player`: joins with a name and plays the quiz
- `Room`: manages players, host, game mode, and lifecycle
- `Quiz Engine`: controls question delivery, submissions, and scoring
- `Leaderboard`: updates continuously during live play
- `WebSockets`: keep gameplay and leaderboard updates live
- `Pub/Sub`: intended for scaling leaderboard updates across multiple server instances

## Project Structure

```text
quiz-project/
  quiz-backend/
    src/
      app.js
      server.js
      db/
      routes/
      controllers/
      services/
      socket/
      repositories/
      workers/
  quiz-frontend/
    frontend/
      src/
      public/
```

## Backend Stack

- Node.js
- Express
- PostgreSQL
- Socket.IO
- Redis / queue-based background processing
- AWS S3 for PDF upload flow

## Frontend Stack

- React
- Vite
- React Router
- Socket.IO client

## Database

The schema currently includes tables for:

- `users`
- `rooms`
- `teams`
- `room_users`
- `quizzes`
- `questions`
- `submissions`
- `leaderboard`

The schema file is available at [quiz-backend/src/db/schema.sql](C:/Users/AAAA/OneDrive/Documents/Desktop/quiz-project/quiz-backend/src/db/schema.sql).

## Local Setup

### Backend

From `quiz-backend/`:

```bash
npm install
npm run start
```

The backend uses environment variables such as:

- `PORT`
- `NODE_ENV`
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_PORT`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `REDIS_HOST`
- `REDIS_PORT`
- `LLM_API_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`

### Frontend

From `quiz-frontend/frontend/`:

```bash
npm install
npm run dev
```

The frontend currently uses:

- `VITE_API_BASE`
- `VITE_SOCKET_URL`

An example frontend env file already exists at [quiz-frontend/frontend/.env.example](C:/Users/AAAA/OneDrive/Documents/Desktop/quiz-project/quiz-frontend/frontend/.env.example).

## Current Flow

1. Host logs in
2. Host creates a room and selects a mode
3. Host creates a quiz from a topic or PDF
4. Players join through the room code
5. The room enters the lobby
6. Host starts the quiz
7. Players or teams submit answers in real time
8. Leaderboard updates live during the session

## Future Work

- Add benchmark and performance notes
- Add automated tests
- Improve multi-server pub/sub deployment support
- Add clearer API documentation and deployment steps
- Expand quiz analytics and moderation/admin tools

## Notes

- Hosts authenticate with email/password
- Players can join quickly with just a display name
- Team mode is part of the project architecture and gameplay flow
- The architecture notes for the project are also captured in [quiz-backend/arch.txt](C:/Users/AAAA/OneDrive/Documents/Desktop/quiz-project/quiz-backend/arch.txt)
