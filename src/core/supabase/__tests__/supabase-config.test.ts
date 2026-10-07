import { readSupabaseConfig } from '@/core/supabase/supabase-config';

const URL_VAR = 'EXPO_PUBLIC_SUPABASE_URL';
const KEY_VAR = 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY';

describe('readSupabaseConfig', () => {
  it('returns both values when both variables are set', () => {
    const config = readSupabaseConfig({
      [URL_VAR]: 'https://example.supabase.co',
      [KEY_VAR]: 'sb_publishable_example',
    });
    expect(config).toEqual({
      url: 'https://example.supabase.co',
      publishableKey: 'sb_publishable_example',
    });
  });

  it('throws naming the URL variable when it is absent', () => {
    expect(() =>
      readSupabaseConfig({ [KEY_VAR]: 'sb_publishable_example' }),
    ).toThrow(URL_VAR);
  });

  it('throws naming the key variable when it is blank', () => {
    expect(() =>
      readSupabaseConfig({
        [URL_VAR]: 'https://example.supabase.co',
        [KEY_VAR]: '',
      }),
    ).toThrow(KEY_VAR);
  });

  it('throws naming the key variable when it is only whitespace', () => {
    expect(() =>
      readSupabaseConfig({
        [URL_VAR]: 'https://example.supabase.co',
        [KEY_VAR]: '   ',
      }),
    ).toThrow(KEY_VAR);
  });

  it('never includes a variable value in the error text', () => {
    const secretUrl = 'https://very-distinct-project-ref.supabase.co';
    let message = '';
    try {
      readSupabaseConfig({ [URL_VAR]: secretUrl, [KEY_VAR]: '' });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain(KEY_VAR);
    expect(message).not.toContain('very-distinct-project-ref');
  });
});
