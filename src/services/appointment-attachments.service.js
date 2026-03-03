import { supabase } from './supabase.js';

const APPOINTMENT_ATTACHMENTS_BUCKET = 'appointment-attachments';

function getDbClient() {
  if (!supabase) {
    throw new Error('Data access is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  return supabase;
}

function buildStoragePath(appointmentId, fileName) {
  const safeName = String(fileName || 'attachment')
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_');

  return `${appointmentId}/${crypto.randomUUID()}-${safeName}`;
}

function getFileExtension(fileName) {
  const safeName = String(fileName || '');
  const lastDot = safeName.lastIndexOf('.');

  if (lastDot === -1 || lastDot === safeName.length - 1) {
    return null;
  }

  return safeName.slice(lastDot + 1).toLowerCase();
}

/**
 * Lists attachments for an appointment.
 * @param {string} appointmentId
 */
export async function listAppointmentAttachments(appointmentId) {
  const db = getDbClient();

  const { data, error } = await db
    .from('appointment_attachments')
    .select('id, appointment_id, file_name, file_ext, mime_type, file_size, storage_path, created_at')
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Uploads and records new appointment attachments.
 * @param {{appointmentId:string,userId:string,files:File[]}} args
 */
export async function uploadAppointmentAttachments({ appointmentId, userId, files }) {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const db = getDbClient();
  const uploadedPaths = [];
  const rows = [];

  try {
    for (const file of files) {
      const storagePath = buildStoragePath(appointmentId, file.name);

      const { error: uploadError } = await db.storage.from(APPOINTMENT_ATTACHMENTS_BUCKET).upload(storagePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false
      });

      if (uploadError) {
        throw uploadError;
      }

      uploadedPaths.push(storagePath);
      rows.push({
        appointment_id: appointmentId,
        uploaded_by: userId,
        file_name: file.name,
        file_ext: getFileExtension(file.name),
        mime_type: file.type || 'application/octet-stream',
        file_size: file.size,
        bucket_name: APPOINTMENT_ATTACHMENTS_BUCKET,
        storage_path: storagePath
      });
    }

    const { data, error } = await db
      .from('appointment_attachments')
      .insert(rows)
      .select('id, appointment_id, file_name, file_ext, mime_type, file_size, storage_path, created_at');

    if (error) {
      throw error;
    }

    return data ?? [];
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await db.storage.from(APPOINTMENT_ATTACHMENTS_BUCKET).remove(uploadedPaths);
    }

    throw error;
  }
}

/**
 * Removes selected appointment attachments from storage and database.
 * @param {{appointmentId:string,attachmentIds:string[]}} args
 */
export async function removeAppointmentAttachments({ appointmentId, attachmentIds }) {
  if (!Array.isArray(attachmentIds) || attachmentIds.length === 0) {
    return;
  }

  const db = getDbClient();

  const { data: attachments, error: selectError } = await db
    .from('appointment_attachments')
    .select('id, storage_path')
    .eq('appointment_id', appointmentId)
    .in('id', attachmentIds);

  if (selectError) {
    throw selectError;
  }

  const existingAttachments = attachments ?? [];

  if (existingAttachments.length === 0) {
    return;
  }

  const paths = existingAttachments.map((item) => item.storage_path);

  const { error: storageError } = await db.storage.from(APPOINTMENT_ATTACHMENTS_BUCKET).remove(paths);

  if (storageError) {
    throw storageError;
  }

  const idsToDelete = existingAttachments.map((item) => item.id);

  const { error: deleteError } = await db
    .from('appointment_attachments')
    .delete()
    .eq('appointment_id', appointmentId)
    .in('id', idsToDelete);

  if (deleteError) {
    throw deleteError;
  }
}

/**
 * Applies remove/add attachment changes after an appointment has been saved.
 * @param {{appointmentId:string,userId:string,newFiles:File[],removeAttachmentIds:string[]}} args
 */
export async function syncAppointmentAttachments({ appointmentId, userId, newFiles, removeAttachmentIds }) {
  await removeAppointmentAttachments({ appointmentId, attachmentIds: removeAttachmentIds || [] });
  await uploadAppointmentAttachments({ appointmentId, userId, files: newFiles || [] });
}
