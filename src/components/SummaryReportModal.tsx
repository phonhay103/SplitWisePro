import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  Sparkles,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { Group, MemberBalance, SettlementTransaction } from '../types';
import { formatCurrency } from '../utils/currency';
import { generateGroupSummaryText, downloadExpensesCSV } from '../utils/exportUtils';
import { Language, TRANSLATIONS, LOCALES } from '../utils/i18n';

interface SummaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  balances: MemberBalance[];
  settlements: SettlementTransaction[];
  lang: Language;
}

export const SummaryReportModal: React.FC<SummaryReportModalProps> = ({
  isOpen,
  onClose,
  group,
  balances,
  settlements,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const totalSpent = group.expenses.reduce((sum, e) => sum + e.amount, 0);
  const memberCount = group.members.length;
  const avgPerPerson = memberCount > 0 ? totalSpent / memberCount : 0;

  const handleCopySummary = () => {
    const text = generateGroupSummaryText(group, balances, settlements, lang);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadCSV = () => {
    downloadExpensesCSV(group, balances, lang);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between no-print">
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-base">
              {t.summaryReportTitle}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{group.name}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-1.5"
              title="Download Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span className="hidden sm:inline">{t.exportCsvBtn}</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Print / Save PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 print-card">
          {/* Print only header */}
          <div className="hidden print-only mb-6">
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">
              {t.summaryReportTitle.toUpperCase()} - {group.name.toUpperCase()}
            </h1>
            <p className="text-xs text-neutral-500">
              {new Date().toLocaleDateString(LOCALES[lang] || 'en-US')} · {t.currency}: {group.currency}
            </p>
            <hr className="my-4 border-neutral-300" />
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 block">{t.groupSpendingStat}</span>
              <span className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1 block">
                {formatCurrency(totalSpent, group.currency)}
              </span>
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 block">
                {group.expenses.length} {t.expensesLogged}
              </span>
            </div>

            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 block">{t.groupSizeStat}</span>
              <span className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1 block">
                {memberCount} {t.membersCount}
              </span>
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 block">
                Avg: {formatCurrency(avgPerPerson, group.currency)} {t.perPerson}
              </span>
            </div>

            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {t.optimalPlanBadge}
              </span>
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1 block">
                {settlements.length} {t.transfersCountLabel}
              </span>
            </div>
          </div>

          {/* Member Balance Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
              {t.membersBalanceTable}
            </h4>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="p-3">{t.memberColHeader}</th>
                    <th className="p-3 text-right">{t.totalPaidColHeader}</th>
                    <th className="p-3 text-right">{t.consumedLabel}</th>
                    <th className="p-3 text-right">{t.netBalance}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {balances.map((b) => {
                    const isCreditor = b.netBalance > 0.01;
                    const isDebtor = b.netBalance < -0.01;
                    return (
                      <tr key={b.memberId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                        <td className="p-3 font-bold text-neutral-900 dark:text-neutral-100">{b.memberName}</td>
                        <td className="p-3 text-right font-mono text-neutral-700 dark:text-neutral-300">
                          {formatCurrency(b.totalPaid, group.currency)}
                        </td>
                        <td className="p-3 text-right font-mono text-neutral-700 dark:text-neutral-300">
                          {formatCurrency(b.totalShare, group.currency)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold">
                          {isCreditor ? (
                            <span className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(b.netBalance, group.currency)}</span>
                          ) : isDebtor ? (
                            <span className="text-red-600 dark:text-red-400">
                              -{formatCurrency(Math.abs(b.netBalance), group.currency)}
                            </span>
                          ) : (
                            <span className="text-neutral-400 dark:text-neutral-500">{formatCurrency(0, group.currency)}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Settlement Route */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                {t.optimalRouteTitle}
              </h4>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {settlements.filter((tx) => tx.isPaid).length} / {settlements.length} {t.completedCountLabel}
              </span>
            </div>

            {settlements.length === 0 ? (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                {t.allSettledDesc}
              </p>
            ) : (
              <div className="space-y-2">
                {settlements.map((tx, idx) => {
                  const fromM = group.members.find((m) => m.id === tx.fromMemberId);
                  const toM = group.members.find((m) => m.id === tx.toMemberId);
                  return (
                    <div
                      key={tx.id}
                      className="p-3 bg-neutral-50 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">{fromM?.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">{toM?.name}</span>
                        {toM?.paymentDetails && (
                          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono hidden sm:inline">
                            ({toM.paymentDetails})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                          {formatCurrency(tx.amount, group.currency)}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            tx.isPaid
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {tx.isPaid ? t.markedAsPaid : t.pendingStatus}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between no-print">
          <button
            onClick={handleCopySummary}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? t.copiedReportToast : t.copyForChatBtn}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white rounded-lg transition-colors"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
