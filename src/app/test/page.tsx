'use client';

import { useToast } from '@/hooks/use-toast';

export default function TestPage() {
  const toast = useToast();

  return (
    <main className="min-h-screen p-8" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <h1 className="text-3xl font-bold mb-8">Toast System Test</h1>

      <div className="space-y-6">
        <section className="card">
          <h2 className="text-lg font-medium mb-4">Toast Variants</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => toast.success('This is a success toast')}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ background: 'var(--color-success)', color: 'white' }}
            >
              Success Toast
            </button>
            <button
              onClick={() => toast.error('This is an error toast')}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ background: 'var(--color-error)', color: 'white' }}
            >
              Error Toast
            </button>
            <button
              onClick={() => toast.info('This is an info toast')}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ background: 'var(--color-text-muted)', color: 'white' }}
            >
              Info Toast
            </button>
          </div>
        </section>

        <section className="card">
          <h2 className="text-lg font-medium mb-4">Stacked Toasts</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Click multiple times to see stacked behavior
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                toast.success('First success');
                setTimeout(() => toast.info('Second info'), 300);
                setTimeout(() => toast.success('Third success'), 600);
              }}
              className="px-4 py-2 rounded-lg font-medium"
              style={{ background: 'var(--color-primary)', color: 'white' }}
            >
              Trigger Multiple
            </button>
          </div>
        </section>

        <section className="card">
          <h2 className="text-lg font-medium mb-4">Auto Dismiss Test</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Toasts disappear after 4 seconds. Watch the timer.
          </p>
          <button
            onClick={() => toast.success('Timer starts now')}
            className="px-4 py-2 rounded-lg font-medium"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          >
            Trigger and Time It
          </button>
        </section>

        <section className="card">
          <h2 className="text-lg font-medium mb-4">Real Actions</h2>
          <div className="space-y-3">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              These test toasts triggered by actual app actions:
            </p>
            <ul className="list-disc list-inside text-sm space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
              <li>Navigate to /quran/1 and hover a verse to copy it</li>
              <li>Go to /journey and save a reflection</li>
              <li>Visit /settings and save preferences</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}