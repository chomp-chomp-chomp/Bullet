import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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
            How to Invite New Users
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              To invite new users, use the Supabase Dashboard:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>
                Go to{" "}
                <a
                  href="https://supabase.com/dashboard/project/_/auth/users"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  Supabase Dashboard → Authentication → Users
                </a>
              </li>
              <li>Click the &quot;Invite user&quot; button</li>
              <li>Enter the email address of the person you want to invite</li>
              <li>Click &quot;Send invitation&quot;</li>
            </ol>
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-800">
                ✅ The user will receive a magic link via email and can access
                the app immediately after clicking it.
              </p>
            </div>
          </div>
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
