"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Space actions
export async function createSpace(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Create space
  const { data: space, error: spaceError } = await supabase
    .from("spaces")
    .insert({ name, created_by: user.id })
    .select()
    .single();

  if (spaceError) {
    throw new Error(spaceError.message);
  }

  // Add creator as owner
  const { error: memberError } = await supabase
    .from("space_members")
    .insert({ space_id: space.id, user_id: user.id, role: "owner" });

  if (memberError) {
    throw new Error(memberError.message);
  }

  revalidatePath("/app/spaces");
  return { success: true, spaceId: space.id };
}

export async function inviteToSpace(spaceId: string, email: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("space_invites")
    .insert({ space_id: spaceId, email, role: "member" });

  if (error) {
    if (error.code === "23505") {
      throw new Error("User already invited");
    }
    throw new Error(error.message);
  }

  revalidatePath("/app/spaces");
  return { success: true };
}

export async function acceptInvite(inviteId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Get invite details
  const { data: invite, error: inviteError } = await supabase
    .from("space_invites")
    .select("*")
    .eq("id", inviteId)
    .single();

  if (inviteError || !invite) {
    throw new Error("Invite not found");
  }

  // Add user to space
  const { error: memberError } = await supabase
    .from("space_members")
    .insert({
      space_id: invite.space_id,
      user_id: user.id,
      role: invite.role,
    });

  if (memberError) {
    throw new Error(memberError.message);
  }

  // Mark invite as accepted
  const { error: updateError } = await supabase
    .from("space_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", inviteId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/app/spaces");
  redirect(`/app/spaces/${invite.space_id}/today`);
}

// Bullet actions
export async function createBullet(
  spaceId: string,
  pageId: string,
  content: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("bullets")
    .insert({
      space_id: spaceId,
      page_id: pageId,
      content,
      created_by: user.id,
      status: "open",
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/app/spaces/${spaceId}/today`);
  return { success: true, bullet: data };
}

export async function toggleBulletStatus(bulletId: string, spaceId: string) {
  const supabase = await createClient();

  // Get current status
  const { data: bullet, error: fetchError } = await supabase
    .from("bullets")
    .select("status")
    .eq("id", bulletId)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const newStatus = bullet.status === "done" ? "open" : "done";
  const completed_at = newStatus === "done" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("bullets")
    .update({ status: newStatus, completed_at })
    .eq("id", bulletId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/app/spaces/${spaceId}/today`);
  return { success: true };
}

export async function cancelBullet(bulletId: string, spaceId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("bullets")
    .update({ status: "canceled" })
    .eq("id", bulletId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/app/spaces/${spaceId}/today`);
  return { success: true };
}

export async function deleteBullet(bulletId: string, spaceId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("bullets").delete().eq("id", bulletId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/app/spaces/${spaceId}/today`);
  return { success: true };
}

export async function toggleBulletPrivate(bulletId: string, spaceId: string) {
  const supabase = await createClient();

  // Get current privacy status
  const { data: bullet, error: fetchError } = await supabase
    .from("bullets")
    .select("is_private")
    .eq("id", bulletId)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const { error } = await supabase
    .from("bullets")
    .update({ is_private: !bullet.is_private })
    .eq("id", bulletId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/app/spaces/${spaceId}/today`);
  return { success: true };
}

export async function updateBulletAssignee(
  bulletId: string,
  spaceId: string,
  assignedTo: string | null
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("bullets")
    .update({ assigned_to: assignedTo })
    .eq("id", bulletId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/app/spaces/${spaceId}/today`);
  return { success: true };
}

export async function ensureDailyPage(spaceId: string, date: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if daily page exists
  const { data: existingPage } = await supabase
    .from("daily_pages")
    .select("id")
    .eq("space_id", spaceId)
    .eq("page_date", date)
    .single();

  if (existingPage) {
    return { pageId: existingPage.id };
  }

  // Create daily page
  const { data: newPage, error } = await supabase
    .from("daily_pages")
    .insert({
      space_id: spaceId,
      page_date: date,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { pageId: newPage.id };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
