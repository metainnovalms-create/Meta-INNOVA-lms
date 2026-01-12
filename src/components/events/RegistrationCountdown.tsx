import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface RegistrationCountdownProps {
  endDate: string;
  compact?: boolean;
}

export function RegistrationCountdown({ endDate, compact = false }: RegistrationCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [urgency, setUrgency] = useState<'safe' | 'warning' | 'urgent'>('safe');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endDate).getTime();
      const now = new Date().getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft('Registration closed');
        setUrgency('urgent');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      // Determine urgency
      if (days < 3) {
        setUrgency('urgent');
      } else if (days < 7) {
        setUrgency('warning');
      } else {
        setUrgency('safe');
      }

      // Format time left
      if (days > 0) {
        setTimeLeft(compact ? `${days}d ${hours}h` : `${days} days, ${hours} hours left`);
      } else if (hours > 0) {
        setTimeLeft(compact ? `${hours}h ${minutes}m` : `${hours} hours, ${minutes} minutes left`);
      } else {
        setTimeLeft(compact ? `${minutes}m` : `${minutes} minutes left`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [endDate, compact]);

  const getColorClass = () => {
    switch (urgency) {
      case 'safe':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'urgent':
        return 'text-red-600 dark:text-red-400';
    }
  };

  return (
    <div className={`flex items-center gap-1.5 ${getColorClass()}`}>
      <Clock className="h-4 w-4" />
      <span className="text-sm font-medium">{timeLeft}</span>
    </div>
  );
}
