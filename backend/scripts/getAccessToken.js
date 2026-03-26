import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function main() {
  const email = 'student@gmail.com'; // student@gmail.com
  const password = '123'; //123  

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign-in error:', error);
    process.exit(1);
  }

  console.log('Access token:', data.session.access_token);
}

main();