'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function EcologyRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/social'); }, [router]);
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-accent animate-spin" />
    </div>
  );
}
