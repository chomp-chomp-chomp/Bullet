import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DebugPage() {
  const supabase = await createClient();

  // Get current auth user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get spaces user is member of
  const { data: memberships, error: membershipsError } = await supabase
    .from("space_members")
    .select("space_id, role, spaces(name)")
    .eq("user_id", user.id);

  // Get all spaces (to check RLS)
  const { data: allSpaces, error: spacesError } = await supabase
    .from("spaces")
    .select("*");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Debug Information</h1>

        {/* Auth User */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Auth User</h2>
          {userError ? (
            <pre className="bg-red-50 p-4 rounded text-red-800 text-sm overflow-auto">
              {JSON.stringify(userError, null, 2)}
            </pre>
          ) : (
            <pre className="bg-gray-50 p-4 rounded text-gray-900 text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          )}
        </div>

        {/* Profile */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Profile</h2>
          {profileError ? (
            <div>
              <div className="bg-red-50 p-4 rounded text-red-800 mb-4">
                <strong>ERROR:</strong> {profileError.message}
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-semibold mb-2">This means:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Your profile does NOT exist in the database</li>
                  <li>You need to run FORCE-FIX.sql with your email</li>
                  <li>The trigger did not create your profile automatically</li>
                </ul>
              </div>
            </div>
          ) : profile ? (
            <div>
              <pre className="bg-gray-50 p-4 rounded text-gray-900 text-sm overflow-auto mb-4">
                {JSON.stringify(profile, null, 2)}
              </pre>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Admin Status:</span>
                  {profile.is_admin ? (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded">
                      ✓ You are an admin
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded">
                      ✗ You are NOT an admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded text-yellow-800">
              Profile exists but is null (this shouldn&apos;t happen)
            </div>
          )}
        </div>

        {/* Memberships */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Your Space Memberships
          </h2>
          {membershipsError ? (
            <pre className="bg-red-50 p-4 rounded text-red-800 text-sm overflow-auto">
              {JSON.stringify(membershipsError, null, 2)}
            </pre>
          ) : memberships && memberships.length > 0 ? (
            <pre className="bg-gray-50 p-4 rounded text-gray-900 text-sm overflow-auto">
              {JSON.stringify(memberships, null, 2)}
            </pre>
          ) : (
            <div className="text-gray-600">
              No space memberships found. This is why you can&apos;t see any spaces.
            </div>
          )}
        </div>

        {/* All Spaces */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            All Spaces (RLS Check)
          </h2>
          {spacesError ? (
            <pre className="bg-red-50 p-4 rounded text-red-800 text-sm overflow-auto">
              {JSON.stringify(spacesError, null, 2)}
            </pre>
          ) : allSpaces && allSpaces.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Found {allSpaces.length} space(s). If this number seems wrong,
                there might be an RLS issue.
              </p>
              <pre className="bg-gray-50 p-4 rounded text-gray-900 text-sm overflow-auto">
                {JSON.stringify(allSpaces, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-gray-600">No spaces exist in the database.</div>
          )}
        </div>

        {/* Action Items */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">
            What to do next:
          </h2>
          <ol className="list-decimal pl-6 space-y-2 text-blue-900">
            <li>
              If you see &quot;Profile ERROR&quot; above, run <code className="bg-blue-100 px-2 py-1 rounded">FORCE-FIX.sql</code> with your email
            </li>
            <li>
              If is_admin is false, run <code className="bg-blue-100 px-2 py-1 rounded">FORCE-FIX.sql</code> with your email
            </li>
            <li>
              After running the fix, refresh this page to verify
            </li>
            <li>
              If everything looks good here but still having issues, run{" "}
              <code className="bg-blue-100 px-2 py-1 rounded">DIAGNOSE.sql</code> and send me the results
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
