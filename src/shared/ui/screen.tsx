import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/core/theme';

export function Screen({ children }: { children?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
