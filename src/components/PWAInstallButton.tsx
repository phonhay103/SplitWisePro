import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../utils/i18n';

interface PWAInstallButtonProps {
  lang: Language;
  variant?: 'header' | 'prominent' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang, variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running in standalone mode (already installed as PWA), do not render
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  const label = lang === 'vi' ? 'Cài đặt App' : 'Install App';

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleClick}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
          title={lang === 'vi' ? 'Cài đặt ứng dụng PWA lên điện thoại hoặc máy tính' : 'Install PWA to Home Screen or Desktop'}
        >
          <Download className="w-3.5 h-3.5" />
          <span>{label}</span>
        </button>
      )}

      {variant === 'prominent' && (
        <button
          onClick={handleClick}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md hover:shadow-lg"
        >
          <Smartphone className="w-4 h-4" />
          <span>{label}</span>
        </button>
      )}

      {/* Guide Modal for iOS Safari and other browsers */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {lang === 'vi' ? 'Cài đặt SplitWise Pro' : 'Install SplitWise Pro'}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {lang === 'vi' ? 'Chạy mượt như app gốc, offline & lưu trữ bền vững' : 'Native app experience, offline & persistent'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      {lang === 'vi' ? (
                        <span>
                          Nhấn nút <strong>Chia sẻ (Share)</strong> <Share className="w-3.5 h-3.5 inline mx-1 text-neutral-600 dark:text-neutral-300" /> ở thanh công cụ trình duyệt Safari.
                        </span>
                      ) : (
                        <span>
                          Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-1 text-neutral-600 dark:text-neutral-300" /> in Safari navigation bar.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      {lang === 'vi' ? (
                        <span>
                          Cuộn xuống và chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-neutral-600 dark:text-neutral-300" />.
                        </span>
                      ) : (
                        <span>
                          Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-neutral-600 dark:text-neutral-300" />.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      {lang === 'vi' ? 'Bấm "Thêm" ở góc trên cùng bên phải để hoàn tất.' : 'Tap "Add" in the top right corner to finish.'}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      {lang === 'vi'
                        ? 'Nhấn vào biểu tượng Cài đặt trên thanh địa chỉ trình duyệt (hoặc menu 3 chấm ⋮).'
                        : 'Click the Install icon in your browser address bar or menu (⋮).'}
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      {lang === 'vi'
                        ? 'Chọn "Cài đặt SplitWise Pro" để đưa biểu tượng ra Màn hình chính.'
                        : 'Select "Install SplitWise Pro" to pin to your home screen or desktop.'}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'vi'
                  ? 'Ứng dụng hoạt động ngay cả khi không có mạng và dữ liệu được bảo vệ an toàn.'
                  : 'Works offline with persistent, un-evicted local storage.'}
              </span>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors"
            >
              {lang === 'vi' ? 'Đã hiểu' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
