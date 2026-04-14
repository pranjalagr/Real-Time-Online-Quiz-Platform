import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, uploadFileToPresignedUrl } from '../api/client.js';
import ParticipantsList from '../components/participantslist.jsx';
import { useAppState } from '../state/quizstate.js';

function createBlankQuestion(order) {
  return {
    questionText: '',
    options: ['', '', '', ''],
    correctOption: 1,
    order
  };
}

function LobbyPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAppState();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [builderType, setBuilderType] = useState('manual');
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [manualQuestions, setManualQuestions] = useState([createBlankQuestion(1), createBlankQuestion(2)]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [numQuestions, setNumQuestions] = useState(5);
  const [jobMessage, setJobMessage] = useState('');
  const [busyAction, setBusyAction] = useState('');

  const loadRoom = async () => {
    try {
      const response = await api.getRoom(token, roomId);
      setRoom(response.data);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoom();
    const timer = setInterval(loadRoom, 5000);
    return () => clearInterval(timer);
  }, [roomId, token]);

  useEffect(() => {
    if (!room) {
      return;
    }

    if (room.state === 'LIVE' && room.currentQuiz) {
      if (Number(room.host_id) === Number(user?.userId || user?.id)) {
        navigate(`/rooms/${roomId}/host`);
      } else {
        navigate(`/rooms/${roomId}/quiz`);
      }
    }

    if (room.state === 'ENDED') {
      navigate(`/rooms/${roomId}/leaderboard`);
    }
  }, [navigate, room, roomId, user]);

  const isHost = useMemo(() => Number(room?.host_id) === Number(user?.userId || user?.id), [room, user]);

  const updateQuestion = (questionIndex, nextQuestion) => {
    setManualQuestions((current) => current.map((question, index) => (index === questionIndex ? nextQuestion : question)));
  };

  const addQuestion = () => {
    setManualQuestions((current) => [...current, createBlankQuestion(current.length + 1)]);
  };

  const saveManualQuiz = async () => {
    setBusyAction('manual');
    setError('');

    try {
      const payload = {
        roomId: Number(roomId),
        durationSeconds: Number(durationSeconds),
        questions: manualQuestions.map((question, index) => ({
          questionText: question.questionText,
          options: question.options,
          correctOption: Number(question.correctOption),
          order: index + 1
        }))
      };

      await api.createQuiz(token, payload);
      await loadRoom();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusyAction('');
    }
  };

  const savePdfQuiz = async () => {
    if (!selectedPdf) {
      setError('Choose a PDF file first.');
      return;
    }

    setBusyAction('pdf');
    setError('');
    setJobMessage('');

    try {
      const uploadResponse = await api.createPdfUpload(token, {
        roomId: Number(roomId),
        durationSeconds: Number(durationSeconds),
        numQuestions: Number(numQuestions)
      });

      await uploadFileToPresignedUrl(uploadResponse.data.uploadUrl, selectedPdf);

      const finalizeResponse = await api.finalizePdfQuiz(token, {
        quizId: uploadResponse.data.quizId
      });

      const jobId = finalizeResponse.data.jobId;
      setJobMessage(`PDF queued. Job ${jobId} is generating questions.`);

      let attempts = 0;
      while (attempts < 30) {
        attempts += 1;
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const status = await api.getPdfJobStatus(token, jobId);

        if (status.data.status === 'COMPLETED') {
          setJobMessage(`PDF generation complete. ${status.data.questionsCount} questions created.`);
          break;
        }

        if (status.data.status === 'FAILED') {
          throw new Error(status.data.error || 'PDF generation failed');
        }
      }

      await loadRoom();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusyAction('');
    }
  };

  const startQuiz = async () => {
    setBusyAction('start');
    setError('');

    try {
      await api.startRoomQuiz(token, roomId);
      await loadRoom();
    } catch (startError) {
      setError(startError.message);
    } finally {
      setBusyAction('');
    }
  };

  if (loading) {
    return <main className="page-shell"><section className="page-card">Loading room...</section></main>;
  }

  return (
    <main className="page-shell">
      <section className="page-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">Lobby</p>
            <h1>Room {room?.room_code}</h1>
            <p className="muted-copy">Share this code with players and prepare the quiz before going live.</p>
          </div>
          <div className="header-badges">
            <span className="status-chip">{room?.room_mode}</span>
            <span className="status-chip">{room?.state}</span>
          </div>
        </div>

        <div className="room-grid">
          <ParticipantsList users={room?.users || []} />

          <section className="panel-card">
            <div className="panel-header">
              <h3>Quiz Setup</h3>
              <span className="status-pill">{room?.currentQuiz ? 'Quiz Ready' : 'No Quiz Yet'}</span>
            </div>

            {isHost ? (
              <>
                <label>
                  <span>Duration (seconds)</span>
                  <input
                    type="number"
                    min="30"
                    value={durationSeconds}
                    onChange={(event) => setDurationSeconds(event.target.value)}
                  />
                </label>

                <div className="segmented-control">
                  <button
                    type="button"
                    className={builderType === 'manual' ? 'segmented active' : 'segmented'}
                    onClick={() => setBuilderType('manual')}
                  >
                    Manual Quiz
                  </button>
                  <button
                    type="button"
                    className={builderType === 'pdf' ? 'segmented active' : 'segmented'}
                    onClick={() => setBuilderType('pdf')}
                  >
                    PDF Quiz
                  </button>
                </div>

                {builderType === 'manual' ? (
                  <div className="builder-stack">
                    {manualQuestions.map((question, index) => (
                      <article className="manual-question-card" key={`question-${index + 1}`}>
                        <h4>Question {index + 1}</h4>
                        <input
                          value={question.questionText}
                          onChange={(event) =>
                            updateQuestion(index, { ...question, questionText: event.target.value })
                          }
                          placeholder="Enter the question text"
                        />

                        <div className="mini-grid">
                          {question.options.map((option, optionIndex) => (
                            <input
                              key={`option-${optionIndex + 1}`}
                              value={option}
                              onChange={(event) => {
                                const nextOptions = question.options.map((entry, currentIndex) =>
                                  currentIndex === optionIndex ? event.target.value : entry
                                );
                                updateQuestion(index, { ...question, options: nextOptions });
                              }}
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                          ))}
                        </div>

                        <label>
                          <span>Correct Option</span>
                          <select
                            value={question.correctOption}
                            onChange={(event) =>
                              updateQuestion(index, { ...question, correctOption: Number(event.target.value) })
                            }
                          >
                            <option value={1}>Option 1</option>
                            <option value={2}>Option 2</option>
                            <option value={3}>Option 3</option>
                            <option value={4}>Option 4</option>
                          </select>
                        </label>
                      </article>
                    ))}

                    <div className="inline-actions">
                      <button className="secondary-button" type="button" onClick={addQuestion}>
                        Add Another Question
                      </button>
                      <button className="primary-button" type="button" onClick={saveManualQuiz} disabled={busyAction === 'manual'}>
                        {busyAction === 'manual' ? 'Saving...' : 'Save Manual Quiz'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="builder-stack">
                    <label>
                      <span>Number Of Questions</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={numQuestions}
                        onChange={(event) => setNumQuestions(event.target.value)}
                      />
                    </label>

                    <label>
                      <span>PDF File</span>
                      <input type="file" accept="application/pdf" onChange={(event) => setSelectedPdf(event.target.files?.[0] || null)} />
                    </label>

                    <button className="primary-button" type="button" onClick={savePdfQuiz} disabled={busyAction === 'pdf'}>
                      {busyAction === 'pdf' ? 'Uploading & Queueing...' : 'Upload PDF And Generate'}
                    </button>

                    {jobMessage ? <p className="form-success">{jobMessage}</p> : null}
                  </div>
                )}

                {error ? <p className="form-error">{error}</p> : null}

                <div className="inline-actions">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={startQuiz}
                    disabled={!room?.currentQuiz || busyAction === 'start'}
                  >
                    {busyAction === 'start' ? 'Starting...' : 'Start Quiz'}
                  </button>
                </div>
              </>
            ) : (
              <p className="empty-state">
                Waiting for the host to finish quiz setup. This page refreshes automatically while the room stays in the lobby.
              </p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

export default LobbyPage;
