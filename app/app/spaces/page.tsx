import { createClient } from "@/lib/supabase/server";
import { CreateSpaceForm } from "./CreateSpaceForm";
import { InviteForm } from "./InviteForm";
import { PendingInvites } from "./PendingInvites";
import Link from "next/link";
import { logServerError } from "@/lib/error-logger";

export default async function SpacesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user's space memberships with error handling
  const { data: memberships, error: membershipError } = await supabase
    .from("space_members")
    .select("space_id, role")
    .eq("user_id", user.id);

  if (membershipError) {
    logServerError(membershipError, {
      userId: user.id,
      component: 'SpacesPage',
      action: 'fetch_memberships',
      metadata: { errorCode: membershipError.code },
    });
    throw new Error(`Failed to load your spaces: ${membershipError.message}`);
  }

  // Get the actual space details separately to avoid RLS issues with relation embedding
  let spaces = null;
  if (memberships && memberships.length > 0) {
    const spaceIds = memberships.map((m) => m.space_id);
    const { data: spacesData, error: spacesError } = await supabase
      .from("spaces")
      .select("*")
      .in("id", spaceIds);

    if (spacesError) {
      logServerError(spacesError, {
        userId: user.id,
        component: 'SpacesPage',
        action: 'fetch_spaces',
        metadata: { spaceIds, errorCode: spacesError.code },
      });
      throw new Error(`Failed to load space details: ${spacesError.message}`);
    }

    // Combine spaces with their roles
    spaces = spacesData?.map((space) => {
      const membership = memberships.find((m) => m.space_id === space.id);
      return {
        ...space,
        role: membership?.role || "member",
      };
    }).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Get pending invites for this user
  const { data: invitesData, error: invitesError } = await supabase
    .from("space_invites")
    .select("*")
    .eq("email", user.email!)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  if (invitesError) {
    logServerError(invitesError, {
      userId: user.id,
      component: 'SpacesPage',
      action: 'fetch_invites',
      metadata: { errorCode: invitesError.code },
    });
    // Don't throw here, invites are not critical
    console.warn("Failed to load invites:", invitesError);
  }

  // Get space names for invites separately to avoid RLS issues
  let pendingInvites = null;
  if (invitesData && invitesData.length > 0) {
    const inviteSpaceIds = invitesData.map((inv) => inv.space_id);
    const { data: inviteSpaces } = await supabase
      .from("spaces")
      .select("id, name")
      .in("id", inviteSpaceIds);

    // Combine invites with space names
    pendingInvites = invitesData.map((invite) => {
      const space = inviteSpaces?.find((s) => s.id === invite.space_id);
      return {
        ...invite,
        spaces: space ? { name: space.name } : null,
      };
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Spaces</h2>
        <CreateSpaceForm />
      </div>

      {pendingInvites && pendingInvites.length > 0 && (
        <PendingInvites invites={pendingInvites} />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {spaces?.map((space) => (
          <div
            key={space.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {space.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {space.role === "owner" ? "Owner" : "Member"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href={`/app/spaces/${space.id}/today`}
                className="block w-full text-center bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition"
              >
                Open Today
              </Link>

              {space.created_by === user.id && (
                <InviteForm spaceId={space.id} />
              )}
            </div>
          </div>
        ))}

        {(!spaces || spaces.length === 0) && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No spaces yet. Create your first space above!
          </div>
        )}
      </div>
    </div>
  );
}
