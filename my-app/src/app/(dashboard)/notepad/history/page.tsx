'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// The old "History" page has been absorbed into the main Notes page as the
// "Recently Deleted" filter. We keep this route so any existing link/bookmark
// still lands the user in the right place.
export default function NotepadHistoryRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/notepad/notes?view=deleted');
  }, [router]);
  return (
    <div className="min-h-full flex items-center justify-center bg-gray-50">
      <div className="text-sm text-gray-500">Redirecting to Recently Deleted…</div>
    </div>
  );
}
