"use client";
import { createClient } from "@supabase/supabase-js";

// Browser client (anon key). Only used to push bytes to a pre-signed upload
// URL — all authorization is enforced server-side when minting that URL.
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export const AUDIO_BUCKET = "audio";
