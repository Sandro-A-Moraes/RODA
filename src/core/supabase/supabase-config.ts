export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

type Env = Record<string, string | undefined>;

function requireVariable(env: Env, name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    // Name only: values must never reach error text or logs.
    throw new Error(`Missing ${name}`);
  }
  return value;
}

export function readSupabaseConfig(env: Env): SupabaseConfig {
  return {
    url: requireVariable(env, 'EXPO_PUBLIC_SUPABASE_URL'),
    publishableKey: requireVariable(
      env,
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    ),
  };
}
