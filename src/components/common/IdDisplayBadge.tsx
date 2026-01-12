import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface IdDisplayBadgeProps {
  id: string;
  label?: string;
  variant?: 'default' | 'secondary' | 'outline';
  copyable?: boolean;
}

export function IdDisplayBadge({ 
  id, 
  label, 
  variant = 'outline',
  copyable = true 
}: IdDisplayBadgeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      toast.success('ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy ID');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-sm text-muted-foreground">{label}:</span>
      )}
      <Badge variant={variant} className="font-mono text-xs">
        {id}
      </Badge>
      {copyable && (
        <button
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Copy ID"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  );
}
