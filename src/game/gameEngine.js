// Pure game logic only (NO JSX)
import { generatePeople, generatePerson } from "./nameGenerator";


// ---------- New Game ----------
export function newGame(country) {
  return {
    country, // FULL country profile (name, flag, population, etc.)

    turn: 1,
    monthIndex: 0,
    termTurns: 24,
    choseDecisionThisTurn: false,

    log: [`Elected President of ${country?.name || "your country"}.`],

    stats: deriveStartingStats(country),

   cabinet: {
   economy: generatePerson("Economy Minister"),
   interior: generatePerson("Interior Minister"),
   foreign: generatePerson("Foreign Minister"),
},

    diplomacy: {
      reputation: 50,
      embassies: 0,
      alliances: [],
      relations: { neighbors: 50, west: 50, east: 50, gulf: 50 },
    },
        foreignAffairs: {
      memberships: {
        eu: false,
        nato: false,
        worldBank: false,
        icj: false, // International Court of Justice
        icc: false, // International Criminal Court
      },
      embassiesAbroad: [], // { country: "France", city:"Paris", ambassador:"Name" }
      missionsInCountry: [], // { country:"USA", city:"Capital City", ambassador:"Name" }
      agreements: [], // { type:"Trade", partner:"Germany", focus:"Economy" }
      ambassadorsPool: generatePeople(6, "Ambassador"),


    },financeSystem: {
  // monthly income sources
  income: {
    baseTaxes: 260,     // will be adjusted monthly by economy/jobs
    customs: 60,
    stateCompanies: 40,
    other: 30,
  },

  // monthly spending allocations (you can change in Finance page)
  allocations: {
    government: 120,
    ministries: {
      economy: 80,
      interior: 90,
      foreign: 60,
      health: 100,
      education: 100,
      justice: 70,
      sports: 40,
      migration: 55,
    },
    regions: 90,
    diplomacy: 40,
    culture: 25,
    sportsClubs: 20,
    research: 35,
  },

  // debt / credit
  debt: {
    outstanding: 0,
    interestRate: 0.06,   // 6% yearly (we apply monthly)
    creditScore: 55,      // 0-100
    lastLoanTurn: -999,
  },

  // tracking
  lastMonth: { income: 0, spending: 0, balance: 0, debtService: 0 },
},

economySystem: {
  transport: { air: 40, rail: 35, sea: 30, highway: 45 },
  utilities: { electricity: 50, water: 52 },
  stateBuildings: 40,
  parksNature: 38,
  industries: { manufacturing: 42, agriculture: 44, tech: 35 },
  stateCompanies: { count: 6, efficiency: 45 },
  investments: {
    gold: 0,
    crypto: 0,
    stocks: 0,
    portfolioValue: 0
  },
},

    media: {
  trust: 55,      // 0-100 (public trust in media)
  pressure: 35,   // 0-100 (how aggressive media is)
  reaction: 50,   // 0-100 (current month sentiment)
  headlines: [],
},

    securityState: {
      budget: 120,        // monthly/abstract
      bordersLevel: 40,   // 0-100
      policeLevel: 45,    // 0-100
      intelLevel: 35,     // 0-100

      army: {
        airForce: 35,
        navalForce: 25,
        groundForce: 40,
        militaryPolice: 30,
        specialForces: 25,
      },

      equipment: {
        drones: 0,
        fighters: 0,
        patrolBoats: 0,
        armoredVehicles: 0,
      },
    },
        intelligence: {
      budget: 60,
      threatLevel: 30, // 0–100 internal threat
      counterIntel: 40, // protection against leaks/coups
      foreignIntel: 35, // spying abroad
      agents: generatePeople(5, "Intelligence Agent"),
      activeOperations: [],
    },

labs: {
  bio: 20,
  nuclear: 10,
  physics: 25,
  chemistry: 22,
  safety: 45,      // safety/inspections
  secrecy: 35,     // secrecy level
},

        finance: {
      taxRate: 18,      // %
      debt: 0,
      interestRate: 3,  // %
      monthlyServices: 80, // baseline spending
    },
    // ---------- HEALTH ----------
    health: {
      hospitals: 12,
      bedsPer1000: 3.2,
      doctorsPer1000: 2.6,
      insuranceCoverage: 62, // %
      natalityPer1000: 10.5, // births per 1000
      newbornsThisMonth: 0,
      vaccinationRate: 55, // %
      healthInfrastructure: 48, // 0-100
    },

    // ---------- SPORTS ----------
    sports: {
      memberships: { fifa: false, fiba: false, uefa: false, ioc: false },
      nationalTeams: [
        { sport: "Football", ranking: 85, coach: null, budget: 40, academy: 35 },
        { sport: "Basketball", ranking: 72, coach: null, budget: 25, academy: 30 },
        { sport: "Volleyball", ranking: 66, coach: null, budget: 18, academy: 28 },
      ],
      facilities: { stadiums: 6, arenas: 3, trainingCenters: 2 },
      staffPool: generatePeople(10, "Coach/Scout"),
    },

    // ---------- MIGRATION ----------
    migration: {
      visaPolicy: "Balanced", // Strict | Balanced | Open
      queues: {
        work: { applicants: 1200, approvals: 0, rejected: 0 },
        student: { applicants: 700, approvals: 0, rejected: 0 },
        asylum: { applicants: 400, approvals: 0, rejected: 0 },
      },
      borderPressure: 35, // 0-100
      integrationLevel: 40, // 0-100
    },

    // ---------- LAW & JUSTICE ----------
    law: {
      antiCorruptionBureau: { level: 35, activeCases: 3 },
      courts: {
        supreme: { backlog: 40, trust: 55 },
        appeal: { backlog: 55, trust: 50 },
        district: { backlog: 65, trust: 45 },
      },
      laws: [], // will be filled by parliament bills when passed
    },

    // ---------- EDUCATION ----------
    education: {
      literacy: 92,
      universityQuality: 45,
      schoolsInfrastructure: 50,
      teachersPer1000: 6.2,
      reformsLevel: 20,
    },

    // ---------- ADMINISTRATION ----------
    administration: {
      capitalCity: country?.capital || "Capital",
      regions: [
        { name: "North Region", municipalities: 12, budget: 60, satisfaction: 50 },
        { name: "Central Region", municipalities: 18, budget: 80, satisfaction: 52 },
        { name: "South Region", municipalities: 10, budget: 55, satisfaction: 48 },
      ],
      digitalization: 30,
      bureaucracy: 55, // 0-100 (higher = worse)
    },

    // ---------- PARLIAMENT ----------
    parliamentSystem: createParliamentSystem(),

    // ---------- GOVERNMENT STRUCTURE ----------
    governmentSystem: createGovernmentSystem(),


    // ✅ Dashboard-only info (Situation Room)
    dashboard: {
      currentWeather: { tempC: null, condition: "—", updatedAt: null },
      upcomingEvents: [
        { title: "Parliament Session", inMonths: 1 },
        { title: "Budget Review", inMonths: 2 },
      ],
      decisionsFeed: [], // shows latest decisions taken in departments
    },
  };
}
export function computeCreditScore(g) {
  // simple: stability/happiness help, corruption hurts, debt hurts, negative balance hurts
  const stability = g.stats.stability || 0;
  const happiness = g.stats.happiness || 0;
  const corruption = g.stats.corruption || 0;
  const debt = g.financeSystem?.debt?.outstanding || 0;

  const lastBal = g.financeSystem?.lastMonth?.balance ?? 0;
  const deficitPenalty = lastBal < 0 ? Math.min(15, Math.abs(lastBal) / 30) : 0;
  const debtPenalty = Math.min(20, debt / 800); // scale

  let score =
    40 +
    stability * 0.25 +
    happiness * 0.15 -
    corruption * 0.35 -
    deficitPenalty -
    debtPenalty;

  score = Math.max(0, Math.min(100, Math.round(score)));
  return score;
}

