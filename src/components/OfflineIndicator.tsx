import React from 'react';
import { WifiOff, Database } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Language } from '../utils/i18n';

interface OfflineIndicatorProps {
  lang: Language;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ lang }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600 dark:bg-amber-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xl border border-amber-500 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="relative flex items-center justify-center">
        <WifiOff className="w-4 h-4 text-white" />
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-300 animate-ping" />
      </div>
      <div>
        <span>
          {lang === 'vi'
            ? 'Ngoại tuyến (Offline) — Dữ liệu được bảo toàn bền vững'
            : 'Offline Mode — Operating from persistent local database'}
        </span>
      </div>
    </div>
  );
};
