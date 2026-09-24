import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Sparkles,
  CreditCard,
  FileText,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import {
  Group,
  Member,
  MemberBalance,
  SettlementTransaction,
  SettlementMode,
} from '../types';
import { formatCurrency } from '../utils/currency';
import { Language, TRANSLATIONS } from '../utils/i18n';

interface SettlementViewProps {
  group: Group;
  members: Member[];
  balances: MemberBalance[];
  settlements: SettlementTransaction[];
  mode: SettlementMode;
  lang: Language;
  onModeChange: (newMode: SettlementMode) => void;
  onTogglePaid: (transactionId: string, fromId: string, toId: string) => void;
  onOpenMemberReport: (memberId: string) => void;
  onOpenGroupReport: () => void;
}

export const SettlementView: React.FC<SettlementViewProps> = ({
  group,
  members,
  balances,
  settlements,
  mode,
  lang,
  onModeChange,
  onTogglePaid,
  onOpenMemberReport,
  onOpenGroupReport,
}) => {
  const t = TRANSLATIONS[lang];
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  const getMember = (id: string) => members.find((m) => m.id === id);

  const debtors = balances.filter((b) => b.netBalance < -0.01);

  const paidCount = settlements.filter((tx) => tx.isPaid).length;

  const handleCopyPaymentInfo = (tx: SettlementTransaction) => {
    const toMem = getMember(tx.toMemberId);
    if (!toMem?.paymentDetails) return;
    navigator.clipboard.writeText(toMem.paymentDetails);
    setCopiedTxId(tx.id);
    setTimeout(() => setCopiedTxId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: 1-Transfer Guarantee Highlight */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {t.optimalPlanBadge}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                · {t.transfersPerDebtor}: {t.max1Transfer}
              </span>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {t.optimalPlanTitle}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-xl">
              {t.optimalPlanDesc}
            </p>
          </div>

          {/* Strategy Mode Toggle & Report */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs">
              <button
                onClick={() => onModeChange('direct_optimized')}
                className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === 'direct_optimized'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {t.directMatching}
              </button>
              <button
                onClick={() => onModeChange('hub_collector')}
                className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === 'hub_collector'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {t.hubCollector}
              </button>
            </div>

            <button
              onClick={onOpenGroupReport}
              className="px-3 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 border border-neutral-300 dark:border-neutral-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>{t.summaryReportBtn}</span>
            </button>
          </div>
        </div>

        {/* Quick status metrics */}
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2.5 rounded-xl">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">{t.totalTransfers}</span>
            <span className="text-base font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {settlements.length}
            </span>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2.5 rounded-xl">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">{t.debtorsSettling}</span>
            <span className="text-base font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {debtors.length}
            </span>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2.5 rounded-xl">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">{t.transfersPerDebtor}</span>
            <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {t.max1Transfer}
            </span>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2.5 rounded-xl">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">{t.settledStatus}</span>
            <span className="text-base font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {paidCount} / {settlements.length}
            </span>
          </div>
        </div>
      </div>

      {/* Settlement Action Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            {t.paymentTransfers} ({settlements.length})
          </h4>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {lang === 'vi' ? 'Đánh dấu khi đã chuyển tiền xong' : 'Check off transfers as members send money'}
          </span>
        </div>

        {settlements.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              {t.allSettledTitle}
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t.allSettledDesc}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {settlements.map((tx) => {
              const fromMem = getMember(tx.fromMemberId);
              const toMem = getMember(tx.toMemberId);
              const isPaid = !!tx.isPaid;
              const hasPaymentInfo = !!toMem?.paymentDetails;

              return (
                <div
                  key={tx.id}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    isPaid
                      ? 'bg-neutral-50/80 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 opacity-75'
                      : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    {/* From Member */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full ${fromMem?.avatarColor || 'bg-neutral-500'} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                      >
                        {fromMem?.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                          {fromMem?.name}
                        </div>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                          {lang === 'vi' ? 'Người chuyển' : 'Sender'}
                        </span>
                      </div>
                    </div>

                    {/* Amount & Arrow */}
                    <div className="flex flex-col items-center px-2">
                      <span className="text-sm font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(tx.amount, group.currency)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    </div>

                    {/* To Member */}
                    <div className="flex items-center gap-2 min-w-0 text-right">
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                          {toMem?.name}
                        </div>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                          {lang === 'vi' ? 'Người nhận' : 'Recipient'}
                        </span>
                      </div>
                      <div
                        className={`w-8 h-8 rounded-full ${toMem?.avatarColor || 'bg-neutral-500'} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                      >
                        {toMem?.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="pt-2.5 pb-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                    <div className="truncate mr-2">
                      {hasPaymentInfo ? (
                        <div className="flex items-center gap-1 text-[11px] text-neutral-600 dark:text-neutral-300 truncate">
                          <CreditCard className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
                          <span className="truncate">{toMem.paymentDetails}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-neutral-400 dark:text-neutral-500 italic">
                          {lang === 'vi' ? 'Chưa lưu STK nhận tiền' : 'No payment handle saved'}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/60 shrink-0">
                      {lang === 'vi' ? 'Chuyển 1 lần' : '1-Transfer'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      onClick={() => onTogglePaid(tx.id, tx.fromMemberId, tx.toMemberId)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors ${
                        isPaid
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{t.markedAsPaid}</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                          <span>{t.markAsPaid}</span>
                        </>
                      )}
                    </button>

                    {hasPaymentInfo && (
                      <button
                        onClick={() => handleCopyPaymentInfo(tx)}
                        className="px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center gap-1 transition-colors"
                        title={t.copyPayInfo}
                      >
                        {copiedTxId === tx.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedTxId === tx.id ? t.copiedPayInfo : t.copyPayInfo}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Net Balances Table: Who is positive, who is negative */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {t.memberBalanceTitle}
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t.memberBalanceSub}
            </p>
          </div>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {balances.map((b) => {
            const member = getMember(b.memberId);
            const isCreditor = b.netBalance > 0.01;
            const isDebtor = b.netBalance < -0.01;
            const isCollector = group.collectorId === b.memberId;

            return (
              <div
                key={b.memberId}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/60 dark:hover:bg-neutral-850/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full ${member?.avatarColor || 'bg-neutral-500'} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                  >
                    {b.memberName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        {b.memberName}
                      </span>
                      {isCollector && (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 inline-flex items-center gap-0.5 font-bold">
                          <ShieldCheck className="w-3 h-3" />
                          {t.collectorBadge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      <span>
                        {t.paidOutOfPocket} <strong className="font-mono text-neutral-800 dark:text-neutral-200">{formatCurrency(b.totalPaid, group.currency)}</strong>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {t.consumedShare} <strong className="font-mono text-neutral-800 dark:text-neutral-200">{formatCurrency(b.totalShare, group.currency)}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800">
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block">{t.netBalance}</span>
                    <span
                      className={`text-sm font-mono font-bold ${
                        isCreditor
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isDebtor
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {isCreditor
                        ? `+${formatCurrency(b.netBalance, group.currency)}`
                        : isDebtor
                        ? `-${formatCurrency(Math.abs(b.netBalance), group.currency)}`
                        : t.settledZero}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenMemberReport(b.memberId)}
                    className="px-3 py-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-750 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                    <span>{t.personalReportBtn}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