export function applyMonthlyFinance(g, addLogFn) {
  const f = g.financeSystem;
  if (!f) return;

  // Income grows with jobs and economy infrastructure a bit
  const jobs = g.stats.jobs || 0;
  const econ = g.economySystem;
  const econBoost =
    econ
      ? Math.round(
          (econ.transport.highway + econ.transport.rail + econ.utilities.electricity + econ.industries.manufacturing) / 12
        )
      : 0;

  const incomeBase = f.income.baseTaxes + Math.round(jobs * 2) + econBoost;
  const incomeTotal = incomeBase + f.income.customs + f.income.stateCompanies + f.income.other;

  // Spending
  const a = f.allocations;

  const ministriesTotal = Object.values(a.ministries || {}).reduce((sum, x) => sum + (x || 0), 0);
  const spendingTotal =
    (a.government || 0) +
    ministriesTotal +
    (a.regions || 0) +
    (a.diplomacy || 0) +
    (a.culture || 0) +
    (a.sportsClubs || 0) +
    (a.research || 0);

  // Debt service (monthly)
  const d = f.debt;
  const monthlyRate = (d.interestRate || 0.06) / 12;
  const debtService = Math.round((d.outstanding || 0) * monthlyRate);

  const totalSpendingWithDebt = spendingTotal + debtService;
  const balance = incomeTotal - totalSpendingWithDebt;

  // Apply balance to treasury
  g.stats.money += balance;

  // Save last month stats
  f.lastMonth = { income: incomeTotal, spending: spendingTotal, balance, debtService };

  // Credit score update
  d.creditScore = computeCreditScore(g);

  addLogFn?.(g, `FINANCE: Income ${incomeTotal} • Spending ${spendingTotal} • Debt ${debtService} • Balance ${balance}`);
  addLogFn?.(g, `CREDIT SCORE: ${d.creditScore}/100`);
}

