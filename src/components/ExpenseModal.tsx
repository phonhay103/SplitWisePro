import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Users, AlertCircle, Plus, ChevronDown, ChevronRight, UserCheck } from 'lucide-react';
import { Expense, Member, SplitType, PayerShare, BeneficiaryShare } from '../types';
import { formatCurrency, parseNumberInput } from '../utils/currency';
import { calculateSplitShares } from '../utils/debtSettlement';
import { Language, TRANSLATIONS } from '../utils/i18n';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  currency: string;
  lang: Language;
  lastPayerId?: string;
  onSaveExpense: (expense: Expense, payerIdUsed: string) => void;
  editingExpense?: Expense | null;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  members,
  currency,
  lang,
  lastPayerId,
  onSaveExpense,
  editingExpense,
}) => {
  const t = TRANSLATIONS[lang];

  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  // Payer state - initialize with lastPayerId if available
  const [isMultiplePayers, setIsMultiplePayers] = useState(false);
  const [primaryPayerId, setPrimaryPayerId] = useState(
    lastPayerId && members.some((m) => m.id === lastPayerId)
      ? lastPayerId
      : members[0]?.id || ''
  );
  const [multiplePayers, setMultiplePayers] = useState<Record<string, number>>({});

  // Subgroup vs Full Group Scope state
  // REQUIREMENT: By default it is for the entire group. Only if user chooses subgroup do we show the members picker.
  const [isSubgroupMode, setIsSubgroupMode] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(members.map((m) => m.id));
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [customValues, setCustomValues] = useState<Record<string, number>>({});

  const [errorMessage, setErrorMessage] = useState('');
  const descInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingExpense) {
      setDescription(editingExpense.description);
      setAmountStr(editingExpense.amount.toString());
      setDate(editingExpense.date);
      setNote(editingExpense.note || '');
      setIsMultiplePayers(editingExpense.isMultiplePayers);
      setPrimaryPayerId(editingExpense.payerId || members[0]?.id || '');

      const payersMap: Record<string, number> = {};
      editingExpense.multiplePayers?.forEach((p) => {
        payersMap[p.memberId] = p.amount;
      });
      setMultiplePayers(payersMap);

      setSelectedMemberIds(editingExpense.selectedMemberIds);
      setSplitType(editingExpense.splitType);

      // Check if editing expense was full group or subgroup
      const isSub = editingExpense.selectedMemberIds.length !== members.length || editingExpense.splitType !== 'equal';
      setIsSubgroupMode(isSub);

      const customMap: Record<string, number> = {};
      editingExpense.beneficiaries.forEach((b) => {
        if (b.customValue !== undefined) customMap[b.memberId] = b.customValue;
      });
      setCustomValues(customMap);
    } else {
      setDescription('');
      setAmountStr('');
      setDate(new Date().toISOString().slice(0, 10));
      setNote('');
      setIsMultiplePayers(false);
      // Pre-select lastPayerId for continuous fast entry
      const defaultPayer = lastPayerId && members.some((m) => m.id === lastPayerId)
        ? lastPayerId
        : members[0]?.id || '';
      setPrimaryPayerId(defaultPayer);
      setMultiplePayers({});
      // By default: Entire group
      setIsSubgroupMode(false);
      setSelectedMemberIds(members.map((m) => m.id));
      setSplitType('equal');
      setCustomValues({});
    }
    setErrorMessage('');
  }, [editingExpense, isOpen, members, lastPayerId]);

  if (!isOpen) return null;

  const currentTotalAmount = parseNumberInput(amountStr);

  // If in full group mode, always split among all members
  const effectiveMemberIds = isSubgroupMode ? selectedMemberIds : members.map((m) => m.id);

  // Toggle member inclusion when in subgroup mode
  const handleToggleMember = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) {
      if (selectedMemberIds.length === 1) {
        setErrorMessage(lang === 'vi' ? 'Phải có ít nhất 1 người chia khoản chi!' : 'An expense must include at least 1 person!');
        return;
      }
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== memberId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, memberId]);
    }
    setErrorMessage('');
  };

  const handleSelectAll = () => {
    setSelectedMemberIds(members.map((m) => m.id));
    setErrorMessage('');
  };

  const handleSelectOnlyPayer = () => {
    if (isMultiplePayers) {
      const activePayers = Object.keys(multiplePayers).filter((id) => (multiplePayers[id] || 0) > 0);
      if (activePayers.length > 0) {
        setSelectedMemberIds(activePayers);
        setErrorMessage('');
        return;
      }
    }
    if (primaryPayerId) {
      setSelectedMemberIds([primaryPayerId]);
      setErrorMessage('');
    }
  };

  // Compute live breakdown
  const computedBeneficiaries = calculateSplitShares(
    currentTotalAmount,
    isSubgroupMode ? splitType : 'equal',
    effectiveMemberIds,
    customValues
  );

  // Multiple payers validation
  const sumMultiplePayers = Object.values(multiplePayers).reduce((sum, v) => sum + (v || 0), 0);
  const diffPayers = Math.round((currentTotalAmount - sumMultiplePayers) * 100) / 100;

  // Exact split validation
  const sumExactSplit = effectiveMemberIds.reduce((sum, id) => sum + (customValues[id] || 0), 0);
  const diffExactSplit = Math.round((currentTotalAmount - sumExactSplit) * 100) / 100;

  const handleSubmit = (e: React.FormEvent, keepOpen: boolean = false) => {
    e.preventDefault();

    if (members.length === 0) {
      setErrorMessage(t.noMembersWarning);
      return;
    }

    if (!description.trim()) {
      setErrorMessage(lang === 'vi' ? 'Vui lòng nhập tên khoản chi' : 'Please enter an expense description');
      return;
    }

    if (currentTotalAmount <= 0) {
      setErrorMessage(lang === 'vi' ? 'Vui lòng nhập số tiền hợp lệ' : 'Please enter a valid expense amount');
      return;
    }

    if (effectiveMemberIds.length === 0) {
      setErrorMessage(lang === 'vi' ? 'Khoản chi phải có ít nhất 1 người tham gia' : 'Please select at least 1 member');
      return;
    }

    let finalMultiplePayers: PayerShare[] | undefined = undefined;
    if (isMultiplePayers) {
      if (Math.abs(diffPayers) > 0.05) {
        setErrorMessage(
          `${t.totalContributed} (${formatCurrency(sumMultiplePayers, currency)}) != ${formatCurrency(currentTotalAmount, currency)}`
        );
        return;
      }
      finalMultiplePayers = Object.entries(multiplePayers)
        .filter(([_, amt]) => amt > 0)
        .map(([memberId, amount]) => ({ memberId, amount }));
    } else {
      if (!primaryPayerId) {
        setErrorMessage(lang === 'vi' ? 'Vui lòng chọn người thanh toán' : 'Please select who paid');
        return;
      }
    }

    if (isSubgroupMode && splitType === 'exact' && Math.abs(diffExactSplit) > 0.05) {
      setErrorMessage(
        lang === 'vi'
          ? `Tổng tiền chia lẻ (${formatCurrency(sumExactSplit, currency)}) chưa khớp với hóa đơn (${formatCurrency(currentTotalAmount, currency)}).`
          : `Sum of exact shares (${formatCurrency(sumExactSplit, currency)}) must equal the total bill.`
      );
      return;
    }

    const beneficiaries: BeneficiaryShare[] = computedBeneficiaries.map((b) => ({
      memberId: b.memberId,
      amount: b.amount,
      customValue: isSubgroupMode && splitType !== 'equal' ? customValues[b.memberId] : undefined,
    }));

    const expense: Expense = {
      id: editingExpense ? editingExpense.id : `exp-${Date.now()}`,
      description: description.trim(),
      amount: currentTotalAmount,
      date,
      payerId: primaryPayerId,
      isMultiplePayers,
      multiplePayers: finalMultiplePayers,
      splitType: isSubgroupMode ? splitType : 'equal',
      selectedMemberIds: effectiveMemberIds,
      beneficiaries,
      note: note.trim() || undefined,
    };

    onSaveExpense(expense, primaryPayerId);

    if (keepOpen) {
      // Clear description and amount, but keep the payer and date for continuous entry!
      setDescription('');
      setAmountStr('');
      setNote('');
      setErrorMessage('');
      setTimeout(() => {
        descInputRef.current?.focus();
      }, 50);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-base">
              {editingExpense ? t.editExpenseTitle : t.addExpenseTitle}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t.expenseModalSub}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMessage && (
            <div className="p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {members.length === 0 && (
            <div className="p-3 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
              {t.noMembersWarning}
            </div>
          )}

          {/* Description & Amount */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                {t.descriptionLabel} <span className="text-red-500">*</span>
              </label>
              <input
                ref={descInputRef}
                type="text"
                required
                placeholder={t.descriptionPlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 dark:focus:bg-neutral-800 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  {t.amountLabel} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-semibold text-neutral-400 dark:text-neutral-500">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-base font-mono font-bold text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 dark:focus:bg-neutral-800 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  {t.dateLabel}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 dark:focus:bg-neutral-800 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* STEP 1: WHO PAID? (Saves previous payer for continuous input) */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                {t.whoPaidTitle}
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = !isMultiplePayers;
                  setIsMultiplePayers(next);
                  if (next && primaryPayerId) {
                    setMultiplePayers({ [primaryPayerId]: currentTotalAmount });
                  }
                }}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium"
              >
                {isMultiplePayers ? t.singlePayerMode : t.multiPayerMode}
              </button>
            </div>

            {!isMultiplePayers ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {members.map((m) => {
                  const isSelected = primaryPayerId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPrimaryPayerId(m.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs text-left transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 font-bold text-neutral-900 dark:text-neutral-100 ring-1 ring-emerald-600'
                          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full ${m.avatarColor} text-white text-[11px] font-bold flex items-center justify-center shrink-0`}
                      >
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2 bg-white dark:bg-neutral-800 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{t.coPaidPrompt}</p>
                <div className="space-y-2">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-full ${m.avatarColor} text-white text-[10px] font-bold flex items-center justify-center shrink-0`}
                        >
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">{m.name}</span>
                      </div>
                      <div className="relative w-32">
                        <span className="absolute left-2 top-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                          {currency}
                        </span>
                        <input
                          type="number"
                          step="any"
                          placeholder="0.00"
                          value={multiplePayers[m.id] ?? ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setMultiplePayers({ ...multiplePayers, [m.id]: val });
                          }}
                          className="w-full pl-6 pr-2 py-1 font-mono text-xs text-right bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-700 text-xs font-medium">
                  <span>{t.totalContributed} {formatCurrency(sumMultiplePayers, currency)}</span>
                  {Math.abs(diffPayers) > 0.01 && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {t.remainingAmount} {formatCurrency(diffPayers, currency)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: WHO IS INCLUDED? 
              KEY REQUIREMENT: Default is entire group! Only if user wants subgroup do we show the members picker. */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                {t.splitScopeTitle}
              </span>

              {/* Segmented selector between Entire Group (Default) and Subgroup */}
              <div className="flex items-center p-0.5 bg-neutral-200/80 dark:bg-neutral-800 rounded-lg text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubgroupMode(false);
                    setSelectedMemberIds(members.map((m) => m.id));
                    setSplitType('equal');
                  }}
                  className={`px-3 py-1 font-semibold rounded-md transition-all ${
                    !isSubgroupMode
                      ? 'bg-white dark:bg-neutral-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  {t.splitFullGroupRadio}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSubgroupMode(true);
                  }}
                  className={`px-3 py-1 font-semibold rounded-md transition-all ${
                    isSubgroupMode
                      ? 'bg-white dark:bg-neutral-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  {t.splitSubgroupRadio}
                </button>
              </div>
            </div>

            {/* DEFAULT VIEW: Entire Group (clean, no clutter) */}
            {!isSubgroupMode ? (
              <div className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {t.splitFullGroupRadio}
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {t.splitFullGroupDesc.replace('{n}', members.length.toString())}
                    </div>
                  </div>
                </div>

                {currentTotalAmount > 0 && members.length > 0 && (
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 block">
                      {formatCurrency(currentTotalAmount / members.length, currency)}
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                      {t.perPerson}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* SUBGROUP VIEW: Only shown when user deliberately chooses subgroup */
              <div className="space-y-3 pt-1">
                {/* Presets and Split Mode */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="px-2 py-0.5 rounded bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 text-xs"
                    >
                      {t.allGroupPreset}
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectOnlyPayer}
                      className="px-2 py-0.5 rounded bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 text-xs"
                    >
                      {t.payerOnlyPreset}
                    </button>
                  </div>

                  {/* Mode tabs */}
                  <div className="flex items-center gap-1 p-0.5 bg-neutral-200/60 dark:bg-neutral-800 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setSplitType('equal')}
                      className={`px-2 py-0.5 font-medium rounded transition-colors ${
                        splitType === 'equal'
                          ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs font-bold'
                          : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {t.splitModeEqual}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitType('shares')}
                      className={`px-2 py-0.5 font-medium rounded transition-colors ${
                        splitType === 'shares'
                          ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs font-bold'
                          : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {t.splitModeShares}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitType('exact')}
                      className={`px-2 py-0.5 font-medium rounded transition-colors ${
                        splitType === 'exact'
                          ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs font-bold'
                          : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {t.splitModeExact}
                    </button>
                  </div>
                </div>

                {/* Member Checkbox List */}
                <div className="space-y-1.5 bg-white dark:bg-neutral-800 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  {members.map((m) => {
                    const isSelected = selectedMemberIds.includes(m.id);
                    const shareObj = computedBeneficiaries.find((b) => b.memberId === m.id);

                    return (
                      <div
                        key={m.id}
                        className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                          isSelected
                            ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800'
                            : 'border-transparent opacity-40 hover:opacity-70 bg-transparent'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleMember(m.id)}
                            className="w-4 h-4 text-emerald-600 rounded border-neutral-300 dark:border-neutral-600 focus:ring-emerald-500"
                          />
                          <div
                            className={`w-6 h-6 rounded-full ${m.avatarColor} text-white text-[11px] font-bold flex items-center justify-center shrink-0`}
                          >
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{m.name}</span>
                        </label>

                        {isSelected && (
                          <div className="flex items-center gap-2">
                            {splitType === 'shares' && (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0.5"
                                  step="0.5"
                                  value={customValues[m.id] ?? 1}
                                  onChange={(e) =>
                                    setCustomValues({
                                      ...customValues,
                                      [m.id]: parseFloat(e.target.value) || 1,
                                    })
                                  }
                                  className="w-12 px-1 py-0.5 text-xs text-center bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">phần</span>
                              </div>
                            )}

                            {splitType === 'exact' && (
                              <div className="relative w-24">
                                <span className="absolute left-1.5 top-0.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                                  {currency}
                                </span>
                                <input
                                  type="number"
                                  step="any"
                                  placeholder="0.00"
                                  value={customValues[m.id] ?? ''}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setCustomValues({
                                      ...customValues,
                                      [m.id]: val,
                                    });
                                  }}
                                  className="w-full pl-5 pr-1.5 py-0.5 font-mono text-xs text-right bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                            )}

                            <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 min-w-[65px] text-right">
                              {formatCurrency(shareObj?.amount || 0, currency)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                  <span>
                    <strong className="text-emerald-700 dark:text-emerald-400">
                      {selectedMemberIds.length} / {members.length} {lang === 'vi' ? 'người tham gia' : 'members selected'}
                    </strong>
                  </span>
                  {splitType === 'equal' && currentTotalAmount > 0 && selectedMemberIds.length > 0 && (
                    <span className="font-mono font-medium text-neutral-700 dark:text-neutral-300">
                      ~{formatCurrency(currentTotalAmount / selectedMemberIds.length, currency)} {t.perPerson}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              {t.optionalNoteLabel}
            </label>
            <input
              type="text"
              placeholder={t.notePlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 dark:focus:bg-neutral-800 transition-colors"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {t.totalLabel}{' '}
            <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 text-sm">
              {formatCurrency(currentTotalAmount, currency)}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              {t.cancelBtn}
            </button>
            {!editingExpense && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="px-3 sm:px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors whitespace-nowrap"
                title={lang === 'vi' ? 'Lưu khoản này và tiếp tục nhập khoản khác' : 'Save and enter another expense'}
              >
                {t.saveAndAddAnotherBtn}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              className="px-4 sm:px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs whitespace-nowrap"
            >
              {editingExpense ? t.saveChangesBtn : t.saveBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
