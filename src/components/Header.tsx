import React, { useState } from 'react';
import {
  Plus,
  Users,
  Receipt,
  ArrowRightLeft,
  FileText,
  ChevronDown,
  Edit2,
  Sun,
  Moon,
} from 'lucide-react';
import { Group } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { CURRENCIES } from '../utils/currency';
import { PWAInstallButton } from './PWAInstallButton';
import { LanguageDropdown } from './LanguageDropdown';

interface HeaderProps {
  currentGroup: Group;
  activeTab: 'expenses' | 'settlement' | 'members';
  lang: Language;
  theme: 'light' | 'dark';
  onTabChange: (tab: 'expenses' | 'settlement' | 'members') => void;
  onSetLanguage: (lang: Language) => void;
  onToggleTheme: () => void;
  onChangeCurrency: (newCurrency: string) => void;
  onOpenAddExpense: () => void;
  onOpenGroupSelector: () => void;
  onOpenSummaryReport: () => void;
  onOpenRenameTrip: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentGroup,
  activeTab,
  lang,
  theme,
  onTabChange,
  onSetLanguage,
  onToggleTheme,
  onChangeCurrency,
  onOpenAddExpense,
  onOpenGroupSelector,
  onOpenSummaryReport,
  onOpenRenameTrip,
}) => {
  const t = TRANSLATIONS[lang];
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand & Group Switcher */}
        <div className="flex items-center gap-2.5 min-w-0">
          <a
            href="/"
            className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 shrink-0 font-sans"
          >
            {t.appName}<span className="text-emerald-600 dark:text-emerald-400">{t.appSub}</span>
          </a>

          <span className="text-neutral-300 dark:text-neutral-700 select-none hidden xs:inline">/</span>

          {/* Current trip button */}
          <div className="flex items-center gap-1 min-w-0">
            <button
              onClick={onOpenGroupSelector}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors truncate max-w-[150px] sm:max-w-[220px] focus-visible:outline-2 focus-visible:outline-emerald-500"
              title={t.switchTrip}
            >
              <span className="truncate">{currentGroup.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </button>

            {/* Quick Rename Button */}
            <button
              onClick={onOpenRenameTrip}
              className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title={t.editTripName}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Desktop Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 text-xs">
          <button
            onClick={() => onTabChange('expenses')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'expenses'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{t.expensesTab} ({currentGroup.expenses.length})</span>
          </button>

          <button
            onClick={() => onTabChange('settlement')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'settlement'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{t.settlementTab}</span>
          </button>

          <button
            onClick={() => onTabChange('members')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'members'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.membersTab} ({currentGroup.members.length})</span>
          </button>
        </nav>

        {/* Global Controls: Currency + Language + Theme + Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Currency Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              className="px-2 py-1 text-xs font-mono font-bold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors flex items-center gap-0.5"
              title={t.currency}
            >
              <span>{currentGroup.currency}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {showCurrencyDropdown && (
              <div className="absolute right-0 mt-1 py-1 w-40 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 z-50 animate-in fade-in duration-100 max-h-64 overflow-y-auto">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      onChangeCurrency(c.code);
                      setShowCurrencyDropdown(false);
                    }}
                    className={`w-full px-3 py-1.5 text-xs text-left font-mono font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-between gap-2 ${
                      currentGroup.currency === c.code
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <span>
                      {c.code} <span className="text-neutral-400 dark:text-neutral-500">({c.symbol})</span>
                    </span>
                    {currentGroup.currency === c.code && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Selector */}
          <LanguageDropdown lang={lang} onSelect={onSetLanguage} />

          {/* Theme Toggle Light / Dark */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 text-xs text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors flex items-center justify-center"
            title={theme === 'dark' ? t.switchToLight : t.switchToDark}
            aria-label={theme === 'dark' ? t.switchToLight : t.switchToDark}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-600" />
            )}
          </button>

          {/* In-App PWA Install Button */}
          <PWAInstallButton lang={lang} variant="header" />

          {/* Report Button */}
          <button
            onClick={onOpenSummaryReport}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span>{t.summaryReportBtn}</span>
          </button>

          {/* Add Expense Button */}
          <button
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">{t.addExpenseBtn}</span>
            <span className="xs:hidden">{t.addShortBtn}</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-around text-xs">
        <button
          onClick={() => onTabChange('expenses')}
          className={`flex-1 py-1 text-center font-medium rounded-md transition-colors ${
            activeTab === 'expenses'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-bold shadow-2xs'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          {t.expensesTab} ({currentGroup.expenses.length})
        </button>
        <button
          onClick={() => onTabChange('settlement')}
          className={`flex-1 py-1 text-center font-medium rounded-md transition-colors ${
            activeTab === 'settlement'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-bold shadow-2xs'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          {t.settlementTab}
        </button>
        <button
          onClick={() => onTabChange('members')}
          className={`flex-1 py-1 text-center font-medium rounded-md transition-colors ${
            activeTab === 'members'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-bold shadow-2xs'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          {t.membersTab} ({currentGroup.members.length})
        </button>
        <button
          onClick={onOpenSummaryReport}
          className="flex-1 py-1 text-center font-bold text-emerald-700 dark:text-emerald-400 rounded-md"
        >
          {t.reportBtn}
        </button>
      </div>
    </header>
  );
};
