import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Share, View } from 'react-native';

import { useTheme } from '@/core/theme';
import { Button, Text } from '@/shared/ui';

export interface InviteCodeActionsProps {
  circleName: string;
  inviteCode: string;
}

type Notice = { text: string; failed: boolean };

// Copy and share use Expo-managed / core APIs only (AD-004).
export function InviteCodeActions({
  circleName,
  inviteCode,
}: InviteCodeActionsProps) {
  const { colors, spacing } = useTheme();
  const [notice, setNotice] = useState<Notice | null>(null);

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      setNotice({ text: 'Código copiado', failed: false });
    } catch {
      setNotice({
        text: 'Não foi possível copiar. Anote o código.',
        failed: true,
      });
    }
  };

  const share = async () => {
    try {
      await Share.share({
        message: `Entre no meu círculo "${circleName}" no Roda com o código ${inviteCode}.`,
      });
      setNotice(null);
    } catch {
      setNotice({
        text: 'Não foi possível compartilhar. Copie o código.',
        failed: true,
      });
    }
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <Button label="Compartilhar" onPress={() => void share()} />
      <Button
        label="Copiar código"
        variant="secondary"
        onPress={() => void copy()}
      />
      {notice ? (
        <Text
          accessibilityRole={notice.failed ? 'alert' : 'text'}
          accessibilityLiveRegion="polite"
          type="captionStrong"
          style={notice.failed ? { color: colors.accent } : undefined}
        >
          {notice.text}
        </Text>
      ) : null}
    </View>
  );
}
