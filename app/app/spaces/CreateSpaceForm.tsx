"use client";

import { createSpace } from "@/app/actions";
import { useState } from "react";
import { formatUserError } from "@/lib/error-logger";

export function CreateSpaceForm() {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("name", name);
      await createSpace(formData);
      setName("");
    } catch (err) {
      console.error("Failed to create space:", err);
      const errorMessage = formatUserError(err);
      setError(errorMessage);
      
      // Also show alert for immediate feedback
      alert(`Unable to create space: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">
            <strong>Error:</strong> {error}
          </p>
          <p className="text-xs text-red-600 mt-2">
            Check the browser console and server logs for detailed error information.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New space name..."
          required
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="submit"
          disabled={isCreating}
          className="bg-primary-600 dark:bg-primary-500 text-white px-6 py-2 rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 transition"
        >
          {isCreating ? "Creating..." : "Create Space"}
        </button>
      </form>
    </div>
  );
}
