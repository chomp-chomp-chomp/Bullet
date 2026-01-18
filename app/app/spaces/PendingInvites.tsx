"use client";

import { acceptInvite } from "@/app/actions";
import { useState } from "react";

type Invite = {
  id: string;
  spaces: { name: string } | null;
};

export function PendingInvites({ invites }: { invites: Invite[] }) {
  const [accepting, setAccepting] = useState<string | null>(null);

  async function handleAccept(inviteId: string) {
    setAccepting(inviteId);
    try {
      await acceptInvite(inviteId);
    } catch (error: any) {
      alert(error.message || "Failed to accept invite");
      setAccepting(null);
    }
  }

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-primary-900 mb-3">
        Pending Invites
      </h3>
      <div className="space-y-2">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between bg-white rounded-md p-3"
          >
            <span className="text-gray-900">
              {invite.spaces?.name || "Unknown Space"}
            </span>
            <button
              onClick={() => handleAccept(invite.id)}
              disabled={accepting === invite.id}
              className="bg-primary-600 text-white px-4 py-1 rounded-md text-sm hover:bg-primary-700 disabled:opacity-50 transition"
            >
              {accepting === invite.id ? "Accepting..." : "Accept"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
