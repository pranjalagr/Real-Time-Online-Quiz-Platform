import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import QuestionCard from '../components/questioncard.jsx';
import Timer from '../components/timer.jsx';
import { useAppState } from '../state/quizstate.js';

function QuizPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAppState();
  const [room, setRoom] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadQuiz = async () => {
    try {
      const roomResponse = await api.getRoom(token, roomId);
      const activeRoom = roomResponse.data;
      setRoom(activeRoom);

      if (activeRoom.state === 'ENDED') {
        navigate(`/rooms/${roomId}/leaderboard`);
        return;
      }

      if (!activeRoom.currentQuiz) {
        throw new Error('Quiz not ready yet');
      }

      const questionsResponse = await api.getQuizQuestions(token, activeRoom.currentQuiz.id);
      setQuestions(questionsResponse.data || []);
      setSecondsRemaining(Number(activeRoom.currentQuiz.duration_seconds || 0));
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
  }, [roomId, token]);

  useEffect(() => {
    if (!secondsRemaining) {
      return undefined;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining > 0]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSubmit = async () => {
    if (!currentQuestion || !selectedOption || !room?.currentQuiz) {
      return;
    }

    try {
      const submission = await api.submitAnswer(token, roomId, currentQuestion.id, {
        selectedOption,
        quizId: room.currentQuiz.id
      });

      setResult(submission.data);

      setTimeout(() => {
        if (isLastQuestion) {
          navigate(`/rooms/${roomId}/leaderboard`);
          return;
        }

        setCurrentIndex((current) => current + 1);
        setSelectedOption(null);
        setResult(null);
      }, 1000);
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  if (loading) {
    return <main className="page-shell"><section className="page-card">Loading quiz...</section></main>;
  }

  return (
    <main className="page-shell">
      <section className="page-card quiz-layout">
        <div className="page-header">
          <div>
            <p className="eyebrow">Player View</p>
            <h1>Room {room?.room_code}</h1>
            <p className="muted-copy">Answer each question once. Scores update when answers are submitted.</p>
          </div>
          <Timer seconds={secondsRemaining} />
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <QuestionCard
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          selectedOption={selectedOption}
          onSelect={setSelectedOption}
          onSubmit={handleSubmit}
          isSubmitted={Boolean(result)}
          result={result}
        />

        <div className="panel-card compact-panel">
          <div className="panel-header">
            <h3>Session Details</h3>
            <span className="status-pill">Player #{user?.userId || user?.id}</span>
          </div>
          <p className="muted-copy">
            Current quiz id: {room?.currentQuiz?.id}. Progress: {Math.min(currentIndex + 1, questions.length)} / {questions.length || 0}
          </p>
        </div>
      </section>
    </main>
  );
}

export default QuizPage;
