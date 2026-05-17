'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface NavItemProps {
  href: string;
  children: ReactNode;
}

export function NavItem({ href, children }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={`flex items-center gap-[10px] px-4 py-[10px] rounded-lg transition-colors ${
        isActive
          ? 'bg-white/20 text-white'
          : 'text-white/80 hover:bg-white/10'
      }`}
    >
      {children}
    </Link>
  );
}