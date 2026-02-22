import { supabase } from './supabase.js';

/**
 * Registers a user with email and password.
 * @param {string} email
 * @param {string} password
 */
export async function registerUser(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });

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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Logs out the current user.
 */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

/**
 * Gets active auth session user.
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}
