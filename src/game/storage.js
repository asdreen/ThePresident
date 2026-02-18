import { clampStats } from "./gameEngine";
import { generatePeople } from "./nameGenerator";
import { createParliamentSystem, createGovernmentSystem } from "./gameEngine";


export const SAVE_KEY = "pres_sim_save_v2";

// ---------- Save ----------
export function saveGame(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

// ---------- Normalize (IMPORTANT) ----------
function normalizeGame(g) {
  if (!g) return null;

  if (!Array.isArray(g.foreignAffairs.ambassadorsPool)) {
    g.foreignAffairs.ambassadorsPool = generatePeople(6, "Ambassador");
  }
  if (!g.financeSystem) {
  g.financeSystem = {
    income: { baseTaxes: 260, customs: 60, stateCompanies: 40, other: 30 },
    allocations: {
      government: 120,
      ministries: { economy:80, interior:90, foreign:60, health:100, education:100, justice:70, sports:40, migration:55 },
      regions: 90,
      diplomacy: 40,
      culture: 25,
      sportsClubs: 20,
      research: 35,
    },
    debt: { outstanding: 0, interestRate: 0.06, creditScore: 55, lastLoanTurn: -999 },
    lastMonth: { income: 0, spending: 0, balance: 0, debtService: 0 },
  };
}

    if (!g.intelligence) {
    g.intelligence = {
      budget: 60,
      threatLevel: 30,
      counterIntel: 40,
      foreignIntel: 35,
      agents: generatePeople(5, "Intelligence Agent"),
      activeOperations: [],
    };
  }
if (g.securityState && !g.securityState.labs) {
  g.securityState.labs = { bio:20, nuclear:10, physics:25, chemistry:22, safety:45, secrecy:35 };
}

  if (!Array.isArray(g.intelligence.agents)) {
    g.intelligence.agents = generatePeople(5, "Intelligence Agent");
  }


  // ---- Finance ----
  if (!g.finance) {
    g.finance = {
      taxRate: 18,
      debt: 0,
      interestRate: 3,
      monthlyServices: 80,
    };
  }
    if (!g.foreignAffairs) {
    g.foreignAffairs = {
      memberships: { eu:false, nato:false, worldBank:false, icj:false, icc:false },
      embassiesAbroad: [],
      missionsInCountry: [],
      agreements: [],
    };
  }

  if (!g.securityState) {
    g.securityState = {
      budget: 120,
      bordersLevel: 40,
      policeLevel: 45,
      intelLevel: 35,
      army: { airForce:35, navalForce:25, groundForce:40, militaryPolice:30, specialForces:25 },
      equipment: { drones:0, fighters:0, patrolBoats:0, armoredVehicles:0 },
    };
  }


  // ---- Dashboard ----
  if (!g.dashboard) {
    g.dashboard = {
      currentWeather: { tempC: null, condition: "—", updatedAt: null },
      upcomingEvents: [],
      decisionsFeed: [],
    };
  }
if (!g.media) {
  g.media = { trust: 55, pressure: 35, reaction: 50, headlines: [] };
}
if (!g.economySystem) {
  g.economySystem = {
    transport: { air: 40, rail: 35, sea: 30, highway: 45 },
    utilities: { electricity: 50, water: 52 },
    stateBuildings: 40,
    parksNature: 38,
    industries: { manufacturing: 42, agriculture: 44, tech: 35 },
    stateCompanies: { count: 6, efficiency: 45 },
    investments: { gold: 0, crypto: 0, stocks: 0, portfolioValue: 0 },
  };
}

  // ---- Diplomacy ----
  if (!g.diplomacy) {
    g.diplomacy = {
      reputation: 50,
      embassies: 0,
      alliances: [],
      relations: { neighbors: 50, west: 50, east: 50, gulf: 50 },
    };
  }

  // ---- Stats safety ----
  if (g.stats) {
    g.stats = clampStats(g.stats);
  }
  if (!g.health) {
    g.health = {
      hospitals: 12, bedsPer1000: 3.2, doctorsPer1000: 2.6,
      insuranceCoverage: 62, natalityPer1000: 10.5, newbornsThisMonth: 0,
      vaccinationRate: 55, healthInfrastructure: 48,
    };
  }

  if (!g.sports) {
    g.sports = {
      memberships: { fifa:false, fiba:false, uefa:false, ioc:false },
      nationalTeams: [
        { sport: "Football", ranking: 85, coach: null, budget: 40, academy: 35 },
        { sport: "Basketball", ranking: 72, coach: null, budget: 25, academy: 30 },
        { sport: "Volleyball", ranking: 66, coach: null, budget: 18, academy: 28 },
      ],
      facilities: { stadiums: 6, arenas: 3, trainingCenters: 2 },
      staffPool: generatePeople(10, "Coach/Scout"),
    };
  }

  if (!g.migration) {
    g.migration = {
      visaPolicy: "Balanced",
      queues: {
        work: { applicants: 1200, approvals: 0, rejected: 0 },
        student: { applicants: 700, approvals: 0, rejected: 0 },
        asylum: { applicants: 400, approvals: 0, rejected: 0 },
      },
      borderPressure: 35,
      integrationLevel: 40,
    };
  }

  if (!g.law) {
    g.law = {
      antiCorruptionBureau: { level: 35, activeCases: 3 },
      courts: {
        supreme: { backlog: 40, trust: 55 },
        appeal: { backlog: 55, trust: 50 },
        district: { backlog: 65, trust: 45 },
      },
      laws: [],
    };
  }

  if (!g.education) {
    g.education = {
      literacy: 92,
      universityQuality: 45,
      schoolsInfrastructure: 50,
      teachersPer1000: 6.2,
      reformsLevel: 20,
    };
  }

  if (!g.administration) {
    g.administration = {
      capitalCity: g.country?.capital || "Capital",
      regions: [
        { name: "North Region", municipalities: 12, budget: 60, satisfaction: 50 },
        { name: "Central Region", municipalities: 18, budget: 80, satisfaction: 52 },
        { name: "South Region", municipalities: 10, budget: 55, satisfaction: 48 },
      ],
      digitalization: 30,
      bureaucracy: 55,
    };
  }

  if (!g.parliamentSystem) {
    g.parliamentSystem = createParliamentSystem();
  }

  if (!g.governmentSystem) {
    g.governmentSystem = createGovernmentSystem();
  }
if (!Array.isArray(g.governmentSystem.staffPool)) {
  // fallback if older save
  g.governmentSystem.staffPool = [];
}

  // ---- Defaults ----
  if (typeof g.choseDecisionThisTurn !== "boolean") {
    g.choseDecisionThisTurn = false;
  }

  if (!Array.isArray(g.log)) {
    g.log = [];
  }

  return g;
}

// ---------- Load ----------
export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return normalizeGame(JSON.parse(raw));
  } catch {
    return null;
  }
}

// ---------- Clear ----------
export function clearGame() {
  localStorage.removeItem(SAVE_KEY);
}
