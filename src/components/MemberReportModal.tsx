import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Printer,
  ArrowUpRight,
  ArrowDownLeft,
  Share2,
} from 'lucide-react';
import { Group, MemberBalance, SettlementTransaction } from '../types';
import { formatCurrency } from '../utils/currency';
import { generateMemberReportText } from '../utils/exportUtils';
import { Language, TRANSLATIONS } from '../utils/i18n';

interface MemberReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string | null;
  group: Group;
  balances: MemberBalance[];
  settlements: SettlementTransaction[];
  lang: Language;
}

export const MemberReportModal: React.FC<MemberReportModalProps> = ({
  isOpen,
  onClose,
  memberId,
  group,
  balances,
  settlements,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const [copied, setCopied] = useState(false);

  if (!isOpen || !memberId) return null;

  const member = group.members.find((m) => m.id === memberId);
  const balance = balances.find((b) => b.memberId === memberId);

  if (!member || !balance) return null;

  // 1. Expenses paid by this member
  const paidExpenses = group.expenses
    .filter((e) => {
      if (e.isMultiplePayers && e.multiplePayers) {
        return e.multiplePayers.some((p) => p.memberId === memberId && p.amount > 0);
      }
      return e.payerId === memberId;
    })
    .map((e) => {
      let paidAmt = e.amount;
      if (e.isMultiplePayers && e.multiplePayers) {
        paidAmt = e.multiplePayers.find((p) => p.memberId === memberId)?.amount || 0;
      }
      return { expense: e, paidAmt };
    });

  // 2. Expenses consumed by this member
  const consumedExpenses = group.expenses
    .filter((e) => e.beneficiaries.some((b) => b.memberId === memberId && b.amount > 0))
    .map((e) => {
      const bObj = e.beneficiaries.find((b) => b.memberId === memberId);
      return { expense: e, shareAmt: bObj?.amount || 0 };
    });

  // 3. Transactions where this member owes someone
  const paymentsOwed = settlements.filter((tx) => tx.fromMemberId === memberId);

  // 4. Transactions where someone owes this member
  const paymentsReceiving = settlements.filter((tx) => tx.toMemberId === memberId);

  const handleCopy = () => {
    const text = generateMemberReportText(group, memberId, balances, settlements, lang);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPositive = balance.netBalance > 0.01;
  const isNegative = balance.netBalance < -0.01;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full ${member.avatarColor} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}
            >
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-base">
                {t.individualReportTitle}: {member.name}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{group.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-1.5"
              title={t.copyPersonalMsgBtn}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t.copiedPersonalMsgToast : t.copyPersonalMsgBtn}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Print report"
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

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Net summary card */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isPositive
                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
                : isNegative
                ? 'bg-red-50/70 dark:bg-red-950/40 border-red-200 dark:border-red-800/60'
                : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <div>
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{t.netStatusLabel}</span>
              <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                {isPositive ? (
                  <span className="text-emerald-700 dark:text-emerald-300">
                    🟢 {t.youReceive} +{formatCurrency(balance.netBalance, group.currency)}
                  </span>
                ) : isNegative ? (
                  <span className="text-red-700 dark:text-red-400">
                    🔴 {t.youOwe} -{formatCurrency(Math.abs(balance.netBalance), group.currency)}
                  </span>
                ) : (
                  <span className="text-neutral-700 dark:text-neutral-300">⚪ {t.settledZero}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block font-sans">{t.paidOutOfPocket}</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">{formatCurrency(balance.totalPaid, group.currency)}</span>
              </div>
              <div className="text-neutral-300 dark:text-neutral-600 font-sans">/</div>
              <div>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block font-sans">{t.consumedShare}</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">{formatCurrency(balance.totalShare, group.currency)}</span>
              </div>
            </div>
          </div>

          {/* Actionable Settlement Instructions (1-Transfer guarantee) */}
          {paymentsOwed.length > 0 && (
            <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  {t.singleTransferInstruction}
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-400">
                  {t.max1Transfer}
                </span>
              </div>

              <div className="space-y-2">
                {paymentsOwed.map((tx) => {
                  const targetCreditor = group.members.find((m) => m.id === tx.toMemberId);
                  return (
                    <div
                      key={tx.id}
                      className="p-3 bg-white dark:bg-neutral-850 rounded-lg border border-amber-200 dark:border-amber-800/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-neutral-100">
                          {t.payToLabel} {targetCreditor?.name}
                        </div>
                        {targetCreditor?.paymentDetails ? (
                          <div className="text-[11px] text-neutral-600 dark:text-neutral-300 font-mono mt-0.5">
                            {targetCreditor.paymentDetails}
                          </div>
                        ) : (
                          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 italic mt-0.5">
                            {lang === 'vi' ? 'Tiền mặt hoặc chuyển khoản trực tiếp' : 'Cash or direct transfer'}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100 block">
                          {formatCurrency(tx.amount, group.currency)}
                        </span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                          {tx.isPaid ? `✅ ${t.markedAsPaid}` : '⏳ Pending'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {paymentsReceiving.length > 0 && (
            <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2.5">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide flex items-center gap-1">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {t.paymentsDueToReceive}
              </span>

              <div className="space-y-2">
                {paymentsReceiving.map((tx) => {
                  const debtor = group.members.find((m) => m.id === tx.fromMemberId);
                  return (
                    <div
                      key={tx.id}
                      className="p-3 bg-white dark:bg-neutral-850 rounded-lg border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="font-bold text-neutral-900 dark:text-neutral-100">
                        {t.fromLabel} {debtor?.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300">
                          +{formatCurrency(tx.amount, group.currency)}
                        </span>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                          {tx.isPaid ? `✅ ${t.markedAsPaid}` : '⏳ Pending'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 1: All expenses this member paid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                {t.expensesPaidSection} ({paidExpenses.length})
              </h4>
              <span className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">
                {formatCurrency(balance.totalPaid, group.currency)}
              </span>
            </div>

            {paidExpenses.length === 0 ? (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 italic p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                {lang === 'vi' ? 'Bạn chưa thanh toán khoản chi nào trong chuyến đi này.' : 'You have not paid upfront for any expenses in this group.'}
              </p>
            ) : (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                {paidExpenses.map(({ expense, paidAmt }) => {
                  const isFull = expense.selectedMemberIds.length === group.members.length;
                  return (
                    <div key={expense.id} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">{expense.description}</span>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {expense.date} · {lang === 'vi' ? 'Tổng bill' : 'Total bill'} {formatCurrency(expense.amount, group.currency)} ·{' '}
                          <span className={isFull ? 'text-neutral-500 dark:text-neutral-400' : 'text-emerald-700 dark:text-emerald-400 font-semibold'}>
                            {isFull ? t.allGroupBadge : `${t.subgroupBadge} (${expense.selectedMemberIds.length})`}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(paidAmt, group.currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: All expenses this member consumed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                {t.expensesConsumedSection} ({consumedExpenses.length})
              </h4>
              <span className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">
                {formatCurrency(balance.totalShare, group.currency)}
              </span>
            </div>

            {consumedExpenses.length === 0 ? (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 italic p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                {lang === 'vi' ? 'Bạn không tham gia chia khoản tiền nào.' : 'You were not included in any expenses.'}
              </p>
            ) : (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                {consumedExpenses.map(({ expense, shareAmt }) => {
                  const payer = group.members.find((m) => m.id === expense.payerId);
                  const isFull = expense.selectedMemberIds.length === group.members.length;
                  return (
                    <div key={expense.id} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">{expense.description}</span>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {t.paidBy} {payer?.name || 'Group'} · {formatCurrency(expense.amount, group.currency)} ·{' '}
                          <span className={isFull ? 'text-neutral-500 dark:text-neutral-400' : 'text-emerald-700 dark:text-emerald-400 font-semibold'}>
                            {isFull ? t.allGroupBadge : `${t.subgroupBadge} (${expense.selectedMemberIds.length})`}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(shareAmt, group.currency)}
                      </span>
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
            onClick={handleCopy}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? t.copiedPersonalMsgToast : t.copyPersonalMsgBtn}</span>
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
