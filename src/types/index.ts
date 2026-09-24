export type SplitType = 'equal' | 'exact' | 'shares';

export interface Member {
  id: string;
  name: string;
  avatarColor: string;
  paymentDetails?: string; // Venmo, PayPal, Zelle, Bank account or phone number
}

export interface PayerShare {
  memberId: string;
  amount: number;
}

export interface BeneficiaryShare {
  memberId: string;
  amount: number;       // Final calculated amount owed for this expense
  customValue?: number; // Exact amount or share count if not equal split
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  payerId: string; // Primary payer if single
  isMultiplePayers: boolean;
  multiplePayers?: PayerShare[]; // If multiple people split the payment
  splitType: SplitType;
  selectedMemberIds: string[]; // Member IDs included in this expense (e.g. [A, B, C] or [A, B] or [B, C])
  beneficiaries: BeneficiaryShare[]; // Calculated breakdown per member
  note?: string;
}

export interface SettlementTransaction {
  id: string;
  fromMemberId: string; // Debtor
  toMemberId: string;   // Creditor
  amount: number;
  isPaid?: boolean;
}

export interface MemberBalance {
  memberId: string;
  memberName: string;
  totalPaid: number;       // Out of pocket
  totalShare: number;      // Consumed share of expenses
  netBalance: number;      // totalPaid - totalShare (> 0: to receive, < 0: to pay)
}

export type SettlementMode = 'direct_optimized' | 'hub_collector';

export interface Group {
  id: string;
  name: string;
  currency: string; // e.g. '$', '€', '£', '₫'
  createdAt: string;
  collectorId?: string; // Optional designated collector
  members: Member[];
  expenses: Expense[];
  settlementsPaid: Record<string, boolean>; // key: `${fromId}->${toId}`
}
