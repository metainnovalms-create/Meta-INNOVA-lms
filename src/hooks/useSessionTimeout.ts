import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformSettings } from '@/contexts/PlatformSettingsContext';

const WARNING_BEFORE_TIMEOUT_MS = 2 * 60 * 1000; // Show warning 2 minutes before timeout

export function useSessionTimeout() {
  const { isAuthenticated, logout } = useAuth();
  const { settings } = usePlatformSettings();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    clearAllTimers();
    setShowWarning(false);
    await logout();
  }, [clearAllTimers, logout]);

  const resetTimer = useCallback(() => {
    if (!settings.sessionTimeoutEnabled || !isAuthenticated) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    lastActivityRef.current = Date.now();
    setShowWarning(false);
    clearAllTimers();

    const timeoutMs = settings.sessionTimeoutMinutes * 60 * 1000;
    const warningMs = timeoutMs - WARNING_BEFORE_TIMEOUT_MS;

    // Set warning timer
    if (warningMs > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        setRemainingSeconds(Math.floor(WARNING_BEFORE_TIMEOUT_MS / 1000));
        
        // Start countdown
        countdownRef.current = setInterval(() => {
          setRemainingSeconds((prev) => {
            if (prev <= 1) {
              handleLogout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, warningMs);
    }

    // Set final logout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMs);
  }, [settings.sessionTimeoutEnabled, settings.sessionTimeoutMinutes, isAuthenticated, clearAllTimers, handleLogout]);

  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Set up activity listeners
  useEffect(() => {
    if (!settings.sessionTimeoutEnabled || !isAuthenticated) {
      return;
    }

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    
    const handleActivity = () => {
      // Only reset if not showing warning (to prevent accidental dismissal)
      if (!showWarning) {
        const now = Date.now();
        // Debounce: only reset if last activity was more than 1 second ago
        if (now - lastActivityRef.current > 1000) {
          resetTimer();
        }
      }
    };

    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer setup
    resetTimer();

    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
    };
  }, [settings.sessionTimeoutEnabled, isAuthenticated, showWarning, resetTimer, clearAllTimers]);

  return {
    showWarning,
    remainingSeconds,
    extendSession,
    logout: handleLogout,
  };
}
