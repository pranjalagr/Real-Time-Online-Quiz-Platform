import { api } from '../api/client.js';

export async function login(email, password) {
  return api.login({ email, password });
}

export async function register(email, password) {
  return api.register({ email, password });
}

export async function createGuest(username) {
  return api.guest({ username });
}
