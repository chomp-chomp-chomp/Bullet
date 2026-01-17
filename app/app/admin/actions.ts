"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function inviteUser(email: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if user already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (existingProfile) {
    return {
      success: false,
      message: "User with this email already exists",
    };
  }

  // For now, return instructions to add user via Supabase dashboard
  // This avoids session issues with signInWithOtp
  return {
    success: true,
    message: `To invite ${email}, go to Supabase Dashboard → Authentication → Users → Click "Invite user" → Enter this email`,
    requiresManualAction: true,
  };
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
