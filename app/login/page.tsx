"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom"; // React 18.3+ hook from react-dom
import { createClient } from "@/lib/supabase/client";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-dark-text text-dark-bg py-3 px-4 rounded-md hover:bg-dark-text/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
    >
      {pending ? "sending..." : "send magic link"}
    </button>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/app/spaces`,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: "Check your email for the magic link!",
      });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-center text-dark-text tracking-tight">
            bullet journal
          </h1>
          <p className="mt-2 text-center text-dark-muted">
            sign in with your email
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-4 py-3 border border-dark-border bg-dark-surface placeholder-dark-muted text-dark-text focus:outline-none focus:ring-2 focus:ring-dark-text/20 focus:border-dark-text transition-all sm:text-sm"
              placeholder="enter your email"
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.type === "error"
                  ? "bg-red-950/50 text-red-400 border border-red-900/50"
                  : "bg-green-950/50 text-green-400 border border-green-900/50"
              }`}
            >
              {message.text}
            </div>
          )}

          <SubmitButton />
        </form>

        <p className="text-center text-xs text-dark-muted mt-4">
          we&apos;ll send you a magic link to sign in without a password
        </p>
      </div>
    </div>
  );
}
