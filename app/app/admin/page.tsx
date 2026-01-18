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

  // Check if user is admin first
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  // If profile doesn't exist or is_admin is not set, show error
  if (profileError || !profile?.is_admin) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/app/spaces"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-2 inline-block"
          >
            ← Back to Spaces
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-4">
            Access Denied
          </h2>
          <div className="space-y-4 text-sm text-red-800 dark:text-red-200">
            <p>
              <strong>Error:</strong>{" "}
              {profileError
                ? `Your profile does not exist (${profileError.message})`
                : "You are not an admin"}
            </p>
            <div className="bg-white dark:bg-gray-800 rounded p-4 border border-red-300 dark:border-red-700">
              <p className="font-semibold mb-2">To fix this:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  Go to your Supabase Dashboard → SQL Editor
                </li>
                <li>
                  Open <code className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded">FORCE-FIX.sql</code>
                </li>
                <li>
                  Replace <code className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded">&apos;YOUR_EMAIL@EXAMPLE.COM&apos;</code> with your email: <strong>{user.email}</strong>
                </li>
                <li>Run the script</li>
                <li>Refresh this page</li>
              </ol>
            </div>
            <p className="text-xs">
              Your email: <code className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded">{user.email}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get all users
  let users = [];
  try {
    users = await getAllUsers();
  } catch (error: any) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/app/spaces"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-2 inline-block"
          >
            ← Back to Spaces
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-4">
            Error Loading Users
          </h2>
          <p className="text-sm text-red-800 dark:text-red-200">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/app/spaces"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-2 inline-block"
        >
          ← Back to Spaces
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage user access and invitations
        </p>
      </div>

      <div className="grid gap-6">
        {/* Invite User Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            How to Invite New Users
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              To invite new users, use the Supabase Dashboard:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>
                Go to{" "}
                <a
                  href="https://supabase.com/dashboard/project/_/auth/users"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline font-medium"
                >
                  Supabase Dashboard → Authentication → Users
                </a>
              </li>
              <li>Click the &quot;Invite user&quot; button</li>
              <li>Enter the email address of the person you want to invite</li>
              <li>Click &quot;Send invitation&quot;</li>
            </ol>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ The user will receive a magic link via email and can access
                the app immediately after clicking it.
              </p>
            </div>
          </div>
        </div>

        {/* Users List Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            All Users ({users.length})
          </h2>
          <UsersList users={users} currentUserId={user.id} />
        </div>
      </div>
    </div>
  );
}
