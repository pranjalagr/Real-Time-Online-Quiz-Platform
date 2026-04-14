import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { connectSocket, disconnectSocket } from '../socket/socketclient.js';

const AppStateContext = createContext(null);

const TOKEN_KEY = 'quiz_token';
const USER_KEY = 'quiz_user';

export function AppStateProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [socketStatus, setSocketStatus] = useState('offline');

  useEffect(() => {
    if (!token) {
      setSocketStatus('offline');
      disconnectSocket();
      return undefined;
    }

    const socket = connectSocket(token);
    const onConnect = () => setSocketStatus('online');
    const onDisconnect = () => setSocketStatus('offline');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setSocketStatus(socket.connected ? 'online' : 'connecting');

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [token]);

  const loginWithPayload = (payload) => {
    const nextToken = payload?.data?.token || payload?.data?.token?.replace?.(/^Bearer\s+/i, '');
    const nextUser = payload?.data?.user || null;

    if (!nextToken) {
      throw new Error('Token missing from login response');
    }

    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken('');
    setUser(null);
    disconnectSocket();
    setSocketStatus('offline');
  };

  const refreshProfile = async () => {
    if (!token) {
      return null;
    }
    const response = await api.getMe(token);
    setUser(response.data);
    localStorage.setItem(USER_KEY, JSON.stringify(response.data));
    return response.data;
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      socketStatus,
      loginWithPayload,
      logout,
      refreshProfile
    }),
    [socketStatus, token, user]
  );

  return createElement(AppStateContext.Provider, { value }, children);
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used inside AppStateProvider');
  }
  return context;
}
