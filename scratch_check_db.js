const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking database...");
  
  // 1. Check if profiles table exists
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);
    
  if (profilesError) {
    console.error("❌ Error accessing 'profiles' table:");
    console.error(profilesError.message);
  } else {
    console.log("✅ 'profiles' table exists and is accessible.");
  }
  
  console.log("\nAttempting to create a test user to capture the 500 error via signUp...");
  const { data: userData, error: userError } = await supabase.auth.signUp({
    email: 'test_trigger_error2@example.com',
    password: 'password123',
    options: {
      data: {
        full_name: 'Test User',
        role: 'customer'
      }
    }
  });

  if (userError) {
    console.error("❌ Error creating user via signUp:");
    console.error(userError.message);
    if (userError.status === 500) {
       console.log("The 500 error is confirmed. Checking database logs...");
    }
  } else {
    console.log("✅ User created successfully! No trigger error.");
  }
}

check();
