import { createClient } from "@/lib/supabase/server";
import { CreateSpaceForm } from "./CreateSpaceForm";
import { InviteForm } from "./InviteForm";
import { PendingInvites } from "./PendingInvites";
import Link from "next/link";

export default async function SpacesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user's spaces
  const { data: spaces } = await supabase
    .from("spaces")
    .select(
      `
      *,
      space_members!inner(role)
    `
    )
    .eq("space_members.user_id", user.id)
    .order("created_at", { ascending: false });

  // Get pending invites for this user
  const { data: pendingInvites } = await supabase
    .from("space_invites")
    .select(
      `
      *,
      spaces(name)
    `
    )
    .eq("email", user.email!)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

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
                  {space.space_members[0]?.role === "owner" ? "Owner" : "Member"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href={`/app/spaces/${space.id}/today`}
                className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
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
