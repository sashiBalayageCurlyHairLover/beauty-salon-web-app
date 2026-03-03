import { getCurrentUser, getUserRole } from '../services/auth.service.js';

/**
 * Requires authenticated user and redirects to login when missing.
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    window.location.href = '/login/';
    throw new Error('Authentication required.');
  }

  return user;
}

/**
 * Requires admin role and redirects to home when unauthorized.
 */
export async function requireAdmin() {
  const user = await requireAuth();
  const role = await getUserRole(user.id);

  if (role !== 'admin') {
    window.location.href = '/';
    throw new Error('Admin role required.');
  }

  return user;
}
