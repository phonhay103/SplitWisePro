import { Member, Expense, MemberBalance, SettlementTransaction, SettlementMode, SplitType, BeneficiaryShare } from '../types';

/**
 * Calculates net balance for every member:
 * totalPaid - totalShare = netBalance
 * > 0: Creditor (receives money)
 * < 0: Debtor (owes money)
 */
export function calculateMemberBalances(members: Member[], expenses: Expense[]): MemberBalance[] {
  const map = new Map<string, { name: string; paid: number; share: number }>();

  members.forEach((m) => {
    map.set(m.id, { name: m.name, paid: 0, share: 0 });
  });

  expenses.forEach((expense) => {
    // 1. Credit payers
    if (expense.isMultiplePayers && expense.multiplePayers && expense.multiplePayers.length > 0) {
      expense.multiplePayers.forEach((p) => {
        const entry = map.get(p.memberId);
        if (entry) entry.paid += p.amount;
      });
    } else if (expense.payerId) {
      const entry = map.get(expense.payerId);
      if (entry) entry.paid += expense.amount;
    }

    // 2. Debit beneficiaries
    expense.beneficiaries.forEach((b) => {
      const entry = map.get(b.memberId);
      if (entry) entry.share += b.amount;
    });
  });

  const balances: MemberBalance[] = [];
  map.forEach((data, memberId) => {
    const totalPaid = Math.round(data.paid * 100) / 100;
    const totalShare = Math.round(data.share * 100) / 100;
    const netBalance = Math.round((totalPaid - totalShare) * 100) / 100;

    balances.push({
      memberId,
      memberName: data.name,
      totalPaid,
      totalShare,
      netBalance,
    });
  });

  return balances;
}

/**
 * Computes optimal settlements prioritizing 1-transfer per debtor.
 */
export function computeOptimizedSettlements(
  balances: MemberBalance[],
  mode: SettlementMode = 'direct_optimized',
  collectorId?: string,
  paidStatusMap: Record<string, boolean> = {}
): {
  transactions: SettlementTransaction[];
  debtorTransferCounts: Record<string, number>;
  maxTransfersPerDebtor: number;
} {
  const EPSILON = 0.01;
  const debtors: { memberId: string; name: string; amount: number }[] = [];
  const creditors: { memberId: string; name: string; amount: number }[] = [];

  balances.forEach((b) => {
    if (b.netBalance < -EPSILON) {
      debtors.push({ memberId: b.memberId, name: b.memberName, amount: Math.abs(b.netBalance) });
    } else if (b.netBalance > EPSILON) {
      creditors.push({ memberId: b.memberId, name: b.memberName, amount: b.netBalance });
    }
  });

  const transactions: SettlementTransaction[] = [];
  let txIdx = 0;

  if (mode === 'hub_collector') {
    // Hub / Collector strategy:
    // Every debtor pays the designated collector once. Collector pays other creditors.
    let hubId = collectorId;
    if (!hubId || !balances.some((b) => b.memberId === hubId)) {
      // Default to highest creditor or first member
      const sortedCreditors = [...creditors].sort((a, b) => b.amount - a.amount);
      hubId = sortedCreditors[0]?.memberId || balances[0]?.memberId;
    }

    if (hubId) {
      debtors.forEach((d) => {
        if (d.memberId !== hubId && d.amount > EPSILON) {
          const key = `${d.memberId}->${hubId}`;
          transactions.push({
            id: `tx-${++txIdx}`,
            fromMemberId: d.memberId,
            toMemberId: hubId!,
            amount: Math.round(d.amount * 100) / 100,
            isPaid: paidStatusMap[key] || false,
          });
        }
      });

      creditors.forEach((c) => {
        if (c.memberId !== hubId && c.amount > EPSILON) {
          const key = `${hubId}->${c.memberId}`;
          transactions.push({
            id: `tx-${++txIdx}`,
            fromMemberId: hubId!,
            toMemberId: c.memberId,
            amount: Math.round(c.amount * 100) / 100,
            isPaid: paidStatusMap[key] || false,
          });
        }
      });
    }
  } else {
    // Direct Matching algorithm prioritizing EXACTLY 1 transfer per debtor
    const curDebtors = debtors.map((d) => ({ ...d }));
    const curCreditors = creditors.map((c) => ({ ...c }));

    // 1. Exact match check (debtor amount === creditor amount)
    for (let i = 0; i < curDebtors.length; i++) {
      if (curDebtors[i].amount <= EPSILON) continue;
      const exactMatch = curCreditors.find(
        (c) => Math.abs(c.amount - curDebtors[i].amount) < EPSILON
      );
      if (exactMatch) {
        const key = `${curDebtors[i].memberId}->${exactMatch.memberId}`;
        transactions.push({
          id: `tx-${++txIdx}`,
          fromMemberId: curDebtors[i].memberId,
          toMemberId: exactMatch.memberId,
          amount: Math.round(curDebtors[i].amount * 100) / 100,
          isPaid: paidStatusMap[key] || false,
        });
        exactMatch.amount = 0;
        curDebtors[i].amount = 0;
      }
    }

    // 2. Best-fit: For remaining debtors (smallest to largest), find a creditor with credit >= debtor debt
    const remainingDebtors = curDebtors.filter((d) => d.amount > EPSILON).sort((a, b) => a.amount - b.amount);

    remainingDebtors.forEach((d) => {
      if (d.amount <= EPSILON) return;

      const candidates = curCreditors
        .filter((c) => c.amount >= d.amount - EPSILON)
        .sort((a, b) => a.amount - b.amount);

      if (candidates.length > 0) {
        const targetCreditor = candidates[0];
        const payAmount = d.amount;
        const key = `${d.memberId}->${targetCreditor.memberId}`;

        transactions.push({
          id: `tx-${++txIdx}`,
          fromMemberId: d.memberId,
          toMemberId: targetCreditor.memberId,
          amount: Math.round(payAmount * 100) / 100,
          isPaid: paidStatusMap[key] || false,
        });

        targetCreditor.amount -= payAmount;
        d.amount = 0;
      }
    });

    // 3. Greedy remainder match for any debts exceeding individual creditor balances
    const stillDebtors = remainingDebtors.filter((d) => d.amount > EPSILON);
    stillDebtors.forEach((d) => {
      while (d.amount > EPSILON) {
        const largestCreditor = curCreditors
          .filter((c) => c.amount > EPSILON)
          .sort((a, b) => b.amount - a.amount)[0];

        if (!largestCreditor) break;

        const settleAmount = Math.min(d.amount, largestCreditor.amount);
        if (settleAmount <= EPSILON) break;

        const key = `${d.memberId}->${largestCreditor.memberId}`;
        transactions.push({
          id: `tx-${++txIdx}`,
          fromMemberId: d.memberId,
          toMemberId: largestCreditor.memberId,
          amount: Math.round(settleAmount * 100) / 100,
          isPaid: paidStatusMap[key] || false,
        });

        d.amount -= settleAmount;
        largestCreditor.amount -= settleAmount;
      }
    });
  }

  // Count transfers per debtor
  const debtorTransferCounts: Record<string, number> = {};
  debtors.forEach((d) => {
    debtorTransferCounts[d.memberId] = 0;
  });

  transactions.forEach((tx) => {
    debtorTransferCounts[tx.fromMemberId] = (debtorTransferCounts[tx.fromMemberId] || 0) + 1;
  });

  const maxTransfers = Math.max(0, ...Object.values(debtorTransferCounts));

  return {
    transactions,
    debtorTransferCounts,
    maxTransfersPerDebtor: maxTransfers,
  };
}

