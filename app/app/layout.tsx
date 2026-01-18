import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import Link from "next/link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is admin
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.is_admin || false;
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <nav className="bg-dark-surface border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold text-dark-text tracking-tight">
              bullet journal
            </h1>
            <div className="flex items-center gap-6">
              {isAdmin && (
                <Link
                  href="/app/admin"
                  className="text-sm text-dark-muted hover:text-dark-text transition-colors"
                >
                  admin
                </Link>
              )}
              <span className="text-sm text-dark-muted">{user?.email}</span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm text-dark-muted hover:text-dark-text transition-colors"
                >
                  sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
