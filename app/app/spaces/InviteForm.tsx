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
        className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-600 dark:border-blue-500 py-2 px-4 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
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
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isInviting}
          className="flex-1 text-sm bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition"
        >
          {isInviting ? "Sending..." : "Send Invite"}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setEmail("");
          }}
          className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
