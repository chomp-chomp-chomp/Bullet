"use client";

import { deleteUser } from "./actions";
import { useState } from "react";

type User = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
};

export function UsersList({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(userId: string, email: string) {
    if (
      !confirm(
        `Are you sure you want to remove ${email}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(userId);
    try {
      await deleteUser(userId);
    } catch (error: any) {
      alert(error.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  }

  if (users.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">No users found.</p>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition"
        >
          <div className="flex-1">
            <div className="font-medium text-gray-900">
              {user.display_name || user.email}
              {user.id === currentUserId && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  You
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">{user.email}</div>
            <div className="text-xs text-gray-500 mt-1">
              Joined {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>

          {user.id !== currentUserId && (
            <button
              onClick={() => handleDelete(user.id, user.email)}
              disabled={deletingId === user.id}
              className="ml-4 text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingId === user.id ? "Removing..." : "Remove"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
