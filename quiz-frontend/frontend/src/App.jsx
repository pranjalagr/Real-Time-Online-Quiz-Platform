import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppStateProvider, useAppState } from './state/quizstate.js';
import { Loginpage } from './auth/login.jsx';
import { Registerpage } from './auth/register.jsx';
import Home from './Home.jsx';
import LobbyPage from './pages/lobby.jsx';
import QuizPage from './pages/quiz.jsx';
import QuizHostPage from './pages/quizhost.jsx';
import LeaderboardPage from './pages/leaderboard.jsx';
import ResultsPage from './pages/results.jsx';
import './App.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAppState();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Loginpage />} />
      <Route path="/register" element={<Registerpage />} />
      <Route
        path="/rooms/:roomId/lobby"
        element={
          <ProtectedRoute>
            <LobbyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rooms/:roomId/host"
        element={
          <ProtectedRoute>
            <QuizHostPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rooms/:roomId/quiz"
        element={
          <ProtectedRoute>
            <QuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rooms/:roomId/leaderboard"
        element={
          <ProtectedRoute>
            <LeaderboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <ResultsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppStateProvider>
      <AppRoutes />
    </AppStateProvider>
  );
}

export default App;
