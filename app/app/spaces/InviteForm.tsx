"use client";

import { inviteToSpace } from "@/app/actions";
import { useState } from "react";

export function InviteForm({ spaceId }: { spaceId: string }) {
  const [isInviting, setIsInviting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsInviting(true);

    try {
      await inviteToSpace(spaceId, email);
      setEmail("");
      setShowForm(false);
      alert("Invite sent!");
    } catch (error: any) {
      alert(error.message || "Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full text-sm text-primary-600 hover:text-primary-700 border border-primary-600 py-2 px-4 rounded-md hover:bg-primary-50 transition"
      >
        Invite Member
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address..."
        required
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isInviting}
          className="flex-1 text-sm bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 transition"
        >
          {isInviting ? "Sending..." : "Send Invite"}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setEmail("");
          }}
          className="text-sm text-gray-600 hover:text-gray-900 px-4"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
