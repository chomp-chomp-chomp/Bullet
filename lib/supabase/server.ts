import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateAndLogEnvironment } from "@/lib/env-validator";

// Validate environment variables on module load
if (process.env.NODE_ENV === 'production') {
  validateAndLogEnvironment(false);
} else {
  // In development, be less strict but still log warnings
  validateAndLogEnvironment(false);
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
