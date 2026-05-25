'use client';

import { useState } from 'react';

export function SyncContentButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/journey/sync-content', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Sync failed');
        return;
      }

      const draftLocalized = data.editorialSummary?.draftLocalized || 0;
      const untranslated = data.editorialSummary?.untranslated || 0;
      setMessage(
        `Synced ${data.synced} days (${data.failed} failed). Urdu draft-localized: ${draftLocalized}, untranslated: ${untranslated}.`
      );
    } catch (error) {
      setMessage('Sync failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={loading}
        className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] disabled:opacity-50"
      >
        {loading ? 'Syncing...' : 'Sync multilingual day files'}
      </button>
      {message && <p className="text-sm text-[var(--color-text-muted)]">{message}</p>}
    </div>
  );
}
