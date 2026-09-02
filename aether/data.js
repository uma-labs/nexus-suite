/**
 * AETHER — Adaptive Expense & Fee Reduction OS
 * Household data mapped from UrCreditOptima utils/initialData.ts SEED (read-only).
 * Liquid runway uses CASH only (checking + savings). Principal 401k ($145k INVESTMENT) excluded from runway.
 *
 * burn.monthlyLivingBurn: demo living estimate ~$2,800 (utilities/food/housing round-up).
 *   Seed debt mins alone ≈ $3,375.45/mo (cards $1,310 + loans $2,065.45) — tracked via debts/bills, not burn.
 * income / debtBudget / subscriptions / feeEvents: demo overlays — not Optima live balances.
 */
window.AETHER_DATA = {
  meta: {
    app: "AETHER",
    version: "1.0",
    household: "Uma / Remya (Optima seed)",
    members: ["Uma", "Remya", "Shared"],
    timezone: "America/New_York",
    safetyFloor: 750,
    currency: "USD",
    asOf: "2026-09-02",
    source: "UrCreditOptima utils/initialData.ts seed — not live localStorage",
    incomeNote: "nextPaycheckAmount / nextPaycheckDate are DEMO income overlays — not from Optima seed",
    investmentNote: "Principal 401k $145,000 (Uma) excluded from liquid runway",
  },

  accounts: {
    checking: {
      id: "chk-uma-cash",
      name: "Uma Cash (Chase + Citi + WF)",
      institution: "Multi — Optima CASH assets (Uma)",
      balance: 5610,
      type: "checking",
    },
    savings: {
      id: "sav-remya-cash",
      name: "Remya Cash (Chase + other)",
      institution: "Multi — Optima CASH assets (non-Uma)",
      balance: 1200,
      type: "savings",
    },
  },

  debitCards: [
    {
      id: "debit-uma-chase",
      label: "Uma Debit — Chase Checking",
      linkedAccount: "chk-uma-cash",
      holder: "Uma",
    },
    {
      id: "debit-remya-chase",
      label: "Remya Debit — Chase Checking",
      linkedAccount: "sav-remya-cash",
      holder: "Remya",
    },
  ],

  /** DEMO income overlay — see meta.incomeNote */
  income: {
    nextPaycheckDate: "2026-09-12",
    nextPaycheckAmount: 4200,
    payFrequencyDays: 14,
    monthlyNetEstimate: 8400,
  },

  /**
   * Living burn only (non-debt). Demo estimate ~$2,800.
   * Seed mins ≈ $3,375.45 are modeled in debts/bills, not here.
   */
  burn: {
    monthlyLivingBurn: 2800,
    dailyBurn: 2800 / 30,
  },

  /**
   * Fee Radar — DEMO fee estimates / overlays only.
   * Amounts are illustrative; card balances are NOT invented (names from Optima seed).
   */
  feeEvents: [
    {
      id: "fee-01",
      category: "overdraft_nsf",
      label: "Overdraft / NSF",
      amount: 35,
      status: "at_risk",
      date: "2026-09-08",
      detail: "DEMO fee estimate — Uma checking buffer thin vs clustered Autopay mins (Upstart PL2 6th + Discover 7–8).",
    },
    {
      id: "fee-02",
      category: "late_payment",
      label: "Late Payment",
      amount: 40,
      status: "at_risk",
      date: "2026-09-02",
      detail: "DEMO fee estimate — CITI ••001 near-full util (~99.8% of $2,000 limit); protect due day 2 min.",
    },
    {
      id: "fee-03",
      category: "late_payment",
      label: "Late Payment",
      amount: 40,
      status: "prevented",
      date: "2026-08-28",
      detail: "DEMO overlay — Bill Float flagged DISCOVERCARD ••102 (Uma, high util ~88.7%) before due day 8.",
    },
    {
      id: "fee-04",
      category: "overdraft_nsf",
      label: "Overdraft / NSF",
      amount: 35,
      status: "prevented",
      date: "2026-09-01",
      detail: "DEMO overlay — Debit Shield held non-must spend ahead of LendingClub PL4 1st + AMEX ••407 due day 1.",
    },
    {
      id: "fee-05",
      category: "monthly_maintenance",
      label: "Monthly Maintenance",
      amount: 12,
      status: "prevented",
      date: "2026-09-01",
      detail: "DEMO fee estimate — Chase Checking relationship waiver met (seed cash accounts).",
    },
    {
      id: "fee-06",
      category: "late_payment",
      label: "Late Payment",
      amount: 29,
      status: "at_risk",
      date: "2026-09-14",
      detail: "DEMO fee estimate — CITI ••003 avalanche-top APR 28.24% due day 14; float min before cutoff.",
    },
    {
      id: "fee-07",
      category: "atm_oon",
      label: "ATM Out-of-Network",
      amount: 3.5,
      status: "occurred",
      date: "2026-08-20",
      detail: "DEMO fee estimate — illustrative OON ATM against Uma cash runway (not from Optima ledger).",
    },
    {
      id: "fee-08",
      category: "late_payment",
      label: "Late Payment",
      amount: 40,
      status: "at_risk",
      date: "2026-09-07",
      detail: "DEMO fee estimate — Remya DISCOVERCARD ••051 util ~61.6% due day 7; keep Autopay funded.",
    },
  ],

  /**
   * Upcoming scheduled debits (Debit Shield) — mirrors bills (card/loan mins from seed).
   */
  upcomingDebits: [
    { id: "d-amex-blue", name: "AMEX ••407 Min Pay", amount: 35, date: "2026-09-01", category: "debt" },
    { id: "d-pl4", name: "LendingClub PL4", amount: 467.45, date: "2026-09-01", category: "debt" },
    { id: "d-citi-1", name: "CITI ••001 Min Pay", amount: 50, date: "2026-09-02", category: "debt" },
    { id: "d-kohls", name: "CAP1/KOHLS ••212 Min Pay", amount: 40, date: "2026-09-04", category: "debt" },
    { id: "d-pl2", name: "Upstart PL2", amount: 286, date: "2026-09-06", category: "debt" },
    { id: "d-discover-remya", name: "DISCOVERCARD ••051 (Remya) Min Pay", amount: 144, date: "2026-09-07", category: "debt" },
    { id: "d-discover", name: "DISCOVERCARD ••102 Min Pay", amount: 191, date: "2026-09-08", category: "debt" },
    { id: "d-pl1", name: "Upstart PL1", amount: 865, date: "2026-09-08", category: "debt" },
    { id: "d-pl3", name: "Avant PL3", amount: 447, date: "2026-09-12", category: "debt" },
    { id: "d-capone-sm", name: "CAPITAL ONE ••209 Min Pay", amount: 35, date: "2026-09-13", category: "debt" },
    { id: "d-citi-2", name: "CITI ••003 Min Pay", amount: 54, date: "2026-09-14", category: "debt" },
    { id: "d-chase-amz", name: "JPMCB CARD ••306 Min Pay", amount: 35, date: "2026-09-14", category: "debt" },
    { id: "d-sofi", name: "SOFIBANK ••508 Min Pay", amount: 35, date: "2026-09-15", category: "debt" },
    { id: "d-amex-evry", name: "AMEX Joint ••411 Min Pay", amount: 35, date: "2026-09-16", category: "debt" },
    { id: "d-robinhood", name: "ROBINHOOD Joint ••900 Min Pay", amount: 35, date: "2026-09-16", category: "debt" },
    { id: "d-wf", name: "WFBNA CARD ••610 Min Pay", amount: 35, date: "2026-09-18", category: "debt" },
    { id: "d-chase-sapph", name: "JPMCB CARD Joint ••305 Min Pay", amount: 350, date: "2026-09-25", category: "debt" },
    { id: "d-capone-plat", name: "CAPITAL ONE ••204 Min Pay", amount: 56, date: "2026-09-28", category: "debt" },
    { id: "d-gs-remya", name: "GS BANK USA ••050 (Remya) Min Pay", amount: 180, date: "2026-09-30", category: "debt" },
  ],

  /** Short sample set — not from Optima */
  subscriptions: [
    {
      id: "sub-stream",
      name: "Streaming Bundle (sample)",
      amount: 22.99,
      cadence: "monthly",
      recommendation: "keep",
      reason: "sample overlay — not from Optima",
      lastUsedDaysAgo: 3,
    },
    {
      id: "sub-music",
      name: "Music Family (sample)",
      amount: 16.99,
      cadence: "monthly",
      recommendation: "keep",
      reason: "sample overlay — not from Optima",
      lastUsedDaysAgo: 1,
    },
    {
      id: "sub-cloud",
      name: "Cloud Storage Pro (sample)",
      amount: 9.99,
      cadence: "monthly",
      recommendation: "kill",
      reason: "sample overlay — not from Optima",
      lastUsedDaysAgo: 64,
    },
    {
      id: "sub-news",
      name: "News Digests (sample)",
      amount: 4.99,
      cadence: "monthly",
      recommendation: "kill",
      reason: "sample overlay — not from Optima",
      lastUsedDaysAgo: 90,
    },
  ],

  /**
   * Bills — next-cycle mins from OPEN cards (balance>0) + loans (balance>0).
   * dueDate = 2026-09-{dueDay clamped to Sep}. priority must for cards/loans.
   */
  bills: [
    { id: "b-amex-blue", name: "AMEX ••407 Min Pay", amount: 35, dueDate: "2026-09-01", priority: "must" },
    { id: "b-pl4", name: "LendingClub PL4", amount: 467.45, dueDate: "2026-09-01", priority: "must" },
    { id: "b-citi-1", name: "CITI ••001 Min Pay", amount: 50, dueDate: "2026-09-02", priority: "must" },
    { id: "b-kohls", name: "CAP1/KOHLS ••212 Min Pay", amount: 40, dueDate: "2026-09-04", priority: "must" },
    { id: "b-pl2", name: "Upstart PL2", amount: 286, dueDate: "2026-09-06", priority: "must" },
    { id: "b-discover-remya", name: "DISCOVERCARD ••051 (Remya) Min Pay", amount: 144, dueDate: "2026-09-07", priority: "must" },
    { id: "b-discover", name: "DISCOVERCARD ••102 Min Pay", amount: 191, dueDate: "2026-09-08", priority: "must" },
    { id: "b-pl1", name: "Upstart PL1", amount: 865, dueDate: "2026-09-08", priority: "must" },
    { id: "b-pl3", name: "Avant PL3", amount: 447, dueDate: "2026-09-12", priority: "must" },
    { id: "b-capone-sm", name: "CAPITAL ONE ••209 Min Pay", amount: 35, dueDate: "2026-09-13", priority: "must" },
    { id: "b-citi-2", name: "CITI ••003 Min Pay", amount: 54, dueDate: "2026-09-14", priority: "must" },
    { id: "b-chase-amz", name: "JPMCB CARD ••306 Min Pay", amount: 35, dueDate: "2026-09-14", priority: "must" },
    { id: "b-sofi", name: "SOFIBANK ••508 Min Pay", amount: 35, dueDate: "2026-09-15", priority: "must" },
    { id: "b-amex-evry", name: "AMEX Joint ••411 Min Pay", amount: 35, dueDate: "2026-09-16", priority: "must" },
    { id: "b-robinhood", name: "ROBINHOOD Joint ••900 Min Pay", amount: 35, dueDate: "2026-09-16", priority: "must" },
    { id: "b-wf", name: "WFBNA CARD ••610 Min Pay", amount: 35, dueDate: "2026-09-18", priority: "must" },
    { id: "b-chase-sapph", name: "JPMCB CARD Joint ••305 Min Pay", amount: 350, dueDate: "2026-09-25", priority: "must" },
    { id: "b-capone-plat", name: "CAPITAL ONE ••204 Min Pay", amount: 56, dueDate: "2026-09-28", priority: "must" },
    { id: "b-gs-remya", name: "GS BANK USA ••050 (Remya) Min Pay", amount: 180, dueDate: "2026-09-30", priority: "must" },
  ],

  /**
   * Debt Ladder inputs — OPEN cards balance>0 + loans balance>0 from Optima seed.
   * App sorts avalanche by APR.
   */
  debts: [
    {
      id: "citi-1",
      name: "CITI ••001 (Uma, promo 0%)",
      balance: 1995,
      apr: 0,
      minPayment: 50,
      type: "credit_card",
    },
    {
      id: "discover-it",
      name: "DISCOVERCARD ••102 (Uma)",
      balance: 11090,
      apr: 23.24,
      minPayment: 191,
      type: "credit_card",
    },
    {
      id: "citi-2",
      name: "CITI ••003 (Uma)",
      balance: 2159,
      apr: 28.24,
      minPayment: 54,
      type: "credit_card",
    },
    {
      id: "capone-plat",
      name: "CAPITAL ONE ••204 (Uma)",
      balance: 2234,
      apr: 24.74,
      minPayment: 56,
      type: "credit_card",
    },
    {
      id: "chase-sapph",
      name: "JPMCB CARD Joint ••305 (Uma)",
      balance: 3114,
      apr: 22.99,
      minPayment: 350,
      type: "credit_card",
    },
    {
      id: "chase-amz",
      name: "JPMCB CARD ••306 (Uma)",
      balance: 124,
      apr: 23.99,
      minPayment: 35,
      type: "credit_card",
    },
    {
      id: "amex-blue",
      name: "AMEX ••407 (Uma)",
      balance: 119,
      apr: 25.74,
      minPayment: 35,
      type: "credit_card",
    },
    {
      id: "sofi",
      name: "SOFIBANK ••508 (Uma)",
      balance: 207,
      apr: 24.99,
      minPayment: 35,
      type: "credit_card",
    },
    {
      id: "capone-sm",
      name: "CAPITAL ONE ••209 (Uma)",
      balance: 80,
      apr: 26.92,
      minPayment: 35,
      type: "credit_card",
    },
    {
      id: "wf-cash",
      name: "WFBNA CARD ••610 (Uma)",
      balance: 64,
      apr: 22.74,
      minPayment: 35,
      type: "credit_card",
    },
    {
      id: "amex-evry",
      name: "AMEX Joint ••411 (Uma)",
      balance: 87,
      apr: 23.74,
      minPayment: 35,
      type: "credit_card",
    },
    {
      id: "kohls",
      name: "CAP1/KOHLS ••212 (Uma)",
      balance: 55,
      apr: 25.74,
      minPayment: 40,
      type: "credit_card",
    },
    {
      id: "robinhood-joint",
      name: "ROBINHOOD Joint ••900 (Uma)",
      balance: 603,
      apr: 24.99,
      minPayment: 35,
      type: "credit_card",
    },
    {
      id: "gs-bank-remya",
      name: "GS BANK USA ••050 (Remya)",
      balance: 5115,
      apr: 19.99,
      minPayment: 180,
      type: "credit_card",
    },
    {
      id: "discover-remya",
      name: "DISCOVERCARD ••051 (Remya)",
      balance: 5729,
      apr: 23.24,
      minPayment: 144,
      type: "credit_card",
    },
    {
      id: "pl1-upstart",
      name: "Upstart PL1 (L1067162)",
      balance: 4255.74,
      apr: 10.77,
      minPayment: 865,
      type: "personal_loan",
    },
    {
      id: "pl2-upstart",
      name: "Upstart PL2 (L2174553)",
      balance: 3454.82,
      apr: 10.8,
      minPayment: 286,
      type: "personal_loan",
    },
    {
      id: "pl3-avant",
      name: "Avant PL3 (L1823)",
      balance: 16430.6,
      apr: 24.0,
      minPayment: 447,
      type: "personal_loan",
    },
    {
      id: "pl4-lendingclub",
      name: "LendingClub PL4",
      balance: 20900,
      apr: 12.24,
      minPayment: 467.45,
      type: "personal_loan",
    },
  ],

  /** DEMO overlay — not from Optima */
  debtBudget: {
    monthlyLeftoverForDebt: 450,
  },
};
