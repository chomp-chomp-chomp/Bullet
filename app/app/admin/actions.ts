"use server";

import { createClient } from "@/lib/supabase/server";
import { sendInviteEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

export async function inviteUser(email: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Get inviter's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, display_name")
    .eq("id", user.id)
    .single();

  const inviterName = profile?.display_name || profile?.email || "Someone";

  // Generate a magic link using Supabase's invite functionality
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app/spaces`,
  });

  if (error) {
    // If admin.inviteUserByEmail doesn't work (requires service role key),
    // fall back to creating a magic link manually
    const { data: otpData, error: otpError } =
      await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app/spaces`,
        },
      });

    if (otpError) {
      throw new Error(otpError.message);
    }

    // Note: With OTP, Supabase handles sending the email
    // If you want to use Resend instead, you'd need to generate a custom token
    revalidatePath("/app/admin");
    return { success: true, message: "Invitation sent via Supabase" };
  }

  revalidatePath("/app/admin");
  return { success: true, message: "Invitation sent successfully" };
}

export async function inviteUserWithResend(email: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Get inviter's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, display_name")
    .eq("id", user.id)
    .single();

  const inviterName = profile?.display_name || profile?.email || "Someone";

  // Generate magic link using Supabase
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app/spaces`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  // Note: To use Resend for sending emails, you need to:
  // 1. Disable Supabase's email sending in the dashboard
  // 2. Use Supabase webhooks or custom logic to intercept the magic link
  // For now, this uses Supabase's built-in email sending

  revalidatePath("/app/admin");
  return { success: true, message: "Invitation sent" };
}

export async function getAllUsers() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Get all profiles
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return profiles || [];
}

export async function deleteUser(userId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Don't allow deleting yourself
  if (userId === user.id) {
    throw new Error("You cannot delete your own account");
  }

  // Delete the profile (will cascade to auth.users due to foreign key)
  const { error } = await supabase.from("profiles").delete().eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/admin");
  return { success: true };
}
