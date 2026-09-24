import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import {
  Plus,
  Receipt,
  Users,
  ArrowRightLeft,
  FileText,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Share2,
  Globe,
  Edit2,
  UserPlus,
} from 'lucide-react';
import { Group, Expense, Member, SettlementMode } from './types';
import { formatCurrency, normalizeCurrencyCode } from './utils/currency';
import { calculateMemberBalances, computeOptimizedSettlements } from './utils/debtSettlement';
import { generateGroupSummaryText } from './utils/exportUtils';
import { Language, TRANSLATIONS } from './utils/i18n';
import { loadPersistentGroups, savePersistentGroups, requestPersistentStorage } from './utils/persistentStorage';
import { Header } from './components/Header';
import { ExpenseList } from './components/ExpenseList';
import { SettlementView } from './components/SettlementView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';

// Modals are code-split so the initial bundle stays lean for fast PWA startup.
const ExpenseModal = lazy(() =>
  import('./components/ExpenseModal').then((m) => ({ default: m.ExpenseModal }))
);
const MemberReportModal = lazy(() =>
  import('./components/MemberReportModal').then((m) => ({ default: m.MemberReportModal }))
);
const SummaryReportModal = lazy(() =>
  import('./components/SummaryReportModal').then((m) => ({ default: m.SummaryReportModal }))
);
const MemberManagerModal = lazy(() =>
  import('./components/MemberManagerModal').then((m) => ({ default: m.MemberManagerModal }))
);
const GroupSelectorModal = lazy(() =>
  import('./components/GroupSelectorModal').then((m) => ({ default: m.GroupSelectorModal }))
);
const RenameTripModal = lazy(() =>
  import('./components/RenameTripModal').then((m) => ({ default: m.RenameTripModal }))
);

const ModalFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40">
    <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-emerald-600 animate-spin" />
  </div>
);

const STORAGE_KEY_GROUPS = 'splitwise_groups_v3';
const STORAGE_KEY_ACTIVE_GROUP_ID = 'splitwise_active_group_id_v3';
const STORAGE_KEY_LANG = 'splitwise_app_lang_v3';
const STORAGE_KEY_LAST_PAYER = 'splitwise_last_payer_id_v3';
const STORAGE_KEY_THEME = 'splitwise_theme_v3';

