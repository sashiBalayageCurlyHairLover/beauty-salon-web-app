import { listServiceOptions, listStaffOptions } from './appointments.service.js';
import { supabase } from './supabase.js';

function getDbClient() {
  if (!supabase) {
    throw new Error('Data access is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  return supabase;
}

async function listUserDetailsByIds(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return new Map();
  }

  const db = getDbClient();

  const [appUsersResult, profilesResult, rolesResult] = await Promise.all([
    db.from('app_users').select('id, email, created_at').in('id', userIds),
    db.from('profiles').select('id, full_name, phone').in('id', userIds),
    db.from('user_roles').select('user_id, role').in('user_id', userIds)
  ]);

  if (appUsersResult.error) {
    throw appUsersResult.error;
  }

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  if (rolesResult.error) {
    throw rolesResult.error;
  }

  const detailsById = new Map();

  for (const appUser of appUsersResult.data ?? []) {
    detailsById.set(appUser.id, {
      id: appUser.id,
      email: appUser.email,
      created_at: appUser.created_at,
      full_name: null,
      phone: null,
      role: 'client'
    });
  }

  for (const profile of profilesResult.data ?? []) {
    const existing = detailsById.get(profile.id) || { id: profile.id, role: 'client' };
    detailsById.set(profile.id, {
      ...existing,
      full_name: profile.full_name,
      phone: profile.phone
    });
  }

  for (const roleRow of rolesResult.data ?? []) {
    const existing = detailsById.get(roleRow.user_id) || { id: roleRow.user_id };
    detailsById.set(roleRow.user_id, {
      ...existing,
      role: roleRow.role || 'client'
    });
  }

  return detailsById;
}

/**
 * Lists all appointments for admin.
 */
export async function listAdminAppointments() {
  const db = getDbClient();

  const { data, error } = await db
    .from('appointments')
    .select('id, client_id, appointment_date, appointment_time, status, notes, created_at, service_id, staff_id, services(name), staff(full_name)')
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false });

  if (error) {
    throw error;
  }

  const appointments = data ?? [];
  const clientIds = [...new Set(appointments.map((item) => item.client_id).filter(Boolean))];
  const detailsById = await listUserDetailsByIds(clientIds);

  return appointments.map((appointment) => ({
    ...appointment,
    client: detailsById.get(appointment.client_id) || null
  }));
}

/**
 * Gets appointment by id for admin.
 * @param {string} appointmentId
 */
export async function getAdminAppointmentById(appointmentId) {
  const db = getDbClient();

  const { data, error } = await db
    .from('appointments')
    .select('id, client_id, appointment_date, appointment_time, status, notes, created_at, service_id, staff_id, services(name), staff(full_name)')
    .eq('id', appointmentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const detailsById = await listUserDetailsByIds([data.client_id]);

  return {
    ...data,
    client: detailsById.get(data.client_id) || null
  };
}

/**
 * Updates an appointment for admin.
 * @param {string} appointmentId
 * @param {{appointment_date:string, appointment_time:string, status:string, notes:string|null, service_id:string|null, staff_id:string|null}} payload
 */
export async function updateAdminAppointment(appointmentId, payload) {
  const db = getDbClient();

  const { data, error } = await db
    .from('appointments')
    .update({
      appointment_date: payload.appointment_date,
      appointment_time: payload.appointment_time,
      status: payload.status,
      notes: payload.notes,
      service_id: payload.service_id,
      staff_id: payload.staff_id
    })
    .eq('id', appointmentId)
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Deletes an appointment for admin.
 * @param {string} appointmentId
 */
export async function deleteAdminAppointment(appointmentId) {
  const db = getDbClient();

  const { error } = await db.from('appointments').delete().eq('id', appointmentId);

  if (error) {
    throw error;
  }
}

/**
 * Lists users for admin management.
 */
export async function listAdminUsers() {
  const db = getDbClient();

  const { data, error } = await db.from('app_users').select('id, email, created_at').order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const users = data ?? [];
  const userIds = users.map((item) => item.id);
  const detailsById = await listUserDetailsByIds(userIds);

  return users.map((user) => {
    const detail = detailsById.get(user.id) || {};

    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      full_name: detail.full_name || null,
      phone: detail.phone || null,
      role: detail.role || 'client'
    };
  });
}

/**
 * Gets one user by id for admin.
 * @param {string} userId
 */
export async function getAdminUserById(userId) {
  const detailsById = await listUserDetailsByIds([userId]);
  const user = detailsById.get(userId);

  return user || null;
}

/**
 * Updates user profile and role by admin.
 * @param {{userId:string, fullName:string|null, phone:string|null, role:'admin'|'client'}} payload
 */
export async function updateAdminUser(payload) {
  const db = getDbClient();
  const { userId, fullName, phone, role } = payload;

  if (!['admin', 'client'].includes(role)) {
    throw new Error('Invalid role.');
  }

  const [profileResult, roleResult] = await Promise.all([
    db
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name: fullName,
          phone
        },
        { onConflict: 'id' }
      )
      .select('id')
      .single(),
    db
      .from('user_roles')
      .upsert(
        {
          user_id: userId,
          role
        },
        { onConflict: 'user_id' }
      )
      .select('user_id')
      .single()
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (roleResult.error) {
    throw roleResult.error;
  }

  return {
    id: userId
  };
}

/**
 * Deletes a user account by admin.
 * @param {string} userId
 */
export async function deleteAdminUser(userId) {
  const db = getDbClient();

  const { error } = await db.rpc('admin_delete_user', {
    target_user_id: userId
  });

  if (error) {
    throw error;
  }
}

export { listServiceOptions, listStaffOptions };
