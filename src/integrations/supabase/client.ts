import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = "https://owpnedmbicblvegtfkod.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93cG5lZG1iaWNibHZlZ3Rma29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjgwNTgsImV4cCI6MjA2Mzc0NDA1OH0.ABoQ3GPX1x6v30We8V3mRdQCGjMb-n-wIQ6pip2oY-U";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
});
