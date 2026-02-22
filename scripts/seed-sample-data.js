import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const usersToSeed = [
  {
    email: 'amanda_02@gmail.com',
    password: 'amanda_123',
    fullName: 'Amanda'
  },
  {
    email: 'linda_awesome1@gmail.com',
    password: 'linda_awesome1!',
    fullName: 'Linda Awesome'
  },
  {
    email: 'tony_best@gmail.com',
    password: 'tony_best123',
    fullName: 'Tony Best'
  }
];

const appointmentSeeds = [
  { appointment_date: '2026-03-01', appointment_time: '10:00:00', notes: 'Sample appointment for Amanda' },
  { appointment_date: '2026-03-02', appointment_time: '11:00:00', notes: 'Sample appointment for Linda' },
  { appointment_date: '2026-03-03', appointment_time: '12:00:00', notes: 'Sample appointment for Tony' }
];

function createUserClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

async function ensureSignedInUser(client, user) {
  const signUpResult = await client.auth.signUp({
    email: user.email,
    password: user.password,
    options: {
      data: {
        full_name: user.fullName
      }
    }
  });

  if (signUpResult.error && !/already registered|already exists/i.test(signUpResult.error.message)) {
    throw signUpResult.error;
  }

  const signInResult = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password
  });

  if (signInResult.error) {
    throw signInResult.error;
  }

  if (!signInResult.data.user) {
    throw new Error(`Unable to sign in user ${user.email}.`);
  }

  return signInResult.data.user;
}

async function ensureOwnProfile(client, userId, fullName) {
  const { error } = await client.from('profiles').upsert(
    {
      id: userId,
      full_name: fullName
    },
    { onConflict: 'id' }
  );

  if (error) {
    throw error;
  }
}

async function ensureOneAppointment(client, userId, appointmentSeed) {
  const { data: existing, error: fetchError } = await client
    .from('appointments')
    .select('id')
    .eq('client_id', userId)
    .limit(1);

  if (fetchError) {
    throw fetchError;
  }

  if (existing && existing.length > 0) {
    return { created: false, id: existing[0].id };
  }

  const { data: inserted, error: insertError } = await client
    .from('appointments')
    .insert({
      client_id: userId,
      appointment_date: appointmentSeed.appointment_date,
      appointment_time: appointmentSeed.appointment_time,
      notes: appointmentSeed.notes,
      status: 'pending'
    })
    .select('id')
    .single();

  if (insertError) {
    throw insertError;
  }

  return { created: true, id: inserted.id };
}

async function main() {
  const results = [];

  for (let index = 0; index < usersToSeed.length; index += 1) {
    const userSeed = usersToSeed[index];
    const appointmentSeed = appointmentSeeds[index];
    const client = createUserClient();

    const user = await ensureSignedInUser(client, userSeed);
    await ensureOwnProfile(client, user.id, userSeed.fullName);
    const appointmentResult = await ensureOneAppointment(client, user.id, appointmentSeed);

    results.push({
      email: userSeed.email,
      user_id: user.id,
      appointment_id: appointmentResult.id,
      appointment_created: appointmentResult.created
    });

    await client.auth.signOut();
  }

  console.table(results);
}

main().catch((error) => {
  console.error('Seeding failed:', error.message ?? error);
  process.exit(1);
});
