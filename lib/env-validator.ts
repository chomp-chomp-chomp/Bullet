/**
 * Environment variable validation utility
 * Ensures all required environment variables are set and valid
 */

interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

/**
 * Optional environment variables that enhance functionality
 */
const OPTIONAL_ENV_VARS = [
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'NEXT_PUBLIC_APP_URL',
] as const;

/**
 * Validates that all required environment variables are set
 * @returns Validation result with errors and warnings
 */
export function validateEnvironment(): EnvValidationResult {
  const result: EnvValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    
    if (!value || value.trim() === '') {
      result.isValid = false;
      result.errors.push(`Missing required environment variable: ${varName}`);
    } else if (value.includes('your_') || value.includes('xxxxx')) {
      result.isValid = false;
      result.errors.push(
        `Environment variable ${varName} appears to contain placeholder value. Please set actual value.`
      );
    }
  }

  // Check Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    result.errors.push(
      'NEXT_PUBLIC_SUPABASE_URL must start with https://'
    );
    result.isValid = false;
  }

  // Check optional variables and provide warnings
  for (const varName of OPTIONAL_ENV_VARS) {
    const value = process.env[varName];
    
    if (!value || value.trim() === '') {
      result.warnings.push(
        `Optional environment variable ${varName} is not set. Some features may not work.`
      );
    }
  }

  return result;
}

/**
 * Validates environment and logs results
 * @param throwOnError - Whether to throw an error if validation fails
 */
export function validateAndLogEnvironment(throwOnError: boolean = false): void {
  const result = validateEnvironment();

  if (result.errors.length > 0) {
    console.error('=== ENVIRONMENT VALIDATION ERRORS ===');
    result.errors.forEach(error => console.error('❌', error));
    console.error('====================================');
    
    if (throwOnError) {
      throw new Error(
        `Environment validation failed:\n${result.errors.join('\n')}`
      );
    }
  }

  if (result.warnings.length > 0) {
    console.warn('=== ENVIRONMENT VALIDATION WARNINGS ===');
    result.warnings.forEach(warning => console.warn('⚠️', warning));
    console.warn('=======================================');
  }

  if (result.isValid && result.warnings.length === 0) {
    console.log('✅ Environment validation passed');
  }
}

/**
 * Gets a sanitized version of environment variables for debugging
 * (masks sensitive values)
 */
export function getDebugEnvironment(): Record<string, string> {
  const debug: Record<string, string> = {};
  
  const allVars = [...REQUIRED_ENV_VARS, ...OPTIONAL_ENV_VARS];
  
  for (const varName of allVars) {
    const value = process.env[varName];
    
    if (!value) {
      debug[varName] = '<not set>';
    } else if (varName.includes('KEY') || varName.includes('SECRET')) {
      // Mask sensitive values
      debug[varName] = value.substring(0, 8) + '...' + value.substring(value.length - 4);
    } else {
      debug[varName] = value;
    }
  }
  
  return debug;
}
