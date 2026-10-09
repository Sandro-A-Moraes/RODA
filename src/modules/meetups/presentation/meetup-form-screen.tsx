import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { useDependency } from '@/core/di';
import { useTheme } from '@/core/theme';
import { useAsyncAction } from '@/shared/hooks/use-async-action';
import { Button, ErrorBanner, Header, Screen, TextField } from '@/shared/ui';

import { meetupRepositoryToken } from '../domain/meetup-repository';
import { createMeetup } from '../domain/meetup-use-cases';

export interface MeetupFormScreenProps {
  circleId: string;
  onBack: () => void;
  onSaved: () => void;
}

// Validation messages are routed to the field they describe by prefix, as in
// the pact form; date and time share one message, shown under the date.
export function MeetupFormScreen({
  circleId,
  onBack,
  onSaved,
}: MeetupFormScreenProps) {
  const repo = useDependency(meetupRepositoryToken);
  const { spacing } = useTheme();
  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // The clock is read at submit time, so a long-open form is still checked
  // against the real "now".
  const save = useCallback(async () => {
    const result = await createMeetup(
      repo,
      circleId,
      { title, place, date, time },
      new Date(),
    );
    if (result.ok) onSaved();
    return result;
  }, [repo, circleId, title, place, date, time, onSaved]);
  const { run, pending, error } = useAsyncAction(save);

  const message = error?.code === 'validation' ? error.message : undefined;
  const titleError = message?.startsWith('Título') ? message : undefined;
  const placeError = message?.startsWith('Local') ? message : undefined;
  const dateError = message && !titleError && !placeError ? message : undefined;
  const otherError = message ? null : error;

  return (
    <Screen>
      <Header title="Propor encontro" onBack={onBack} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      >
        <TextField
          label="Título"
          value={title}
          onChangeText={setTitle}
          error={titleError}
          helper="De 3 a 60 caracteres."
        />
        <TextField
          label="Local"
          value={place}
          onChangeText={setPlace}
          error={placeError}
          helper="De 3 a 100 caracteres."
        />
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 3 }}>
            <TextField
              label="Data"
              value={date}
              onChangeText={setDate}
              error={dateError}
              placeholder="DD/MM/AAAA"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
          </View>
          <View style={{ flex: 2 }}>
            <TextField
              label="Hora"
              value={time}
              onChangeText={setTime}
              placeholder="HH:MM"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        </View>
        <ErrorBanner error={otherError} />
        <Button
          label="Propor encontro"
          loading={pending}
          onPress={() => void run()}
        />
      </ScrollView>
    </Screen>
  );
}
