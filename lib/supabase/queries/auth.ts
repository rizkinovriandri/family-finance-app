import { createClient } from "@/lib/supabase/client";

export async function signInWithPassword(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}

export async function signInWithOAuth(provider: "google" | "apple") {
  const supabase = createClient();
  return supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/dashboard` },
  });
}

export async function resetPasswordForEmail(email: string) {
  const supabase = createClient();
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  return supabase.auth.updateUser({ password: newPassword });
}