export default function App() {
  // Theme: Light / Dark
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'dark' || saved === 'light') return saved;
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      console.error(e);
    }
    return 'light';
  });

  // Language: Default 'en', can toggle to 'vi'
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      if (saved === 'vi' || saved === 'en') return saved;
    } catch (e) {
      console.error(e);
    }
    return 'en';
  });

  const t = TRANSLATIONS[lang];

  // Groups state (no sample data — starts empty, user creates their own trips)
  const [groups, setGroups] = useState<Group[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GROUPS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load groups from storage', e);
    }
    return [];
  });

  const [currentGroupId, setCurrentGroupId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_GROUP_ID);
      if (savedId && groups.some((g) => g.id === savedId)) {
        return savedId;
      }
    } catch (e) {
      console.error(e);
    }
    return groups[0]?.id || '';
  });

  const currentGroup = useMemo(() => {
    return groups.find((g) => g.id === currentGroupId) || groups[0];
  }, [groups, currentGroupId]);

  // Last payer memory across continuous entries
  const [lastPayerId, setLastPayerId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_LAST_PAYER) || '';
    } catch (e) {
      return '';
    }
  });

  const [settlementMode, setSettlementMode] = useState<SettlementMode>('direct_optimized');
  const [activeTab, setActiveTab] = useState<'expenses' | 'settlement' | 'members'>('expenses');

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isMemberManagerOpen, setIsMemberManagerOpen] = useState(false);
  const [isGroupSelectorOpen, setIsGroupSelectorOpen] = useState(false);
  const [isRenameTripOpen, setIsRenameTripOpen] = useState(false);
  const [isSummaryReportOpen, setIsSummaryReportOpen] = useState(false);
  const [selectedMemberReportId, setSelectedMemberReportId] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Request browser persistent storage permission and hydrate from IndexedDB
  useEffect(() => {
    requestPersistentStorage();
    loadPersistentGroups(groups).then((durableGroups) => {
      if (durableGroups && durableGroups.length > 0) {
        // One-time migration: legacy symbol currencies -> ISO 4217 codes.
        const normalized = durableGroups.map((g) => ({
          ...g,
          currency: normalizeCurrencyCode(g.currency),
        }));
        setGroups(normalized);
      } else {
        // No data at all — guide the user to create their first trip.
        setIsGroupSelectorOpen(true);
      }
    });
    // Honor PWA shortcut launches (manifest shortcuts): ?tab=settlement / ?action=add-expense
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'settlement') {
        setActiveTab('settlement');
      }
      if (params.get('action') === 'add-expense' && groups.length > 0) {
        setEditingExpense(null);
        setIsExpenseModalOpen(true);
      }
      if (params.size > 0) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sync state to storage (both IndexedDB durable storage and localStorage warm cache)
  useEffect(() => {
    try {
      savePersistentGroups(groups);
      localStorage.setItem(STORAGE_KEY_ACTIVE_GROUP_ID, currentGroupId);
      localStorage.setItem(STORAGE_KEY_LANG, lang);
      localStorage.setItem(STORAGE_KEY_LAST_PAYER, lastPayerId);
      localStorage.setItem(STORAGE_KEY_THEME, theme);

      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    } catch (e) {
      console.error('Failed to save to storage', e);
    }
  }, [groups, currentGroupId, lang, lastPayerId, theme]);

  // Member Balances
  const memberBalances = useMemo(() => {
    if (!currentGroup) return [];
    return calculateMemberBalances(currentGroup.members, currentGroup.expenses);
  }, [currentGroup]);

  // Optimal Settlements
  const settlementResult = useMemo(() => {
    if (!currentGroup) return { transactions: [], debtorTransferCounts: {}, maxTransfersPerDebtor: 0 };
    return computeOptimizedSettlements(
      memberBalances,
      settlementMode,
      currentGroup.collectorId,
      currentGroup.settlementsPaid || {}
    );
  }, [memberBalances, settlementMode, currentGroup]);

  const updateCurrentGroup = (updater: (prev: Group) => Group) => {
    if (!currentGroup) return;
    const targetId = currentGroup.id;
    setGroups((prevGroups) =>
      prevGroups.map((g) => {
        if (g.id === targetId) {
          return updater(g);
        }
        return g;
      })
    );
  };

  // Currency quick change
  const handleChangeCurrency = (newCurrency: string) => {
    updateCurrentGroup((prev) => ({
      ...prev,
      currency: normalizeCurrencyCode(newCurrency),
    }));
    showToast(lang === 'vi' ? `Đã đổi tiền tệ sang ${normalizeCurrencyCode(newCurrency)}` : `Currency changed to ${normalizeCurrencyCode(newCurrency)}`);
  };

  // Trip name & currency update
  const handleUpdateTripDetails = (groupId: string, newName: string, newCurrency: string) => {
    const code = normalizeCurrencyCode(newCurrency);
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return { ...g, name: newName, currency: code };
        }
        return g;
      })
    );
    showToast(lang === 'vi' ? 'Đã lưu thông tin chuyến đi' : 'Trip details updated');
  };

  // Language toggle
  const handleToggleLanguage = () => {
    const nextLang: Language = lang === 'en' ? 'vi' : 'en';
    setLang(nextLang);
    showToast(nextLang === 'vi' ? 'Đã chuyển sang Tiếng Việt' : 'Switched to English');
  };

  // Theme toggle
  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    showToast(
      nextTheme === 'dark'
        ? (lang === 'vi' ? 'Đã bật giao diện tối' : 'Dark mode enabled')
        : (lang === 'vi' ? 'Đã bật giao diện sáng' : 'Light mode enabled')
    );
  };

  // Expense Handlers
  const handleSaveExpense = (savedExpense: Expense, payerIdUsed: string) => {
    // Remember last payer for continuous entry
    if (payerIdUsed) {
      setLastPayerId(payerIdUsed);
    }

    updateCurrentGroup((prev) => {
      const exists = prev.expenses.some((e) => e.id === savedExpense.id);
      const newExpenses = exists
        ? prev.expenses.map((e) => (e.id === savedExpense.id ? savedExpense : e))
        : [savedExpense, ...prev.expenses];
      return { ...prev, expenses: newExpenses };
    });
    setEditingExpense(null);
    showToast(editingExpense ? (lang === 'vi' ? 'Đã cập nhật khoản chi' : 'Expense updated') : (lang === 'vi' ? 'Đã thêm khoản chi mới' : 'Expense added'));
  };

  const handleDeleteExpense = (expenseId: string) => {
    updateCurrentGroup((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== expenseId),
    }));
    showToast(lang === 'vi' ? 'Đã xoá khoản chi' : 'Expense removed');
  };

  // Member Handlers
  const handleSaveMember = (memberToSave: Member) => {
    updateCurrentGroup((prev) => {
      const exists = prev.members.some((m) => m.id === memberToSave.id);
      const newMembers = exists
        ? prev.members.map((m) => (m.id === memberToSave.id ? memberToSave : m))
        : [...prev.members, memberToSave];
      return { ...prev, members: newMembers };
    });
    showToast(lang === 'vi' ? 'Đã lưu thành viên' : 'Member saved');
  };

  const handleDeleteMember = (memberId: string) => {
    updateCurrentGroup((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== memberId),
      collectorId: prev.collectorId === memberId ? undefined : prev.collectorId,
    }));
    showToast(lang === 'vi' ? 'Đã xoá thành viên' : 'Member deleted');
  };

  const handleSetCollector = (memberId: string) => {
    updateCurrentGroup((prev) => ({
      ...prev,
      collectorId: memberId,
    }));
    showToast(lang === 'vi' ? 'Đã chọn làm Thủ quỹ' : 'Designated as Collector');
  };

  // Quick Batch Add members (Member 1, Member 2...)
  const handleBatchAddMembers = (count: number) => {
    const AVATAR_COLORS = [
      'bg-emerald-500',
      'bg-blue-500',
      'bg-rose-500',
      'bg-purple-500',
      'bg-amber-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    updateCurrentGroup((prev) => {
      const startNum = prev.members.length + 1;
      const newMembers: Member[] = [];
      for (let i = 0; i < count; i++) {
        const num = startNum + i;
        newMembers.push({
          id: `mem-${Date.now()}-${num}`,
          name: lang === 'vi' ? `Thành viên ${num}` : `Member ${num}`,
          avatarColor: AVATAR_COLORS[(num - 1) % AVATAR_COLORS.length],
        });
      }
      return {
        ...prev,
        members: [...prev.members, ...newMembers],
      };
    });
    showToast(lang === 'vi' ? `Đã tạo thêm ${count} thành viên` : `Generated ${count} members`);
  };

  const hasExpensesForMember = (memberId: string): boolean => {
    return currentGroup.expenses.some(
      (e) =>
        e.payerId === memberId ||
        e.multiplePayers?.some((p) => p.memberId === memberId) ||
        e.beneficiaries.some((b) => b.memberId === memberId)
    );
  };

  const handleTogglePaid = (txId: string, fromId: string, toId: string) => {
    const key = `${fromId}->${toId}`;
    updateCurrentGroup((prev) => {
      const paidMap = { ...(prev.settlementsPaid || {}) };
      paidMap[key] = !paidMap[key];
      return { ...prev, settlementsPaid: paidMap };
    });
  };

  // Creating a new trip:
  // REQUIREMENT: By default 0 members, or user enters initial member count e.g. 4 -> auto-names Member 1, Member 2...
  const handleCreateGroup = (name: string, currency: string, initialMemberCount: number) => {
    const AVATAR_COLORS = [
      'bg-emerald-500',
      'bg-blue-500',
      'bg-rose-500',
      'bg-purple-500',
      'bg-amber-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];

    const initialMembers: Member[] = [];
    for (let i = 1; i <= initialMemberCount; i++) {
      initialMembers.push({
        id: `mem-${Date.now()}-${i}`,
        name: lang === 'vi' ? `Thành viên ${i}` : `Member ${i}`,
        avatarColor: AVATAR_COLORS[(i - 1) % AVATAR_COLORS.length],
      });
    }

    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name,
      currency: normalizeCurrencyCode(currency),
      createdAt: new Date().toISOString().slice(0, 10),
      members: initialMembers,
      expenses: [],
      settlementsPaid: {},
    };

    setGroups((prev) => [newGroup, ...prev]);
    setCurrentGroupId(newGroup.id);
    showToast(lang === 'vi' ? `Đã tạo chuyến đi "${name}"` : `Created trip "${name}"`);
  };

  const handleDeleteGroup = (groupId: string) => {
    const remaining = groups.filter((g) => g.id !== groupId);
    setGroups(remaining);
    if (currentGroupId === groupId) {
      setCurrentGroupId(remaining[0]?.id || '');
    }
    showToast(lang === 'vi' ? 'Đã xoá chuyến đi' : 'Trip deleted');
  };

  const handleExportAllJson = () => {
    const dataStr = JSON.stringify(groups, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SplitWise_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(lang === 'vi' ? 'Đã tải file sao lưu JSON' : 'Backup file downloaded');
  };

  const handleImportJson = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].members) {
        const normalized = (parsed as Group[]).map((g) => ({
          ...g,
          currency: normalizeCurrencyCode(g.currency),
        }));
        setGroups(normalized);
        setCurrentGroupId(normalized[0].id);
        showToast(lang === 'vi' ? 'Đã nạp dữ liệu thành công' : 'Data imported successfully');
      } else {
        alert(lang === 'vi' ? 'Định dạng file sao lưu không hợp lệ.' : 'Invalid backup format.');
      }
    } catch (e) {
      alert(lang === 'vi' ? 'Không thể đọc file JSON.' : 'Could not parse JSON file.');
    }
  };

  const totalSpent = (currentGroup?.expenses ?? []).reduce((s, e) => s + e.amount, 0);

  // Empty state — no trips yet (no sample data bundled)
  if (!currentGroup) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors">
        <OfflineIndicator lang={lang} />
        <PWAUpdatePrompt lang={lang} />

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-neutral-700 dark:border-neutral-300 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {toastMessage}
          </div>
        )}

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-lg">
              <Receipt className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {lang === 'vi' ? 'Chia tiền nhóm dễ dàng' : 'Split group expenses effortlessly'}
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                {lang === 'vi'
                  ? 'Tạo chuyến đi đầu tiên để bắt đầu ghi chép chi tiêu và tối ưu thanh toán nợ.'
                  : 'Create your first trip to start tracking expenses and optimizing settlements.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setIsGroupSelectorOpen(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                {lang === 'vi' ? 'Tạo chuyến đi' : 'Create trip'}
              </button>
              <button
                onClick={handleToggleLanguage}
                className="px-4 py-2.5 text-sm font-bold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-xl transition-colors"
              >
                {lang === 'en' ? 'Tiếng Việt' : 'English'}
              </button>
            </div>
          </div>
        </main>

        {isGroupSelectorOpen && (
          <Suspense fallback={<ModalFallback />}>
            <GroupSelectorModal
              isOpen={isGroupSelectorOpen}
              onClose={() => setIsGroupSelectorOpen(false)}
              groups={groups}
              currentGroupId={currentGroupId}
              lang={lang}
              onSelectGroup={(id) => setCurrentGroupId(id)}
              onCreateGroup={handleCreateGroup}
              onUpdateGroupDetails={handleUpdateTripDetails}
              onDeleteGroup={handleDeleteGroup}
              onExportAllJson={handleExportAllJson}
              onImportJson={handleImportJson}
            />
          </Suspense>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors">
      {/* Offline Status Floating Indicator */}
      <OfflineIndicator lang={lang} />
      {/* Service Worker update / offline-ready prompts */}
      <PWAUpdatePrompt lang={lang} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-neutral-700 dark:border-neutral-300 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Header with Language, Theme, Currency, Rename Trip buttons */}
      <Header
        currentGroup={currentGroup}
        activeTab={activeTab}
        lang={lang}
        theme={theme}
        onTabChange={setActiveTab}
        onToggleLanguage={handleToggleLanguage}
        onToggleTheme={handleToggleTheme}
        onChangeCurrency={handleChangeCurrency}
        onOpenAddExpense={() => {
          setEditingExpense(null);
          setIsExpenseModalOpen(true);
        }}
        onOpenGroupSelector={() => setIsGroupSelectorOpen(true)}
        onOpenSummaryReport={() => setIsSummaryReportOpen(true)}
        onOpenRenameTrip={() => setIsRenameTripOpen(true)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top Summary Banner */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                <span>{currentGroup.members.length} {t.membersCount}</span>
                <span aria-hidden="true">·</span>
                <span>{currentGroup.expenses.length} {t.expensesLogged}</span>
                {currentGroup.createdAt && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{currentGroup.createdAt}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  {currentGroup.name}
                </h2>
                <button
                  onClick={() => setIsRenameTripOpen(true)}
                  className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title={t.editTripName}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-left sm:text-right">
                <span className="text-xs text-neutral-400 dark:text-neutral-500 block">{t.totalSpending}</span>
                <span className="text-2xl font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(totalSpent, currentGroup.currency)}
                </span>
              </div>

              <button
                onClick={() => {
                  const summaryText = generateGroupSummaryText(
                    currentGroup,
                    memberBalances,
                    settlementResult.transactions,
                    lang
                  );
                  navigator.clipboard.writeText(summaryText);
                  showToast(t.copiedSummaryToast);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/80 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                title={t.copySummaryBtn}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.copySummaryBtn}</span>
              </button>
            </div>
          </div>

          {/* Quick Member Prompt if trip has 0 members */}
          {currentGroup.members.length === 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60">
              <div className="text-xs text-amber-800 dark:text-amber-300">
                {t.quickAddMembersPrompt}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBatchAddMembers(4)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 rounded-lg hover:bg-amber-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  {lang === 'vi' ? '+ Tạo nhanh 4 thành viên' : '+ Quick Add 4 Members'}
                </button>
                <button
                  onClick={() => setIsMemberManagerOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {t.addMembersNow}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View Switcher based on Active Tab */}
        {activeTab === 'expenses' && (
          <ExpenseList
            expenses={currentGroup.expenses}
            members={currentGroup.members}
            currency={currentGroup.currency}
            lang={lang}
            onAddExpense={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            onEditExpense={(expense) => {
              setEditingExpense(expense);
              setIsExpenseModalOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'settlement' && (
          <SettlementView
            group={currentGroup}
            members={currentGroup.members}
            balances={memberBalances}
            settlements={settlementResult.transactions}
            mode={settlementMode}
            lang={lang}
            onModeChange={setSettlementMode}
            onTogglePaid={handleTogglePaid}
            onOpenMemberReport={(memberId) => setSelectedMemberReportId(memberId)}
            onOpenGroupReport={() => setIsSummaryReportOpen(true)}
          />
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                  {t.groupMembersTitle} ({currentGroup.members.length})
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {lang === 'vi' ? 'Bấm "Báo cáo" để xem chi tiết tiền ăn uống, chi trả của từng người' : 'Click "Report" on any member to view their individual itemized report'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBatchAddMembers(3)}
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                  <span>{lang === 'vi' ? '+ Thêm 3 người' : '+ Quick 3'}</span>
                </button>

                <button
                  onClick={() => setIsMemberManagerOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white rounded-lg transition-colors"
                >
                  {lang === 'vi' ? 'Quản lý thành viên' : 'Manage Members'}
                </button>
              </div>
            </div>

            {currentGroup.members.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 mx-auto flex items-center justify-center mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  {lang === 'vi' ? 'Chưa có thành viên nào' : 'No members yet'}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 max-w-sm mx-auto">
                  {t.quickAddMembersPrompt}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleBatchAddMembers(4)}
                    className="px-4 py-2 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                  >
                    {lang === 'vi' ? 'Tạo nhanh 4 thành viên (Member 1..4)' : 'Quick generate 4 members'}
                  </button>
                  <button
                    onClick={() => setIsMemberManagerOpen(true)}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                  >
                    {t.addMemberBtn}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {currentGroup.members.map((m) => {
                  const bal = memberBalances.find((b) => b.memberId === m.id);
                  const isCollector = currentGroup.collectorId === m.id;

                  return (
                    <div
                      key={m.id}
                      className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full ${m.avatarColor} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}
                          >
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{m.name}</span>
                              {isCollector && (
                                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-0.5 font-bold">
                                  <ShieldCheck className="w-3 h-3" />
                                  {t.collectorBadge}
                                </span>
                              )}
                            </div>
                            {m.paymentDetails && (
                              <span className="text-xs text-neutral-400 dark:text-neutral-500 block font-mono truncate max-w-[140px]">
                                {m.paymentDetails}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedMemberReportId(m.id)}
                          className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-emerald-700 dark:hover:text-emerald-400 font-bold"
                        >
                          {lang === 'vi' ? 'Báo cáo ➔' : 'Report ➔'}
                        </button>
                      </div>

                      {/* Financial balance stats */}
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-100 dark:border-neutral-800 font-mono">
                        <div>
                          <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] font-sans">
                            {lang === 'vi' ? 'Đã chi' : 'Paid'}
                          </span>
                          <span className="text-neutral-800 dark:text-neutral-200 font-semibold">
                            {formatCurrency(bal?.totalPaid || 0, currentGroup.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] font-sans">
                            {lang === 'vi' ? 'Tiêu thụ' : 'Consumed'}
                          </span>
                          <span className="text-neutral-800 dark:text-neutral-200 font-semibold">
                            {formatCurrency(bal?.totalShare || 0, currentGroup.currency)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] font-sans">
                            {t.netBalance}
                          </span>
                          <span
                            className={`font-bold ${
                              (bal?.netBalance || 0) > 0.01
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : (bal?.netBalance || 0) < -0.01
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-neutral-400 dark:text-neutral-500'
                            }`}
                          >
                            {(bal?.netBalance || 0) > 0.01 ? '+' : ''}
                            {formatCurrency(bal?.netBalance || 0, currentGroup.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-6 mt-12 no-print transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <div>
            <strong className="font-bold text-neutral-800 dark:text-neutral-200">{t.appName}{t.appSub}</strong> ·{' '}
            {lang === 'vi' ? 'Chia tiền nhóm thông minh, hỗ trợ nhóm con & tối ưu thanh toán nợ 1 lần' : 'Group expense splitter with flexible subgroup sharing & 1-transfer settlement'}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsGroupSelectorOpen(true)}
              className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
            >
              {t.switchTrip}
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsSummaryReportOpen(true)}
              className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
            >
              {t.summaryReportBtn}
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={handleToggleLanguage}
              className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors font-bold"
            >
              {lang === 'en' ? 'Tiếng Việt' : 'English'}
            </button>
          </div>
        </div>
      </footer>

      {/* Modals (code-split) */}
      <Suspense fallback={<ModalFallback />}>
      {isExpenseModalOpen && (
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setEditingExpense(null);
          }}
          members={currentGroup.members}
          currency={currentGroup.currency}
          lang={lang}
          lastPayerId={lastPayerId}
          onSaveExpense={handleSaveExpense}
          editingExpense={editingExpense}
        />
      )}

      {isMemberManagerOpen && (
        <MemberManagerModal
          isOpen={isMemberManagerOpen}
          onClose={() => setIsMemberManagerOpen(false)}
          members={currentGroup.members}
          collectorId={currentGroup.collectorId}
          lang={lang}
          onSaveMember={handleSaveMember}
          onDeleteMember={handleDeleteMember}
          onSetCollector={handleSetCollector}
          onBatchAddMembers={handleBatchAddMembers}
          hasExpensesForMember={hasExpensesForMember}
        />
      )}

      {isRenameTripOpen && (
        <RenameTripModal
          isOpen={isRenameTripOpen}
          onClose={() => setIsRenameTripOpen(false)}
          group={currentGroup}
          lang={lang}
          onSave={(newName, newCurrency) => handleUpdateTripDetails(currentGroup.id, newName, newCurrency)}
        />
      )}

      {isGroupSelectorOpen && (
        <GroupSelectorModal
          isOpen={isGroupSelectorOpen}
          onClose={() => setIsGroupSelectorOpen(false)}
          groups={groups}
          currentGroupId={currentGroupId}
          lang={lang}
          onSelectGroup={(id) => setCurrentGroupId(id)}
          onCreateGroup={handleCreateGroup}
          onUpdateGroupDetails={handleUpdateTripDetails}
          onDeleteGroup={handleDeleteGroup}
          onExportAllJson={handleExportAllJson}
          onImportJson={handleImportJson}
        />
      )}

      {selectedMemberReportId && (
        <MemberReportModal
          isOpen={!!selectedMemberReportId}
          onClose={() => setSelectedMemberReportId(null)}
          memberId={selectedMemberReportId}
          group={currentGroup}
          balances={memberBalances}
          settlements={settlementResult.transactions}
          lang={lang}
        />
      )}

      {isSummaryReportOpen && (
        <SummaryReportModal
          isOpen={isSummaryReportOpen}
          onClose={() => setIsSummaryReportOpen(false)}
          group={currentGroup}
          balances={memberBalances}
          settlements={settlementResult.transactions}
          lang={lang}
        />
      )}
      </Suspense>
    </div>
  );
}
