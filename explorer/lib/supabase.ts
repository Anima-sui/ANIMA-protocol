import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants";

const supabaseUrl = SUPABASE_URL || "https://placeholder-url-for-build.supabase.co";
const supabaseAnonKey = SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
