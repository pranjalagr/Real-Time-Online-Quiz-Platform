import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export function connectSocket(token) {
  if (!token) {
    return null;
  }

  if (socket) {
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  socket = io(SOCKET_URL, {
    autoConnect: true,
    auth: { token }
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
