'use client';

import { useEffect } from 'react';
import { logServerError } from '@/lib/error-logger';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary for the app
 * Catches and displays errors from Server Components
 */
export default function GlobalError({
  error,
  reset,
}: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error details on the client side
    logServerError(error, {
      component: 'GlobalError',
      metadata: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-red-600 mb-2">
                Application Error
              </h1>
              <p className="text-gray-600">
                Something went wrong in the application
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-red-900 mb-2">
                Error Details
              </h2>
              <p className="text-sm text-red-800 mb-4 font-mono">
                {error.message || 'An unexpected error occurred'}
              </p>
              
              {error.digest && (
                <div className="bg-white rounded p-3 border border-red-300">
                  <p className="text-xs text-gray-600 mb-1">Error Digest:</p>
                  <p className="text-xs font-mono text-gray-800">
                    {error.digest}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    This digest can be used to look up the error in server logs
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition font-medium"
              >
                Try Again
              </button>
              
              <a
                href="/"
                className="block w-full text-center bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 transition font-medium"
              >
                Go to Home Page
              </a>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
                  Technical Details (for developers)
                </summary>
                <div className="mt-3 bg-gray-100 rounded p-3">
                  <p className="text-xs text-gray-700 mb-2">
                    <strong>Error Type:</strong> {error.name || 'Error'}
                  </p>
                  {error.stack && (
                    <div>
                      <p className="text-xs text-gray-700 mb-1">
                        <strong>Stack Trace:</strong>
                      </p>
                      <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
