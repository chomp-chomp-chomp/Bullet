"use client";

import { createBullet } from "@/app/actions";
import { useEffect, useRef, useState } from "react";

export function QuickAdd({
  spaceId,
  pageId,
}: {
  spaceId: string;
  pageId: string;
}) {
  const [content, setContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      // Focus input when "/" is pressed (unless already focused on an input)
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setIsAdding(true);
    try {
      await createBullet(spaceId, pageId, content.trim());
      setContent("");
      // Keep focus on input for quick consecutive adds
      inputRef.current?.focus();
    } catch (error) {
      console.error(error);
      alert("Failed to create bullet");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Quick add (press / to focus)..."
          disabled={isAdding}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          autoFocus
        />
        <button
          type="submit"
          disabled={isAdding || !content.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
        >
          Add
        </button>
      </div>
    </form>
  );
}
