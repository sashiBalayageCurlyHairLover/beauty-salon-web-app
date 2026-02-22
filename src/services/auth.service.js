import { supabase } from './supabase.js';

function getAuthClient() {
  if (!supabase) {
    throw new Error('Auth is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  return supabase;
}

/**
 * Registers a user with email and password.
 * @param {string} email
 * @param {string} password
 */
export async function registerUser(email, password) {
  const authClient = getAuthClient();
  const { data, error } = await authClient.auth.signUp({ email, password });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Logs in a user with email and password.
 * @param {string} email
 * @param {string} password
 */
export async function loginUser(email, password) {
  const authClient = getAuthClient();
  const { data, error } = await authClient.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Logs out the current user.
 */
export async function logoutUser() {
  const authClient = getAuthClient();
  const { error } = await authClient.auth.signOut();

  if (error) {
    throw error;
  }
}

/**
 * Gets active auth session user.
 */
export async function getCurrentUser() {
  const authClient = getAuthClient();
  const { data, error } = await authClient.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}
