import { Group } from '../types';

export const SAMPLE_GROUP: Group = {
  id: 'group-weekend-getaway',
  name: 'Weekend Cabin Trip',
  currency: '$',
  createdAt: '2026-09-22',
  collectorId: 'mem-alex',
  members: [
    {
      id: 'mem-alex',
      name: 'Alex (A)',
      avatarColor: 'bg-emerald-500',
      paymentDetails: 'Venmo: @alex-split | Zelle: alex@example.com',
    },
    {
      id: 'mem-ben',
      name: 'Ben (B)',
      avatarColor: 'bg-blue-500',
      paymentDetails: 'Venmo: @ben-b | PayPal: ben@example.com',
    },
    {
      id: 'mem-chloe',
      name: 'Chloe (C)',
      avatarColor: 'bg-rose-500',
      paymentDetails: 'Venmo: @chloec | CashApp: $chloec',
    },
    {
      id: 'mem-david',
      name: 'David (D)',
      avatarColor: 'bg-amber-500',
      paymentDetails: 'Venmo: @david-d | Zelle: david@example.com',
    },
  ],
  expenses: [
    {
      id: 'exp-1',
      description: 'Dinner at Italian Bistro',
      amount: 120,
      date: '2026-09-22',
      payerId: 'mem-alex', // Alex paid for [Alex, Ben, Chloe]
      isMultiplePayers: false,
      splitType: 'equal',
      selectedMemberIds: ['mem-alex', 'mem-ben', 'mem-chloe'], // A, B, C
      beneficiaries: [
        { memberId: 'mem-alex', amount: 40 },
        { memberId: 'mem-ben', amount: 40 },
        { memberId: 'mem-chloe', amount: 40 },
      ],
      note: 'Alex paid for A, B, C (David arrived late)',
    },
    {
      id: 'exp-2',
      description: 'Airport Taxi',
      amount: 40,
      date: '2026-09-22',
      payerId: 'mem-alex', // Alex paid for [Alex, Ben]
      isMultiplePayers: false,
      splitType: 'equal',
      selectedMemberIds: ['mem-alex', 'mem-ben'], // A, B
      beneficiaries: [
        { memberId: 'mem-alex', amount: 20 },
        { memberId: 'mem-ben', amount: 20 },
      ],
      note: 'Alex paid for A & B shared ride',
    },
    {
      id: 'exp-3',
      description: 'Movie & Snacks',
      amount: 50,
      date: '2026-09-23',
      payerId: 'mem-ben', // Ben paid for [Ben, Chloe]
      isMultiplePayers: false,
      splitType: 'equal',
      selectedMemberIds: ['mem-ben', 'mem-chloe'], // B, C
      beneficiaries: [
        { memberId: 'mem-ben', amount: 25 },
        { memberId: 'mem-chloe', amount: 25 },
      ],
      note: 'Ben paid for B & C',
    },
    {
      id: 'exp-4',
      description: 'Whole Group Cabin Rental',
      amount: 400,
      date: '2026-09-23',
      payerId: 'mem-alex', // Co-paid by Alex ($250) and Ben ($150) for ALL members
      isMultiplePayers: true,
      multiplePayers: [
        { memberId: 'mem-alex', amount: 250 },
        { memberId: 'mem-ben', amount: 150 },
      ],
      splitType: 'equal',
      selectedMemberIds: ['mem-alex', 'mem-ben', 'mem-chloe', 'mem-david'], // Entire group
      beneficiaries: [
        { memberId: 'mem-alex', amount: 100 },
        { memberId: 'mem-ben', amount: 100 },
        { memberId: 'mem-chloe', amount: 100 },
        { memberId: 'mem-david', amount: 100 },
      ],
      note: 'Whole group shared cost. Alex & Ben co-paid upfront.',
    },
    {
      id: 'exp-5',
      description: 'Morning Coffee & Bakery',
      amount: 24,
      date: '2026-09-24',
      payerId: 'mem-chloe', // Chloe paid for [Chloe, David]
      isMultiplePayers: false,
      splitType: 'equal',
      selectedMemberIds: ['mem-chloe', 'mem-david'], // C, D
      beneficiaries: [
        { memberId: 'mem-chloe', amount: 12 },
        { memberId: 'mem-david', amount: 12 },
      ],
      note: 'Chloe bought coffee for C & D',
    },
    {
      id: 'exp-6',
      description: 'Kayak Rental',
      amount: 60,
      date: '2026-09-24',
      payerId: 'mem-david', // David paid for [Alex, Chloe, David]
      isMultiplePayers: false,
      splitType: 'equal',
      selectedMemberIds: ['mem-alex', 'mem-chloe', 'mem-david'], // A, C, D
      beneficiaries: [
        { memberId: 'mem-alex', amount: 20 },
        { memberId: 'mem-chloe', amount: 20 },
        { memberId: 'mem-david', amount: 20 },
      ],
      note: 'David paid for A, C, D (Ben stayed at the cabin)',
    },
  ],
  settlementsPaid: {},
};
