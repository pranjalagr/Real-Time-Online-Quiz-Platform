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
    auth: { token },
    transports: ['websocket'], // 👈 FORCE WEBSOCKETS ONLY
    withCredentials: true
  });  
  return socket;
}

export function getSocket() {
  return socket;
}

export function emitSocket(eventName, payload) {
  return new Promise((resolve, reject) => {
    const activeSocket = getSocket();

    if (!activeSocket) {
      reject(new Error('Socket is not connected'));
      return;
    }

    activeSocket.emit(eventName, payload, (response) => {
      if (response?.success) {
        resolve(response);
        return;
      }

      reject(new Error(response?.error || 'Socket event failed'));
    });
  });
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
