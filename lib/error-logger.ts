/**
 * Error logging utility for server-side errors
 * Captures and logs error details including digest, stack trace, and context
 */

interface ErrorLogContext {
  userId?: string;
  action?: string;
  component?: string;
  metadata?: Record<string, any>;
}

interface ErrorDetails {
  message: string;
  digest?: string;
  stack?: string;
  context?: ErrorLogContext;
  timestamp: string;
}

/**
 * Type guard to check if error has digest property
 */
function hasDigest(error: unknown): error is Error & { digest: string } {
  return error instanceof Error && 'digest' in error && typeof (error as any).digest === 'string';
}

/**
 * Logs detailed error information to the console (can be extended to log to external services)
 * Works on both client and server side
 * @param error - The error object to log
 * @param context - Additional context about where the error occurred
 */
export function logServerError(error: unknown, context?: ErrorLogContext): void {
  const errorDetails: ErrorDetails = {
    message: 'Unknown error',
    timestamp: new Date().toISOString(),
    context,
  };

  if (error instanceof Error) {
    errorDetails.message = error.message;
    errorDetails.stack = error.stack;
    
    // Capture digest property if it exists (Next.js Server Component errors)
    if (hasDigest(error)) {
      errorDetails.digest = error.digest;
    }
  } else if (typeof error === 'string') {
    errorDetails.message = error;
  } else if (error && typeof error === 'object') {
    errorDetails.message = JSON.stringify(error);
  }

  // Log to console with structured format for easier debugging
  console.error('=== SERVER ERROR ===');
  console.error('Timestamp:', errorDetails.timestamp);
  console.error('Message:', errorDetails.message);
  
  if (errorDetails.digest) {
    console.error('Digest:', errorDetails.digest);
  }
  
  if (errorDetails.context) {
    console.error('Context:', JSON.stringify(errorDetails.context, null, 2));
  }
  
  if (errorDetails.stack) {
    console.error('Stack Trace:');
    console.error(errorDetails.stack);
  }
  
  console.error('===================');

  // In production, you could send this to an external logging service like:
  // - Sentry
  // - LogRocket
  // - DataDog
  // - CloudWatch
  // Example: await sendToLoggingService(errorDetails);
}

/**
 * Formats error for user display (without sensitive details)
 * Safe to use on both client and server
 * @param error - The error to format
 * @returns User-friendly error message
 */
export function formatUserError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred. Please try again.';
}
