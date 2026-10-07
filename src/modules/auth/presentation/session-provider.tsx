import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { useDependency } from '@/core/di';

import { authRepositoryToken } from '../domain/auth-repository';
import type { AuthUser } from '../domain/auth-repository';
import { restoreSession } from '../domain/session-use-cases';

export type SessionStatus = 'loading' | 'signedIn' | 'signedOut';

export interface Session {
  status: SessionStatus;
  user: AuthUser | null;
}

const SessionContext = createContext<Session | null>(null);

function sessionFor(user: AuthUser | null): Session {
  return { status: user ? 'signedIn' : 'signedOut', user };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const repo = useDependency(authRepositoryToken);
  const [session, setSession] = useState<Session>({
    status: 'loading',
    user: null,
  });

  useEffect(() => {
    let active = true;
    // An auth event is newer than the restore, so it wins if it arrives first.
    let eventSeen = false;
    const unsubscribe = repo.subscribe((user) => {
      eventSeen = true;
      setSession(sessionFor(user));
    });
    void restoreSession(repo).then((user) => {
      if (active && !eventSeen) setSession(sessionFor(user));
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [repo]);

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return session;
}
