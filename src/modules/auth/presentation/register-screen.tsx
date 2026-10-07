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
import { registerSchema } from '../domain/auth-schemas';
import { registerUser } from '../domain/register-user';
import { useAuthAction } from './use-auth-action';

type RegisterForm = z.input<typeof registerSchema>;
type RegisterValues = z.output<typeof registerSchema>;

export interface RegisterScreenProps {
  onNavigateToSignIn: () => void;
}

export function RegisterScreen({ onNavigateToSignIn }: RegisterScreenProps) {
  const repo = useDependency(authRepositoryToken);
  const { colors, spacing } = useTheme();
  const register = useCallback(
    (values: RegisterValues) => registerUser(repo, values),
    [repo],
  );
  const { run, retry, pending, error } = useAuthAction(register);
  const { control, handleSubmit } = useForm<
    RegisterForm,
    unknown,
    RegisterValues
  >({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '' },
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
        <Ring size={96} filled={3} accentFirst sage />
        <View style={{ gap: spacing.sm }}>
          <Text accessibilityRole="header" type="display">
            Criar sua conta
          </Text>
          <Text type="bodyLg" variant="secondary">
            Entre no seu círculo de até 12 pessoas.
          </Text>
        </View>
        <Controller
          control={control}
          name="displayName"
          render={({ field, fieldState }) => (
            <TextField
              label="Nome"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              autoComplete="name"
            />
          )}
        />
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
              autoComplete="new-password"
              helper="Use pelo menos 8 caracteres."
              secureTextEntry
            />
          )}
        />
        <ErrorBanner
          error={error}
          onRetry={error?.code === 'network' ? retry : undefined}
        />
        <Button
          label="Criar conta"
          loading={pending}
          // Not returning the promise keeps the press fire-and-forget.
          onPress={() => void handleSubmit((values) => run(values))()}
        />
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Já tenho conta"
          onPress={onNavigateToSignIn}
          style={{ minHeight: minTouchTarget, justifyContent: 'center' }}
        >
          <Text
            type="bodyStrong"
            style={{ color: colors.accent, textAlign: 'center' }}
          >
            Já tenho conta
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
