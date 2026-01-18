"use client";

import { createSpace } from "@/app/actions";
import { useState } from "react";

export function CreateSpaceForm() {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsCreating(true);

    try {
      const formData = new FormData();
      formData.set("name", name);
      await createSpace(formData);
      setName("");
    } catch (error) {
      console.error("Failed to create space:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create space";
      alert(`Unable to create space: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New space name..."
        required
        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={isCreating}
        className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition"
      >
        {isCreating ? "Creating..." : "Create Space"}
      </button>
    </form>
  );
}
