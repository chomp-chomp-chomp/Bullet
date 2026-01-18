"use client";

import {
  toggleBulletStatus,
  cancelBullet,
  deleteBullet,
  toggleBulletPrivate,
  updateBulletAssignee,
} from "@/app/actions";
import { useState } from "react";

type Bullet = {
  id: string;
  content: string;
  status: string;
  is_private: boolean;
  assigned_to: string | null;
  assigned_to_profile: {
    id: string;
    email: string;
    display_name: string | null;
  } | null;
};

type Member = {
  id: string;
  email: string;
  display_name: string | null;
};

export function BulletList({
  bullets,
  spaceId,
  members,
}: {
  bullets: Bullet[];
  spaceId: string;
  members: Member[];
}) {
  const [showDone, setShowDone] = useState(false);

  const filteredBullets = showDone
    ? bullets
    : bullets.filter((b) => b.status !== "done" && b.status !== "canceled");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Tasks ({filteredBullets.length})
        </h2>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
            className="rounded"
          />
          Show completed
        </label>
      </div>

      {filteredBullets.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No tasks yet. Add one above!
        </p>
      ) : (
        <div className="space-y-2">
          {filteredBullets.map((bullet) => (
            <BulletRow
              key={bullet.id}
              bullet={bullet}
              spaceId={spaceId}
              members={members}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BulletRow({
  bullet,
  spaceId,
  members,
}: {
  bullet: Bullet;
  spaceId: string;
  members: Member[];
}) {
  const [showMenu, setShowMenu] = useState(false);

  async function handleToggleStatus() {
    try {
      await toggleBulletStatus(bullet.id, spaceId);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleCancel() {
    try {
      await cancelBullet(bullet.id, spaceId);
      setShowMenu(false);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDelete() {
    if (confirm("Delete this bullet?")) {
      try {
        await deleteBullet(bullet.id, spaceId);
      } catch (error) {
        console.error(error);
      }
    }
  }

  async function handleTogglePrivate() {
    try {
      await toggleBulletPrivate(bullet.id, spaceId);
      setShowMenu(false);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleAssigneeChange(assignedTo: string) {
    try {
      await updateBulletAssignee(
        bullet.id,
        spaceId,
        assignedTo === "" ? null : assignedTo
      );
    } catch (error) {
      console.error(error);
    }
  }

  const isDone = bullet.status === "done";
  const isCanceled = bullet.status === "canceled";

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition group">
      <button
        onClick={handleToggleStatus}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 ${
          isDone
            ? "bg-green-500 border-green-500"
            : "border-gray-300 hover:border-primary-500"
        } transition`}
      >
        {isDone && (
          <svg
            className="w-full h-full text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      <span
        className={`flex-1 ${
          isDone || isCanceled
            ? "line-through text-gray-500"
            : "text-gray-900"
        }`}
      >
        {bullet.content}
        {bullet.is_private && (
          <span className="ml-2 text-xs text-gray-500">(private)</span>
        )}
        {isCanceled && (
          <span className="ml-2 text-xs text-red-600">(canceled)</span>
        )}
      </span>

      <select
        value={bullet.assigned_to || ""}
        onChange={(e) => handleAssigneeChange(e.target.value)}
        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">Unassigned</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.display_name || member.email}
          </option>
        ))}
      </select>

      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
              <button
                onClick={handleTogglePrivate}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {bullet.is_private ? "Make public" : "Make private"}
              </button>
              <button
                onClick={handleCancel}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Cancel bullet
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
