import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

function copyTextFallback(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export function ShareStateButton() {
  const [copied, setCopied] = useState(false);

  const copyCurrentUrl = async () => {
    const href = window.location.href;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(href);
      } else {
        copyTextFallback(href);
      }

      setCopied(true);
      toast({
        title: 'Share link copied',
        description: 'The current lab, controls, and filters are encoded in the URL.',
      });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'The browser blocked clipboard access. The current URL is still shareable from the address bar.',
        variant: 'destructive',
      });
    }
  };

  const Icon = copied ? Check : Share2;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void copyCurrentUrl()}
      aria-label="Copy share link for current simulator state"
      className="shrink-0 gap-2 border-border/60 bg-background/50"
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
    </Button>
  );
}
