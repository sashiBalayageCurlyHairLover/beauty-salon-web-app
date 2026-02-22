import { supabase } from './supabase.js';

function getDbClient() {
  if (!supabase) {
    throw new Error('Data access is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  return supabase;
}

/**
 * Lists authenticated user's appointments.
 * @param {string} userId
 */
export async function listUserAppointments(userId) {
  const db = getDbClient();

  const { data, error } = await db
    .from('appointments')
    .select(
      'id, appointment_date, appointment_time, status, notes, service_id, staff_id, created_at, services(name), staff(full_name)'
    )
    .eq('client_id', userId)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Counts authenticated user's appointments.
 * @param {string} userId
 */
export async function countUserAppointments(userId) {
  const db = getDbClient();

  const { count, error } = await db
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', userId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

/**
 * Gets one authenticated user's appointment by id.
 * @param {string} userId
 * @param {string} appointmentId
 */
export async function getUserAppointmentById(userId, appointmentId) {
  const db = getDbClient();

  const { data, error } = await db
    .from('appointments')
    .select(
      'id, appointment_date, appointment_time, status, notes, created_at, service_id, staff_id, services(name), staff(full_name)'
    )
    .eq('client_id', userId)
    .eq('id', appointmentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Creates a new appointment for authenticated user.
 * @param {string} userId
 * @param {{appointment_date:string, appointment_time:string, status:string, notes:string|null, service_id:string|null, staff_id:string|null}} payload
 */
export async function createUserAppointment(userId, payload) {
  const db = getDbClient();

  const { data, error } = await db
    .from('appointments')
    .insert({
      client_id: userId,
      appointment_date: payload.appointment_date,
      appointment_time: payload.appointment_time,
      status: payload.status,
      notes: payload.notes,
      service_id: payload.service_id,
      staff_id: payload.staff_id
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Updates an appointment owned by authenticated user.
 * @param {string} userId
 * @param {string} appointmentId
 * @param {{appointment_date:string, appointment_time:string, status:string, notes:string|null, service_id:string|null, staff_id:string|null}} payload
 */
export async function updateUserAppointment(userId, appointmentId, payload) {
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
    .eq('client_id', userId)
    .eq('id', appointmentId)
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Deletes an appointment owned by authenticated user.
 * @param {string} userId
 * @param {string} appointmentId
 */
export async function deleteUserAppointment(userId, appointmentId) {
  const db = getDbClient();

  const { error } = await db
    .from('appointments')
    .delete()
    .eq('client_id', userId)
    .eq('id', appointmentId);

  if (error) {
    throw error;
  }
}

/**
 * Lists active services for appointment form options.
 */
export async function listServiceOptions() {
  const db = getDbClient();

  const { data, error } = await db
    .from('services')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Lists active staff for appointment form options.
 */
export async function listStaffOptions() {
  const db = getDbClient();

  const { data, error } = await db
    .from('staff')
    .select('id, full_name')
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}
