const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

function buildHeaders(token, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function request(path, { method = 'GET', token, body, headers } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: buildHeaders(token, headers),
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Request failed');
  }

  return payload;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  guest: (body) => request('/auth/guest', { method: 'POST', body }),
  getMe: (token) => request('/users/me', { token }),
  createRoom: (token, body) => request('/rooms/create', { method: 'POST', token, body }),
  joinRoom: (token, body) => request('/rooms/join', { method: 'POST', token, body }),
  getRoom: (token, roomId) => request(`/rooms/${roomId}`, { token }),
  startRoomQuiz: (token, roomId) => request(`/rooms/${roomId}/start`, { method: 'POST', token }),
  endRoomQuiz: (token, roomId) => request(`/rooms/${roomId}/end`, { method: 'POST', token }),
  getRoomLeaderboard: (token, roomId) => request(`/rooms/${roomId}/leaderboard`, { token }),
  createQuiz: (token, body) => request('/quizzes', { method: 'POST', token, body }),
  getQuiz: (token, quizId) => request(`/quizzes/${quizId}`, { token }),
  getQuizQuestions: (token, quizId) => request(`/quizzes/${quizId}/questions`, { token }),
  createPdfUpload: (token, body) => request('/quizzes/pdf/upload', { method: 'POST', token, body }),
  finalizePdfQuiz: (token, body) => request('/quizzes/pdf/finalize', { method: 'POST', token, body }),
  getPdfJobStatus: (token, jobId) => request(`/quizzes/pdf/jobs/${jobId}`, { token }),
  submitAnswer: (token, roomId, questionId, body) =>
    request(`/rooms/${roomId}/questions/${questionId}/submit`, {
      method: 'POST',
      token,
      body
    })
};

export async function uploadFileToPresignedUrl(uploadUrl, file) {
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/pdf'
      },
      body: file
    });

    if (!response.ok) {
      throw new Error('Failed to upload file to S3');
    }

    return true;
  } catch (error) {
    throw new Error(
      'Could not upload PDF to S3. This is usually an S3 CORS or bucket configuration issue.'
    );
  }
}
