import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, View } from 'react-native';
import type { z } from 'zod';

import { useDependency } from '@/core/di';
import { minTouchTarget, useTheme } from '@/core/theme';
import {
  Button,
  ErrorBanner,
  Ring,
  Screen,
  Text,
  TextField,
} from '@/shared/ui';

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
  const { colors, spacing } = useTheme();
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
        contentContainerStyle={{
          padding: spacing.lg,
          paddingTop: spacing.xl,
          gap: spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Ring size={96} filled={6} accentFirst sage />
        <View style={{ gap: spacing.sm }}>
          <Text accessibilityRole="header" type="display">
            Bem-vindo de volta
          </Text>
          <Text type="bodyLg" variant="secondary">
            Entre para voltar ao seu círculo.
          </Text>
        </View>
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
          <Text
            type="bodyStrong"
            style={{ color: colors.accent, textAlign: 'center' }}
          >
            Não tem conta? Criar conta
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