export function applyForLoan(g, amount, addLogFn) {
  const f = g.financeSystem;
  if (!f) return { ok: false, reason: "Finance system missing." };

  const d = f.debt;
  const score = d.creditScore ?? 50;

  // cooldown: prevent spam
  if (g.turn - d.lastLoanTurn < 2) {
    return { ok: false, reason: "You can apply again in 2 turns." };
  }

  // chance depends on score and corruption
  const corruption = g.stats.corruption || 0;
  const chance = Math.max(5, Math.min(95, score - Math.round(corruption * 0.25)));

  const roll = Math.random() * 100;
  d.lastLoanTurn = g.turn;

  if (roll > chance) {
    addLogFn?.(g, `LOAN REJECTED (${Math.round(chance)}% chance).`);
    g.stats.happiness -= 1;
    g.stats.stability -= 1;
    return { ok: false, reason: "Rejected by creditors." };
  }

  // interest rate improves if score high
  let rate = 0.10; // 10%
  if (score >= 70) rate = 0.055;
  else if (score >= 60) rate = 0.07;
  else if (score >= 50) rate = 0.085;

  d.interestRate = rate;
  d.outstanding += amount;
  g.stats.money += amount;

  addLogFn?.(g, `LOAN APPROVED: +${amount} money at ${(rate * 100).toFixed(1)}% yearly interest.`);
  return { ok: true };
}

// ---------- Starting Stats ----------
export function deriveStartingStats(country) {
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // If you don't have GDP yet, fallback prevents NaN
  const gdp = country?.gdpUsd || 2e12;
  const pop = country?.population || 1e7;

  const gdpPerCapita = gdp / pop;

  // Wealth 20..100 based on log scale
  const wealth = clamp(Math.log10(Math.max(100, gdpPerCapita)) * 22, 20, 100);

  const stabilityBase =
    country?.region === "Europe" ? 62 :
    country?.region === "Americas" ? 58 :
    country?.region === "Asia" ? 54 :
    country?.region === "Oceania" ? 60 :
    country?.region === "Africa" ? 48 :
    52;

  return {
    money: Math.round(700 + wealth * 7),
    jobs: clamp(Math.round(40 + wealth * 0.45), 0, 100),
    happiness: clamp(Math.round(35 + wealth * 0.40), 0, 100),
    stability: clamp(Math.round(stabilityBase + wealth * 0.18), 0, 100),
    security: clamp(Math.round(40 + wealth * 0.35), 0, 100),
    corruption: clamp(Math.round(35 - wealth * 0.28), 0, 100),
    parliament: 50,
    capital: 3,
  };
}

// ---------- Clamp Stats ----------
export function clampStats(s) {
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  return {
    ...s,
    jobs: clamp(s.jobs, 0, 100),
    happiness: clamp(s.happiness, 0, 100),
    stability: clamp(s.stability, 0, 100),
    security: clamp(s.security, 0, 100),
    corruption: clamp(s.corruption, 0, 100),
    parliament: clamp(s.parliament, 0, 100),
    capital: clamp(s.capital, 0, 10),
  };
}

