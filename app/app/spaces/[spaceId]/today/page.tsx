import { createClient } from "@/lib/supabase/server";
import { ensureDailyPage } from "@/app/actions";
import { BulletList } from "./BulletList";
import { QuickAdd } from "./QuickAdd";
import Link from "next/link";

export default async function TodayPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
  const supabase = await createClient();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Ensure daily page exists
  const { pageId } = await ensureDailyPage(spaceId, today);

  // Get space info
  const { data: space } = await supabase
    .from("spaces")
    .select("name")
    .eq("id", spaceId)
    .single();

  // Get space members for assignee dropdown
  const { data: members } = await supabase
    .from("space_members")
    .select(
      `
      user_id,
      profiles(id, email, display_name)
    `
    )
    .eq("space_id", spaceId);

  // Get bullets for today
  const { data: bullets } = await supabase
    .from("bullets")
    .select(
      `
      *,
      assigned_to_profile:profiles!bullets_assigned_to_fkey(id, email, display_name)
    `
    )
    .eq("page_id", pageId)
    .order("sort_key", { ascending: true });

  const membersList =
    members?.map((m: any) => ({
      id: m.profiles?.id || "",
      email: m.profiles?.email || "",
      display_name: m.profiles?.display_name || "",
    })) || [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/app/spaces"
            className="text-sm text-primary-600 hover:text-primary-700 mb-2 inline-block"
          >
            ← Back to Spaces
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {space?.name || "Space"}
          </h1>
          <p className="text-gray-600">
            Today: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <QuickAdd spaceId={spaceId} pageId={pageId} />
        <BulletList
          bullets={bullets || []}
          spaceId={spaceId}
          members={membersList}
        />
      </div>
    </div>
  );
}
