import { useState } from 'react';
import { View } from 'react-native';

import { useDependency } from '@/core/di';
import { mapError } from '@/core/errors';
import type { AppError } from '@/core/errors';
import { useTheme } from '@/core/theme';
import { Chip, ErrorBanner, Text } from '@/shared/ui';

import {
  REACTION_KINDS,
  storyRepositoryToken,
} from '../domain/story-repository';
import type { ReactionKind } from '../domain/story-repository';

export const REACTION_LABELS: Record<ReactionKind, string> = {
  with_you: 'Estou com você',
  inspired: 'Me inspirou',
};

export interface ReactionBarProps {
  storyId: string;
  initial: ReactionKind | null;
}

// Qualitative reactions on another member's story: tap selects, another kind
// replaces, the same kind removes. Never a count (AD-005).
export function ReactionBar({ storyId, initial }: ReactionBarProps) {
  const repo = useDependency(storyRepositoryToken);
  const { spacing } = useTheme();
  const [selected, setSelected] = useState<ReactionKind | null>(initial);
  const [error, setError] = useState<AppError | null>(null);

  const press = async (kind: ReactionKind) => {
    const previous = selected;
    const next = previous === kind ? null : kind;
    setSelected(next);
    setError(null);
    try {
      const result = await repo.react(storyId, next);
      if (!result.ok) {
        setSelected(previous);
        setError(result.error);
      }
    } catch (thrown) {
      setSelected(previous);
      setError(mapError(thrown));
    }
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {REACTION_KINDS.map((kind) => (
          <Chip
            key={kind}
            label={REACTION_LABELS[kind]}
            selected={selected === kind}
            onPress={() => void press(kind)}
          />
        ))}
      </View>
      <ErrorBanner error={error} />
    </View>
  );
}

/** What the author sees on their own story: kinds received, no numbers. */
export function ReceivedReactions({ kinds }: { kinds: ReactionKind[] }) {
  const { colors } = useTheme();
  if (kinds.length === 0) return null;
  return (
    <Text type="captionStrong" style={{ color: colors.accent }}>
      {`Recebeu: ${kinds.map((k) => REACTION_LABELS[k]).join(' · ')}`}
    </Text>
  );
}
