'use client';

import { useUserProfile } from '@/firebase/auth/use-user-profile';
import Link from 'next/link';

export function AdminFooterLink() {
  const { isAdmin, loading } = useUserProfile();

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <li>
      <Link href="/admin" className="text-sm text-gray-300 hover:text-white transition-colors">
        Admin
      </Link>
    </li>
  );
}
