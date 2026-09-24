import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Edit3, Trash2, Plus, Receipt } from 'lucide-react';
import { Expense, Member } from '../types';
import { formatCurrency } from '../utils/currency';
import { Language, TRANSLATIONS } from '../utils/i18n';

interface ExpenseListProps {
  expenses: Expense[];
  members: Member[];
  currency: string;
  lang: Language;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  members,
  currency,
  lang,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}) => {
  const t = TRANSLATIONS[lang];
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'subgroup' | 'full'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = expenses.filter((e) => {
    const isFull = e.selectedMemberIds.length === members.length;
    if (filterType === 'subgroup' && isFull) return false;
    if (filterType === 'full' && !isFull) return false;

    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const matchesDesc = e.description.toLowerCase().includes(term);
    const matchesNote = e.note ? e.note.toLowerCase().includes(term) : false;
    const matchesMember = e.selectedMemberIds.some((id) =>
      members.find((m) => m.id === id)?.name.toLowerCase().includes(term)
    );
    const matchesPayer = members.find((m) => m.id === e.payerId)?.name.toLowerCase().includes(term);

    return matchesDesc || matchesNote || matchesMember || matchesPayer;
  });

  const getPayerDisplay = (e: Expense) => {
    if (e.isMultiplePayers && e.multiplePayers && e.multiplePayers.length > 0) {
      return (
        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
          {t.coPaidBy.replace('{n}', e.multiplePayers.length.toString())}
        </span>
      );
    }
    const payer = members.find((m) => m.id === e.payerId);
    return (
      <div className="flex items-center gap-1.5">
        <div
          className={`w-4 h-4 rounded-full ${payer?.avatarColor || 'bg-neutral-400'} text-white text-[9px] font-bold flex items-center justify-center shrink-0`}
        >
          {payer?.name.charAt(0).toUpperCase()}
        </div>
        <span className="font-bold text-neutral-800 dark:text-neutral-200">{payer?.name || 'Unknown'}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-400 focus:ring-1 focus:ring-emerald-600 dark:focus:bg-neutral-900 transition-colors"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            {t.allFilter} ({expenses.length})
          </button>
          <button
            onClick={() => setFilterType('subgroup')}
            className={`px-3 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
              filterType === 'subgroup'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            {t.subgroupFilter}
          </button>
          <button
            onClick={() => setFilterType('full')}
            className={`px-3 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
              filterType === 'full'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            {t.fullGroupFilter}
          </button>
        </div>

        {/* Add Expense Button */}
        <button
          onClick={onAddExpense}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.addExpenseBtn}</span>
        </button>
      </div>

      {/* Expense Cards List */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 mx-auto flex items-center justify-center mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-1">{t.noExpensesTitle}</h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 max-w-sm mx-auto">
            {t.noExpensesDesc}
          </p>
          <button
            onClick={onAddExpense}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addFirstExpense}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((expense) => {
            const isExpanded = expandedId === expense.id;
            const isAllGroup = expense.selectedMemberIds.length === members.length;
            const participantCount = expense.selectedMemberIds.length;

            return (
              <div
                key={expense.id}
                className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors shadow-2xs"
              >
                {/* Main Row */}
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Top: Description & Date */}
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {expense.description}
                      </h4>
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
                        {expense.date}
                      </span>
                    </div>

                    {/* Metadata line: Who paid -> Split with whom */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-neutral-400 dark:text-neutral-500 text-[11px]">{t.paidBy}</span>
                        {getPayerDisplay(expense)}
                      </div>

                      <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-600">➔</span>

                      {/* Split With Visual Chips */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-400 dark:text-neutral-500 text-[11px]">{t.splitWith}:</span>
                        <div className="flex items-center -space-x-1">
                          {expense.selectedMemberIds.map((id) => {
                            const m = members.find((mem) => mem.id === id);
                            return (
                              <div
                                key={id}
                                title={m?.name}
                                className={`w-5 h-5 rounded-full ${m?.avatarColor || 'bg-neutral-400'} text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-neutral-900`}
                              >
                                {m?.name.charAt(0).toUpperCase()}
                              </div>
                            );
                          })}
                        </div>

                        {/* Subgroup or All badge */}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isAllGroup
                              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                          }`}
                        >
                          {isAllGroup ? t.allGroupBadge : `${t.subgroupBadge} (${participantCount}/${members.length})`}
                        </span>
                      </div>

                      {expense.note && (
                        <>
                          <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-600">·</span>
                          <span className="text-neutral-400 dark:text-neutral-500 italic truncate max-w-[200px]">
                            {expense.note}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right side: Amount & Controls */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-neutral-900 dark:text-neutral-100 block">
                        {formatCurrency(expense.amount, currency)}
                      </span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                        ~{formatCurrency(expense.amount / participantCount, currency)} {t.perPerson}
                      </span>
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : expense.id)}
                      className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title={isExpanded ? 'Collapse' : 'View split breakdown'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => onEditExpense(expense)}
                      className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Edit expense"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        const confirmMsg = t.deleteExpenseConfirm.replace('{title}', expense.description);
                        if (confirm(confirmMsg)) {
                          onDeleteExpense(expense.id);
                        }
                      }}
                      className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed Breakdown */}
                {isExpanded && (
                  <div className="px-4 py-3 bg-neutral-50/80 dark:bg-neutral-850 border-t border-neutral-100 dark:border-neutral-800 space-y-3 text-xs">
                    {/* If multiple payers co-paid */}
                    {expense.isMultiplePayers && expense.multiplePayers && (
                      <div>
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                          {t.upfrontBreakdown}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {expense.multiplePayers.map((p) => {
                            const m = members.find((mem) => mem.id === p.memberId);
                            return (
                              <div
                                key={p.memberId}
                                className="px-2.5 py-1 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5 text-xs"
                              >
                                <span className="font-medium text-neutral-800 dark:text-neutral-200">{m?.name}:</span>
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(p.amount, currency)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Breakdown per beneficiary */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                          {t.individualShare}
                        </span>
                        <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                          {expense.splitType === 'equal'
                            ? t.equalSplitLabel
                            : expense.splitType === 'shares'
                            ? t.bySharesLabel
                            : t.exactAmountsLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {expense.beneficiaries.map((b) => {
                          const m = members.find((mem) => mem.id === b.memberId);
                          return (
                            <div
                              key={b.memberId}
                              className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div
                                  className={`w-5 h-5 rounded-full ${m?.avatarColor || 'bg-neutral-400'} text-white text-[10px] font-bold flex items-center justify-center shrink-0`}
                                >
                                  {m?.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                                  {m?.name}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 shrink-0">
                                {formatCurrency(b.amount, currency)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
