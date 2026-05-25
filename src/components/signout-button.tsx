'use client';

import { useRouter } from 'next/navigation';
import { useCopy } from '@/hooks/use-copy';

export function SignOutButton() {
  const router = useRouter();
  const copy = useCopy();

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' }).catch(() => {});
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      aria-label={copy.common.actions.signOut}
      className="text-white/70 hover:text-white text-sm transition-colors"
    >
      {copy.common.actions.signOut}
    </button>
  );
}
