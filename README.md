# SplitWisePro — Group Expense Splitter & 1-Transfer Debt Settlement

Smart group expense splitter: supports multiple payers per expense, flexible
subgroup sharing, automatic settlement optimization so **each person transfers
at most once**, plus detailed summary reports you can paste straight into
group chats.

Live demo: https://splitwise-pro-plum.vercel.app

## Features

- **Multiple groups / trips** — create, rename, delete, backup/restore via JSON.
- **Flexible expenses** — single or multiple payers; split evenly, by custom
  amounts, or across any subgroup of members.
- **Optimized settlements** — debt-minimizing algorithm so each debtor makes
  at most 1 transfer; collector mode to gather everything to one person;
  per-transaction paid tracking.
- **Reports** — per-member breakdowns (paid / consumed / net balance) and
  group summary reports, with one-click copyable text for chat apps.
- **Offline-first** — installable PWA that works without network; data stored
  durably in IndexedDB with a localStorage warm cache.
- **Bilingual Vietnamese–English, dark/light mode**, multi-currency support.

## Tech stack

React 19 · Vite 8 · Tailwind CSS v4 · TypeScript · vite-plugin-pwa ·
idb-keyval · lucide-react · motion. No backend, no database — 100% static SPA.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # outputs to dist/
npm run preview  # preview the production build
npm run lint     # tsc --noEmit
```

Requires Node 20+.

## Deploy to Vercel

The repo is preconfigured (`vercel.json`, output `dist`) for 1-click deploys:

- **Via CLI:**
  ```bash
  npm i -g vercel
  vercel login
  vercel --prod
  ```
- **Via dashboard:** Import the repo → Framework `Vite` → Build Command
  `npm run build` → Output Directory `dist`. No env vars required.

## Project structure

```
src/
├── App.tsx                 # main state: groups, expenses, members, modals
├── components/             # Header, ExpenseList, ExpenseModal, SettlementView,
│                           # MemberManagerModal, GroupSelectorModal,
│                           # MemberReportModal, SummaryReportModal, ...
├── utils/
│   ├── debtSettlement.ts   # balance calculation + settlement optimization
│   ├── exportUtils.ts      # copyable summary/report text generation
│   ├── persistentStorage.ts# IndexedDB + localStorage persistence
│   ├── currency.ts         # currency formatting
│   └── i18n.ts             # Vietnamese/English strings
├── hooks/ types/ data/     # hooks, types, sample data
public/                     # PWA icons
```

## Notes

- Data lives **in each device's browser** (no cloud sync). To move devices,
  use the JSON backup feature in the Group Selector.
- All calculations run client-side; no data is sent anywhere.

## License

Apache-2.0 — see [LICENSE](./LICENSE).
