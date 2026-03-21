import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required in backend environment.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type SupabaseAuthUser = {
  email: string;
  name: string | null;
};

export async function validateSupabaseAccessToken(accessToken: string): Promise<SupabaseAuthUser | null> {
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user?.email) {
    return null;
  }

  return {
    email: data.user.email,
    name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
  };
}
