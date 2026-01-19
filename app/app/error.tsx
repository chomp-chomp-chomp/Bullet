'use client';

import { useEffect } from 'react';
import { logServerError } from '@/lib/error-logger';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for app routes
 * Catches and displays errors from Server Components in the /app routes
 */
export default function AppError({
  error,
  reset,
}: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error details
    logServerError(error, {
      component: 'AppError',
      metadata: {
        digest: error.digest,
        route: '/app',
      },
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600">
            We encountered an error while loading this page
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800 font-medium mb-2">
            {error.message || 'An unexpected error occurred'}
          </p>
          
          {error.digest && (
            <div className="mt-3 bg-white rounded p-3">
              <p className="text-xs text-gray-600 mb-1">Error Reference:</p>
              <p className="text-xs font-mono text-gray-800 break-all">
                {error.digest}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition"
          >
            Try Again
          </button>
          
          <a
            href="/app/spaces"
            className="block w-full text-center bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 transition"
          >
            Back to Spaces
          </a>
        </div>

        {process.env.NODE_ENV === 'development' && error.stack && (
          <details className="mt-6 pt-6 border-t border-gray-200">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
              Stack Trace (Development Only)
            </summary>
            <pre className="mt-3 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