// ---------- Log Helper ----------
export function addLog(g, msg) {
  g.log = [...g.log, msg];
}
export function getMinisterBonus(game, ministryId) {
  const ministry = game.governmentSystem?.ministries?.find(m => m.id === ministryId);
  if (!ministry || !ministry.minister) {
    return { skill: 0, loyalty: 0 };
  }

  return {
    skill: ministry.minister.skill || 0,
    loyalty: ministry.minister.loyalty || 0,
  };
}
export function ministerRisk(game, ministryId, logFn) {
  const { loyalty } = getMinisterBonus(game, ministryId);
  if (loyalty <= 2 && Math.random() < 0.18) {
    game.stats.happiness -= 2;
    game.stats.stability -= 1;
    game.stats.corruption += 2;
    logFn?.(game, `Scandal: Internal issues in ${ministryId} ministry due to low loyalty.`);
  }
}

// ---------- Diplomacy Upkeep ----------
export function embassyUpkeep(g) {
  const cost = g.diplomacy.embassies * 20;
  if (cost > 0) {
    g.stats.money -= cost;
    g.diplomacy.reputation += g.diplomacy.embassies;
    addLog(g, `Embassy upkeep: -${cost} money.`);
  }
}

// ---------- Parliament Vote ----------
export function parliamentVote(g, difficulty = 55) {
  const support = g.stats.parliament;
  const boost = g.stats.capital * 5;
  const chance = Math.max(5, Math.min(95, support + boost - difficulty));
  const roll = Math.random() * 100;
  return { passed: roll < chance, chance: Math.round(chance) };
}
export function canJoinInstitution(g, key) {
  const s = g.stats;
  const rep = g.diplomacy?.reputation ?? 50;

  const rules = {
    eu: {
      label: "EU",
      checks: [
        { ok: rep >= 60, msg: "Reputation must be at least 60." },
        { ok: s.corruption <= 40, msg: "Corruption must be 40 or lower." },
        { ok: s.stability >= 55, msg: "Stability must be at least 55." },
      ],
      needsVote: true,
      voteDifficulty: 60,
      costMoney: 180,
      repGain: 8,
    },
    nato: {
      label: "NATO",
      checks: [
        { ok: rep >= 55, msg: "Reputation must be at least 55." },
        { ok: s.security >= 55, msg: "Security must be at least 55." },
      ],
      needsVote: true,
      voteDifficulty: 58,
      costMoney: 140,
      repGain: 6,
    },
    worldBank: {
      label: "World Bank",
      checks: [
        { ok: rep >= 50, msg: "Reputation must be at least 50." },
        { ok: s.corruption <= 55, msg: "Corruption must be 55 or lower." },
      ],
      needsVote: false,
      voteDifficulty: 0,
      costMoney: 80,
      repGain: 4,
    },
    icj: {
      label: "ICJ (The Hague)",
      checks: [
        { ok: s.stability >= 45, msg: "Stability must be at least 45." },
      ],
      needsVote: false,
      voteDifficulty: 0,
      costMoney: 30,
      repGain: 2,
    },
    icc: {
      label: "ICC",
      checks: [
        { ok: s.corruption <= 70, msg: "Corruption must be 70 or lower." },
        { ok: s.stability >= 45, msg: "Stability must be at least 45." },
      ],
      needsVote: false,
      voteDifficulty: 0,
      costMoney: 40,
      repGain: 2,
    },
  };

  return rules[key] || null;
}


// ---------- Dashboard: Weather (fake for now) ----------
export function updateWeather(g) {
  const m = g.monthIndex % 12;

  // seasonal curve (northern hemisphere feel)
  const base = [2, 4, 8, 13, 18, 22, 25, 24, 19, 13, 7, 3][m];

  // random variation -3..+3
  const variation = Math.round(Math.random() * 6 - 3);
  const tempC = base + variation;

  const conditions = ["Clear", "Cloudy", "Rain", "Windy", "Storm"];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];

  if (!g.dashboard) g.dashboard = {};
  g.dashboard.currentWeather = { tempC, condition, updatedAt: Date.now() };
}

// ---------- Dashboard: Decisions Feed ----------
export function pushDecisionToFeed(g, decisionTitle, category) {
  if (!g.dashboard) g.dashboard = {};
  if (!Array.isArray(g.dashboard.decisionsFeed)) g.dashboard.decisionsFeed = [];

  const item = { title: decisionTitle, category, time: Date.now() };
  g.dashboard.decisionsFeed = [item, ...g.dashboard.decisionsFeed].slice(0, 6);
}