/**
 * Calculates breakdown for a specific expense given selected member IDs and split mode.
 */
export function calculateSplitShares(
  totalAmount: number,
  splitType: SplitType,
  selectedMemberIds: string[],
  customValues: Record<string, number>
): BeneficiaryShare[] {
  if (selectedMemberIds.length === 0 || totalAmount <= 0) return [];

  if (splitType === 'equal') {
    const count = selectedMemberIds.length;
    const baseShare = Math.floor((totalAmount / count) * 100) / 100;
    const distributed = baseShare * count;
    const remainder = Math.round((totalAmount - distributed) * 100) / 100;

    return selectedMemberIds.map((id, index) => {
      // Add remainder pennies to the first member(s) to guarantee exact total
      const extra = index < Math.round(remainder * 100) ? 0.01 : 0;
      return {
        memberId: id,
        amount: Math.round((baseShare + extra) * 100) / 100,
      };
    });
  }

  if (splitType === 'shares') {
    let totalShares = 0;
    selectedMemberIds.forEach((id) => {
      totalShares += customValues[id] ?? 1;
    });

    if (totalShares <= 0) totalShares = 1;

    let distributed = 0;
    return selectedMemberIds.map((id, index) => {
      const shares = customValues[id] ?? 1;
      let shareAmount = 0;
      if (index === selectedMemberIds.length - 1) {
        shareAmount = Math.round((totalAmount - distributed) * 100) / 100;
      } else {
        shareAmount = Math.round(((totalAmount * shares) / totalShares) * 100) / 100;
        distributed += shareAmount;
      }
      return {
        memberId: id,
        amount: shareAmount,
        customValue: shares,
      };
    });
  }

  if (splitType === 'exact') {
    return selectedMemberIds.map((id) => ({
      memberId: id,
      amount: customValues[id] || 0,
      customValue: customValues[id] || 0,
    }));
  }

  return [];
}
