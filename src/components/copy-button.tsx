'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n/context';

interface CopyButtonProps {
  text: string;
  translation?: string;
  className?: string;
}

export function CopyButton({ text, translation, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const { language } = useLanguage();
  const uiCopy = language === 'ur'
    ? {
        copiedToast: 'آیت نقل ہو گئی',
        copyTitle: 'آیت نقل کریں',
        copiedLabel: 'نقل ہو گئی',
      }
    : {
        copiedToast: 'Verse copied',
        copyTitle: 'Copy verse',
        copiedLabel: 'Copied!',
      };

  const handleCopy = async () => {
    const content = translation ? `${text}\n\n${translation}` : text;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success(uiCopy.copiedToast);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors flex-shrink-0 p-1 ${className}`}
      title={uiCopy.copyTitle}
    >
      {copied ? (
        <span className="text-xs text-[var(--color-primary)] animate-fade-in">{uiCopy.copiedLabel}</span>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}