// ---------- Clamp Everything ----------
export function clampAll(g) {
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  g.stats = clampStats(g.stats);

  const d = g.diplomacy;
  d.reputation = clamp(d.reputation, 0, 100);
  d.relations.neighbors = clamp(d.relations.neighbors, 0, 100);
  d.relations.west = clamp(d.relations.west, 0, 100);
  d.relations.east = clamp(d.relations.east, 0, 100);
  d.relations.gulf = clamp(d.relations.gulf, 0, 100);
}
export function createParliamentSystem() {
  // Simple party-based parliament with members list (expandable)
  const parties = [
    { id: "center", name: "Civic Center", ideology: "Center", seats: 34 },
    { id: "right", name: "National Reform", ideology: "Right", seats: 28 },
    { id: "left", name: "Workers Alliance", ideology: "Left", seats: 22 },
    { id: "green", name: "Green Future", ideology: "Green", seats: 16 },
  ];

  const members = [];
  parties.forEach(p => {
    for (let i = 0; i < p.seats; i++) {
      const m = generatePerson("MP");
      members.push({
        id: m.id,
        name: m.name,
        partyId: p.id,
        influence: Math.max(1, Math.min(5, m.skill)),
        loyalty: m.loyalty,
      });
    }
  });

  return {
    parties,
    members,                 // all MPs with party
    coalition: ["center"],   // current government support parties
    bills: [],               // draft bills to vote
    passed: [],              // passed bills history (optional)
  };
}

export function createGovernmentSystem() {
  // Full ministries + secretaries
  const ministries = [
    { id: "economy", name: "Ministry of Economy", minister: generatePerson("Minister"), secretaries: generatePeople(3, "Secretary") },
    { id: "interior", name: "Ministry of Interior", minister: generatePerson("Minister"), secretaries: generatePeople(3, "Secretary") },
    { id: "foreign", name: "Ministry of Foreign Affairs", minister: generatePerson("Minister"), secretaries: generatePeople(3, "Secretary") },
    { id: "health", name: "Ministry of Health", minister: generatePerson("Minister"), secretaries: generatePeople(3, "Secretary") },
    { id: "education", name: "Ministry of Education", minister: generatePerson("Minister"), secretaries: generatePeople(3, "Secretary") },
    { id: "justice", name: "Ministry of Justice", minister: generatePerson("Minister"), secretaries: generatePeople(3, "Secretary") },
    { id: "sports", name: "Ministry of Sports", minister: generatePerson("Minister"), secretaries: generatePeople(2, "Secretary") },
    { id: "migration", name: "Migration Agency", minister: generatePerson("Director"), secretaries: generatePeople(2, "Secretary") },
  ];

  return {
    ministries,
    advisors: generatePeople(4, "Advisor"),
    staffPool: generatePeople(12, "Government Staff"), // candidates for appointments
  };
}
export function getMinistryBudget(game, ministryId) {
  const m = game.financeSystem?.allocations?.ministries?.[ministryId];
  return typeof m === "number" ? m : 0;
}

/**
 * Returns a multiplier based on budget.
 * - underfunded => weaker outcomes, more risk
 * - well funded => stronger outcomes, less risk
 */
export function getBudgetMultiplier(game, ministryId) {
  const b = getMinistryBudget(game, ministryId);

  // you can tune these later
  if (b <= 30) return 0.75;   // crisis
  if (b <= 60) return 0.90;   // low
  if (b <= 110) return 1.00;  // normal
  if (b <= 160) return 1.10;  // good
  return 1.20;                // very high
}

/**
 * Optional: budget pressure increases corruption & stability risk if too low.
 * Call once per month in Dashboard nextMonth().
 */
export function applyBudgetPressure(g, addLogFn) {
  const mins = g.financeSystem?.allocations?.ministries;
  if (!mins) return;

  const avg = Object.values(mins).reduce((a, x) => a + (x || 0), 0) / Math.max(1, Object.keys(mins).length);

  // If average ministry budget too low, services degrade
  if (avg < 60) {
    g.stats.happiness -= 1;
    g.stats.stability -= 1;
    if (Math.random() < 0.20) g.stats.corruption += 1;
    addLogFn?.(g, "Budget pressure: Underfunded ministries reduce public services.");
  }

  // If average is very high, small stability boost
  if (avg > 140) {
    g.stats.stability += 1;
    addLogFn?.(g, "Budget boost: Strong funding improves state performance.");
  }
}
