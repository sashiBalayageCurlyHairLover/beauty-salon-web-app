import { supabase } from './supabase.js';

function getDbClient() {
  if (!supabase) {
    throw new Error('Data access is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  return supabase;
}

/**
 * Lists active suggested services with prices.
 */
export async function listSuggestedServices() {
  const db = getDbClient();

  const { data, error } = await db
    .from('services')
    .select('id, name, description, duration_minutes, price, is_active, categories(name)')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    duration_minutes: service.duration_minutes,
    price: service.price,
    category_name: service.categories?.name || null
  }));
}
