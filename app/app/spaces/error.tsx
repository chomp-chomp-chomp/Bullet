'use client';

import { useEffect } from 'react';
import { logServerError } from '@/lib/error-logger';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for spaces page
 * Specifically handles errors in space creation and listing
 */
export default function SpacesError({
  error,
  reset,
}: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error details with specific context
    logServerError(error, {
      component: 'SpacesError',
      action: 'viewing_or_creating_spaces',
      metadata: {
        digest: error.digest,
        route: '/app/spaces',
      },
    });
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8">
        <h1 className="text-2xl font-bold text-red-900 mb-4">
          Unable to Load Spaces
        </h1>
        
        <div className="space-y-4 text-sm text-red-800">
          <p className="font-medium">
            {error.message || 'An error occurred while loading your spaces'}
          </p>
          
          {error.digest && (
            <div className="bg-white rounded p-4 border border-red-300">
              <p className="font-semibold mb-2">Error Reference:</p>
              <code className="bg-red-100 px-2 py-1 rounded text-xs block break-all">
                {error.digest}
              </code>
              <p className="text-xs text-gray-600 mt-2">
                Provide this reference when reporting the issue
              </p>
            </div>
          )}

          <div className="bg-white rounded p-4 border border-red-300">
            <p className="font-semibold mb-2">Common Causes:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Database connection issues</li>
              <li>Missing or incorrect environment variables</li>
              <li>Database permissions (RLS policies)</li>
              <li>Profile not created properly</li>
            </ul>
          </div>

          <div className="bg-white rounded p-4 border border-red-300">
            <p className="font-semibold mb-2">Troubleshooting Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Check that your Supabase credentials are set correctly</li>
              <li>Verify your database schema is up to date</li>
              <li>Ensure your profile exists in the profiles table</li>
              <li>Check server logs for detailed error information</li>
            </ol>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={reset}
            className="w-full bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition"
          >
            Try Again
          </button>
          
          <a
            href="/app/admin"
            className="block w-full text-center bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 transition"
          >
            Go to Admin Panel
          </a>
        </div>

        {process.env.NODE_ENV === 'development' && error.stack && (
          <details className="mt-6 pt-6 border-t border-red-300">
            <summary className="cursor-pointer text-gray-700 hover:text-gray-900 font-medium">
              Stack Trace (Development)
            </summary>
            <pre className="mt-3 text-xs bg-gray-100 p-3 rounded overflow-x-auto text-gray-700">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
