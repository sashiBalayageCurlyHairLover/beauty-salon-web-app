import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const adminEmail = process.env.SUPABASE_ADMIN_EMAIL;
const adminPassword = process.env.SUPABASE_ADMIN_PASSWORD;

if (!supabaseUrl) {
  console.error('Missing SUPABASE_URL environment variable.');
  process.exit(1);
}

function createSupabaseClient(apiKey) {
  return createClient(supabaseUrl, apiKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

async function getSeedClient() {
  if (serviceRoleKey) {
    return createSupabaseClient(serviceRoleKey);
  }

  if (!supabaseAnonKey || !adminEmail || !adminPassword) {
    console.error(
      'Provide SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY + SUPABASE_ADMIN_EMAIL + SUPABASE_ADMIN_PASSWORD.'
    );
    process.exit(1);
  }

  const adminClient = createSupabaseClient(supabaseAnonKey);
  const { error } = await adminClient.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword
  });

  if (error) {
    throw new Error(`Admin sign-in failed: ${error.message}`);
  }

  return adminClient;
}

const categoriesSeed = [
  {
    name: 'Hair',
    description: 'Haircuts, styling, and hair treatments'
  },
  {
    name: 'Nails',
    description: 'Manicure and pedicure services'
  }
];

const servicesSeed = [
  {
    name: 'Signature Haircut',
    category: 'Hair',
    description: 'Premium haircut and finish',
    duration_minutes: 60,
    price: 55.0
  },
  {
    name: 'Luxury Manicure',
    category: 'Nails',
    description: 'Full manicure with premium polish',
    duration_minutes: 45,
    price: 40.0
  },
  {
    name: 'Express Blowout',
    category: 'Hair',
    description: 'Quick wash and blowout styling',
    duration_minutes: 30,
    price: 35.0
  }
];

const staffSeed = [
  {
    full_name: 'Sophia Reed',
    role: 'Hair Stylist',
    bio: 'Specializes in modern cuts and styling.'
  },
  {
    full_name: 'Mia Hart',
    role: 'Nail Artist',
    bio: 'Focuses on elegant manicure designs.'
  },
  {
    full_name: 'Noah Blake',
    role: 'Stylist',
    bio: 'Expert in quick and polished blowouts.'
  }
];

const appointmentAssignments = [
  {
    notes: 'Sample appointment for Amanda',
    serviceName: 'Signature Haircut',
    staffName: 'Sophia Reed'
  },
  {
    notes: 'Sample appointment for Linda',
    serviceName: 'Luxury Manicure',
    staffName: 'Mia Hart'
  },
  {
    notes: 'Sample appointment for Tony',
    serviceName: 'Express Blowout',
    staffName: 'Noah Blake'
  }
];

async function ensureCategory(supabase, seedItem) {
  const { data: existing, error: selectError } = await supabase
    .from('categories')
    .select('id')
    .eq('name', seedItem.name)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing.id;

  const { data: inserted, error: insertError } = await supabase
    .from('categories')
    .insert({
      name: seedItem.name,
      description: seedItem.description
    })
    .select('id')
    .single();

  if (insertError) throw insertError;
  return inserted.id;
}

async function ensureService(supabase, seedItem, categoryId) {
  const { data: existing, error: selectError } = await supabase
    .from('services')
    .select('id')
    .eq('name', seedItem.name)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing.id;

  const { data: inserted, error: insertError } = await supabase
    .from('services')
    .insert({
      category_id: categoryId,
      name: seedItem.name,
      description: seedItem.description,
      duration_minutes: seedItem.duration_minutes,
      price: seedItem.price,
      is_active: true
    })
    .select('id')
    .single();

  if (insertError) throw insertError;
  return inserted.id;
}

async function ensureStaff(supabase, seedItem) {
  const { data: existing, error: selectError } = await supabase
    .from('staff')
    .select('id')
    .eq('full_name', seedItem.full_name)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing.id;

  const { data: inserted, error: insertError } = await supabase
    .from('staff')
    .insert({
      full_name: seedItem.full_name,
      role: seedItem.role,
      bio: seedItem.bio,
      is_active: true
    })
    .select('id')
    .single();

  if (insertError) throw insertError;
  return inserted.id;
}

async function linkAppointment(supabase, notes, serviceId, staffId) {
  const { data: appointment, error: selectError } = await supabase
    .from('appointments')
    .select('id')
    .eq('notes', notes)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) throw selectError;
  if (!appointment) {
    return { linked: false, reason: 'appointment_not_found' };
  }

  const { error: updateError } = await supabase
    .from('appointments')
    .update({
      service_id: serviceId,
      staff_id: staffId
    })
    .eq('id', appointment.id);

  if (updateError) throw updateError;

  return { linked: true, appointmentId: appointment.id };
}

async function main() {
  const seedClient = await getSeedClient();

  const categoryMap = new Map();
  const serviceMap = new Map();
  const staffMap = new Map();

  for (const category of categoriesSeed) {
    const id = await ensureCategory(seedClient, category);
    categoryMap.set(category.name, id);
  }

  for (const service of servicesSeed) {
    const categoryId = categoryMap.get(service.category);
    const id = await ensureService(seedClient, service, categoryId);
    serviceMap.set(service.name, id);
  }

  for (const staffMember of staffSeed) {
    const id = await ensureStaff(seedClient, staffMember);
    staffMap.set(staffMember.full_name, id);
  }

  const assignmentResults = [];

  for (const assignment of appointmentAssignments) {
    const serviceId = serviceMap.get(assignment.serviceName);
    const staffId = staffMap.get(assignment.staffName);

    const result = await linkAppointment(seedClient, assignment.notes, serviceId, staffId);

    assignmentResults.push({
      notes: assignment.notes,
      service: assignment.serviceName,
      staff: assignment.staffName,
      linked: result.linked,
      appointment_id: result.appointmentId ?? null,
      reason: result.reason ?? null
    });
  }

  console.table(assignmentResults);
}

main().catch((error) => {
  console.error('Reference seeding failed:', error.message ?? error);
  process.exit(1);
});
