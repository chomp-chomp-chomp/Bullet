import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InviteUserForm } from "./InviteUserForm";
import { UsersList } from "./UsersList";
import { getAllUsers } from "./actions";
import Link from "next/link";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get all users
  const users = await getAllUsers();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/app/spaces"
          className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
        >
          ← Back to Spaces
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-2">
          Manage user access and invitations
        </p>
      </div>

      <div className="grid gap-6">
        {/* Invite User Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Invite New User
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Send an invitation email to give someone access to Bullet Journal.
          </p>
          <InviteUserForm />
        </div>

        {/* Users List Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            All Users ({users.length})
          </h2>
          <UsersList users={users} currentUserId={user.id} />
        </div>
      </div>
    </div>
  );
}
