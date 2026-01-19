/**
 * Database connection and health check utility
 * Tests database connectivity and validates schema
 */

import { createClient } from "@/lib/supabase/server";
import { logServerError } from "./error-logger";

interface DatabaseHealthCheck {
  isHealthy: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    connection: boolean;
    profiles: boolean;
    spaces: boolean;
    spaceMembers: boolean;
    rls: boolean;
  };
}

/**
 * Performs a health check on the database connection and schema
 * @param userId - Optional user ID to check user-specific permissions
 */
export async function checkDatabaseHealth(userId?: string): Promise<DatabaseHealthCheck> {
  const result: DatabaseHealthCheck = {
    isHealthy: true,
    errors: [],
    warnings: [],
    checks: {
      connection: false,
      profiles: false,
      spaces: false,
      spaceMembers: false,
      rls: false,
    },
  };

  try {
    const supabase = await createClient();

    // Test 1: Basic connection
    try {
      const { error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        result.errors.push(`Database connection error: ${error.message}`);
        result.isHealthy = false;
      } else {
        result.checks.connection = true;
      }
    } catch (error) {
      logServerError(error, {
        component: 'checkDatabaseHealth',
        action: 'connection_test',
      });
      result.errors.push('Failed to connect to database');
      result.isHealthy = false;
      return result; // Can't proceed without connection
    }

    // Test 2: Check profiles table
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (error) {
        result.errors.push(`Profiles table error: ${error.message}`);
        result.isHealthy = false;
      } else {
        result.checks.profiles = true;
        
        if (!data || data.length === 0) {
          result.warnings.push('No profiles found in database');
        }
      }
    } catch (error) {
      logServerError(error, {
        component: 'checkDatabaseHealth',
        action: 'profiles_check',
      });
      result.errors.push('Failed to query profiles table');
      result.isHealthy = false;
    }

    // Test 3: Check spaces table
    try {
      const { data, error } = await supabase
        .from('spaces')
        .select('id')
        .limit(1);
      
      if (error) {
        result.errors.push(`Spaces table error: ${error.message}`);
        result.isHealthy = false;
      } else {
        result.checks.spaces = true;
      }
    } catch (error) {
      logServerError(error, {
        component: 'checkDatabaseHealth',
        action: 'spaces_check',
      });
      result.errors.push('Failed to query spaces table');
      result.isHealthy = false;
    }

    // Test 4: Check space_members table
    try {
      const { data, error } = await supabase
        .from('space_members')
        .select('space_id')
        .limit(1);
      
      if (error) {
        result.errors.push(`Space members table error: ${error.message}`);
        result.isHealthy = false;
      } else {
        result.checks.spaceMembers = true;
      }
    } catch (error) {
      logServerError(error, {
        component: 'checkDatabaseHealth',
        action: 'space_members_check',
      });
      result.errors.push('Failed to query space_members table');
      result.isHealthy = false;
    }

    // Test 5: Check RLS (if userId provided)
    if (userId) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          result.warnings.push(`RLS check warning: ${error.message}`);
        } else if (profile) {
          result.checks.rls = true;
        } else {
          result.warnings.push('User profile not found - RLS may prevent access');
        }
      } catch (error) {
        logServerError(error, {
          userId,
          component: 'checkDatabaseHealth',
          action: 'rls_check',
        });
        result.warnings.push('Failed to verify RLS policies');
      }
    }

  } catch (error) {
    logServerError(error, {
      component: 'checkDatabaseHealth',
      action: 'general',
    });
    result.errors.push('Unexpected error during health check');
    result.isHealthy = false;
  }

  return result;
}

/**
 * Logs database health check results
 */
export function logDatabaseHealth(health: DatabaseHealthCheck): void {
  console.log('=== DATABASE HEALTH CHECK ===');
  console.log('Overall Status:', health.isHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY');
  
  console.log('\nChecks:');
  console.log('  Connection:', health.checks.connection ? '✅' : '❌');
  console.log('  Profiles Table:', health.checks.profiles ? '✅' : '❌');
  console.log('  Spaces Table:', health.checks.spaces ? '✅' : '❌');
  console.log('  Space Members Table:', health.checks.spaceMembers ? '✅' : '❌');
  console.log('  RLS Policies:', health.checks.rls ? '✅' : '⚠️');
  
  if (health.errors.length > 0) {
    console.log('\nErrors:');
    health.errors.forEach(error => console.log('  ❌', error));
  }
  
  if (health.warnings.length > 0) {
    console.log('\nWarnings:');
    health.warnings.forEach(warning => console.log('  ⚠️', warning));
  }
  
  console.log('============================');
}
