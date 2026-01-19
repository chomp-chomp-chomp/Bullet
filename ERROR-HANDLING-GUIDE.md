# Error Handling and Debugging Guide

This guide explains the error handling improvements made to help debug and resolve the "Unable to create space" Server Components error and similar issues.

## Overview

The application now includes comprehensive error handling, logging, and diagnostic tools to help identify and resolve issues quickly.

## Features Added

### 1. Enhanced Error Logging (`lib/error-logger.ts`)

A centralized error logging utility that captures:
- Error messages
- Stack traces
- Error digest (for Next.js Server Component errors)
- Contextual information (user ID, action, component)
- Timestamp

**Usage:**
```typescript
import { logServerError } from '@/lib/error-logger';

try {
  // Some operation
} catch (error) {
  logServerError(error, {
    userId: user.id,
    action: 'createSpace',
    component: 'actions.createSpace',
    metadata: { spaceName: name },
  });
  throw error;
}
```

**Log Format:**
```
=== SERVER ERROR ===
Timestamp: 2024-01-19T00:30:00.000Z
Message: Failed to create space
Digest: abc123def456 (if available)
Context: {
  "userId": "...",
  "action": "createSpace",
  "component": "actions.createSpace"
}
Stack Trace:
Error: Failed to create space
    at createSpace (app/actions.ts:30:15)
    ...
===================
```

### 2. Environment Variable Validation (`lib/env-validator.ts`)

Validates that all required environment variables are set correctly.

**Features:**
- Checks for required variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Validates format (e.g., HTTPS URL)
- Detects placeholder values
- Warns about missing optional variables
- Provides debug output with masked sensitive values

**Validation runs automatically:**
- On server initialization (`lib/supabase/server.ts`)
- During build time
- Can be called manually for diagnostics

### 3. Database Health Checks (`lib/db-health.ts`)

Tests database connectivity and schema integrity.

**Checks performed:**
- Database connection
- Profiles table access
- Spaces table access
- Space members table access
- RLS (Row Level Security) policies

**Usage:**
```typescript
import { checkDatabaseHealth, logDatabaseHealth } from '@/lib/db-health';

const health = await checkDatabaseHealth(userId);
logDatabaseHealth(health);

if (!health.isHealthy) {
  // Handle database issues
}
```

### 4. Error Boundaries

Next.js error boundaries to catch and display Server Component errors gracefully.

#### Global Error Boundary (`app/global-error.tsx`)
Catches errors across the entire application.

#### App Error Boundary (`app/app/error.tsx`)
Catches errors in `/app/*` routes.

#### Spaces Error Boundary (`app/app/spaces/error.tsx`)
Specialized error handling for space-related operations with:
- Specific troubleshooting steps
- Common causes list
- Error digest display

**Features:**
- Displays user-friendly error messages
- Shows error digest for reference
- Provides "Try Again" and navigation options
- Shows stack traces in development mode
- Logs errors automatically with context

### 5. Enhanced Debug Page (`/debug`)

Comprehensive diagnostic page showing:
- System health overview (Environment + Database)
- Environment variable status
- Database health checks
- User authentication status
- Profile information
- Space memberships
- RLS policy verification

**Access:** Navigate to `/debug` when logged in.

## Troubleshooting Common Issues

### "Unable to create space" Error

**Possible Causes:**
1. Missing or incorrect environment variables
2. Database connection issues
3. RLS policy conflicts
4. Missing user profile

**Debugging Steps:**

1. **Check Error Logs:**
   - Look for error logs in server console
   - Note the error digest if shown
   - Check stack trace for the exact failure point

2. **Verify Environment:**
   - Go to `/debug` page
   - Check "Environment Variables" section
   - Ensure all required variables are set
   - Fix any errors shown

3. **Check Database Health:**
   - In `/debug` page, review "Database Health" section
   - All checks should show ✅
   - Address any ❌ or ⚠️ issues

4. **Verify Profile:**
   - Check "Profile" section in `/debug`
   - Ensure profile exists
   - If missing, run `FORCE-FIX.sql` script

5. **Check RLS Policies:**
   - Review database logs
   - Ensure `schema.sql` is fully applied
   - Run `APPLY-ALL-FIXES.sql` if needed

### Environment Variable Issues

**Symptoms:**
- "Missing required environment variable" errors
- Database connection failures
- Authentication issues

**Solution:**
1. Check `.env.local` file exists
2. Verify all values are set (no placeholders)
3. Restart development server after changes
4. For production, update environment variables in hosting platform

### Database Connection Issues

**Symptoms:**
- "Failed to connect to database" errors
- Timeout errors
- Authentication failures

**Solution:**
1. Verify Supabase project is running
2. Check Supabase URL is correct
3. Verify Anon Key is correct
4. Test connection in Supabase dashboard
5. Check for network/firewall issues

### RLS Policy Issues

**Symptoms:**
- "Permission denied" errors
- Unable to see created spaces
- Spaces created but user not added as member

**Solution:**
1. Run latest `schema.sql` in Supabase SQL Editor
2. Apply `APPLY-ALL-FIXES.sql`
3. Verify policies exist:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'spaces';
   SELECT * FROM pg_policies WHERE tablename = 'space_members';
   ```

## Server Action Error Handling

All server actions now include enhanced error logging:

- `createSpace()` - Logs space creation and membership errors
- `inviteToSpace()` - Logs invitation errors
- `acceptInvite()` - Logs invite acceptance errors
- Other actions - Enhanced error context

## Error Display in UI

### CreateSpaceForm
- Shows inline error message
- Displays error in alert
- Logs to console for debugging
- References server logs for details

### Error Boundaries
- Catches render errors
- Shows error digest
- Provides recovery options
- Logs errors with context

## Production Considerations

### Error Logging
The current implementation logs to console. For production, consider:

1. **External Logging Service:**
   - Sentry (error tracking)
   - LogRocket (session replay)
   - DataDog (observability)
   - AWS CloudWatch

2. **Implementation:**
   Update `lib/error-logger.ts`:
   ```typescript
   // Add to logServerError function
   if (process.env.NODE_ENV === 'production') {
     await sendToExternalService(errorDetails);
   }
   ```

### Security
- Error digests are safe to show users
- Stack traces are hidden in production (except in error boundaries with toggle)
- Sensitive data is masked in environment debug output
- Database credentials never exposed

## Testing Error Handling

### Manual Testing
1. Trigger errors intentionally (invalid data, network issues)
2. Verify errors are logged correctly
3. Check error boundaries display properly
4. Confirm user-friendly messages shown

### Automated Testing
Consider adding tests for:
- Error logger utility
- Environment validator
- Database health checker
- Error boundary components

## Best Practices

1. **Always log errors with context:**
   ```typescript
   logServerError(error, {
     userId: user?.id,
     action: 'specificAction',
     component: 'ComponentName',
     metadata: { relevantData },
   });
   ```

2. **Use appropriate error messages:**
   - Technical details in server logs
   - User-friendly messages in UI
   - Include error digest for reference

3. **Handle errors at multiple levels:**
   - Try-catch in functions
   - Error boundaries in UI
   - Global error handler

4. **Test error scenarios:**
   - Missing environment variables
   - Database connection failures
   - Invalid data
   - RLS policy violations

## Future Enhancements

Potential improvements:
- Integration with external logging services
- Error rate monitoring and alerting
- User error reporting feature
- Automated error recovery
- Error analytics dashboard
