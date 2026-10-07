import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView } from 'react-native';
import type { z } from 'zod';

import { useDependency } from '@/core/di';
import { minTouchTarget, useTheme } from '@/core/theme';
import { Button, ErrorBanner, Screen, Text, TextField } from '@/shared/ui';

import { authRepositoryToken } from '../domain/auth-repository';
import { signInSchema } from '../domain/auth-schemas';
import { signInUser } from '../domain/sign-in-user';
import { useAuthAction } from './use-auth-action';

type SignInForm = z.input<typeof signInSchema>;
type SignInValues = z.output<typeof signInSchema>;

export interface SignInScreenProps {
  onNavigateToRegister: () => void;
}

export function SignInScreen({ onNavigateToRegister }: SignInScreenProps) {
  const repo = useDependency(authRepositoryToken);
  const { colors, spacing, typography } = useTheme();
  const signIn = useCallback(
    (values: SignInValues) => signInUser(repo, values),
    [repo],
  );
  const { run, retry, pending, error } = useAuthAction(signIn);
  const { control, handleSubmit } = useForm<SignInForm, unknown, SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          accessibilityRole="header"
          style={{ fontSize: typography.sizes.heading }}
        >
          Bem-vindo de volta
        </Text>
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              label="E-mail"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              label="Senha"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              autoCapitalize="none"
              autoComplete="password"
              secureTextEntry
            />
          )}
        />
        <ErrorBanner
          error={error}
          onRetry={error?.code === 'network' ? retry : undefined}
        />
        <Button
          label="Entrar"
          loading={pending}
          onPress={() => void handleSubmit((values) => run(values))()}
        />
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Criar conta"
          onPress={onNavigateToRegister}
          style={{ minHeight: minTouchTarget, justifyContent: 'center' }}
        >
          <Text style={{ color: colors.accent }}>Criar conta</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
