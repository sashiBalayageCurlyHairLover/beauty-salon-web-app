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

  const userId = data.user?.id;

  if (userId) {
    const { error: profileError } = await authClient.from('profiles').upsert({ id: userId }, { onConflict: 'id' });
    if (profileError) {
      throw profileError;
    }

    const { error: roleError } = await authClient
      .from('user_roles')
      .upsert({ user_id: userId, role: 'client' }, { onConflict: 'user_id' });

    if (roleError) {
      throw roleError;
    }
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

/**
 * Gets role for a given user id.
 * @param {string} userId
 */
export async function getUserRole(userId) {
  if (!userId) {
    return null;
  }

  const authClient = getAuthClient();
  const { data, error } = await authClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.role || null;
}

/**
 * Gets current authenticated user's role.
 */
export async function getCurrentUserRole() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return getUserRole(user.id);
}

/**
 * Indicates whether current user is an admin.
 */
export async function isCurrentUserAdmin() {
  const role = await getCurrentUserRole();
  return role === 'admin';
}
