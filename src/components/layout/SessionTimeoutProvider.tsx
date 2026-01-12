import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { SessionTimeoutWarning } from '@/components/auth/SessionTimeoutWarning';

export function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const { showWarning, remainingSeconds, extendSession, logout } = useSessionTimeout();

  return (
    <>
      {children}
      <SessionTimeoutWarning
        open={showWarning}
        remainingSeconds={remainingSeconds}
        onExtend={extendSession}
        onLogout={logout}
      />
    </>
  );
}
