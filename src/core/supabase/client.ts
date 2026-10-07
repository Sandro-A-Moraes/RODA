import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { readSupabaseConfig } from './supabase-config';

// Static references so Expo can inline the public variables at build time.
const { url, publishableKey } = readSupabaseConfig({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

const isNative = Platform.OS !== 'web';

export const supabase = createClient(url, publishableKey, {
  auth: {
    // Web keeps the default browser storage; native persists through AsyncStorage.
    ...(isNative ? { storage: AsyncStorage, lock: processLock } : {}),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

if (isNative) {
  // Refresh tokens only while the app is in the foreground.
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
