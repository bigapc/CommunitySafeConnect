'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LiveRefreshPill({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(Math.round(intervalMs / 1000));

  useEffect(() => {
    const tick = setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          router.refresh();
          return Math.round(intervalMs / 1000);
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [router, intervalMs]);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
      Live refresh in {seconds}s
    </div>
  );
}
