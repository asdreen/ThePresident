export const CATEGORIES = {
  DIPLOMACY: "Diplomacy",

  INTERNAL: "Internal Affairs",
  HEALTH: "Health",
  SPORTS: "Sports",
  MIGRATION: "Migration",
  LAW: "Law",
  EDUCATION: "Education",
  ADMIN: "Administration",
    ECONOMY: "Economy",

};

export const DECISIONS = [
    // ECONOMY
  {
    id: "subsidize_business",
    category: CATEGORIES.ECONOMY,
    title: "Subsidize Businesses",
    desc: "Boost jobs with grants and incentives. Risk of corruption.",
    apply: (g) => {
      g.stats.money -= 160;
      g.stats.jobs += 6;
      g.stats.happiness += 2;
      g.stats.corruption += 2;
    },
  },
  {
    id: "raise_taxes",
    category: CATEGORIES.ECONOMY,
    title: "Raise Taxes",
    desc: "Increase revenue, but people won’t like it.",
    needsVote: true,
    apply: (g) => {
      g.stats.money += 200;
      g.stats.happiness -= 6;
      g.stats.jobs -= 2;
    },
  },
  {
    id: "public_infrastructure",
    category: CATEGORIES.ECONOMY,
    title: "Infrastructure Investment",
    desc: "Improves jobs and stability but costs money.",
    apply: (g) => {
      g.stats.money -= 220;
      g.stats.jobs += 4;
      g.stats.stability += 2;
    },
  },

  // ---- EMBASSIES ----
  {
    id: "open_embassy",
   category: CATEGORIES.DIPLOMACY
,
    title: "Open Foreign Embassy",
    desc: "Improve reputation and relations. Costs monthly upkeep.",
    apply: (g) => {
      g.stats.money -= 120;
      g.diplomacy.embassies += 1;
      g.diplomacy.reputation += 5;
      g.diplomacy.relations.neighbors += 4;
    },
  },
  {
    id: "trade_west",
    category: CATEGORIES.EMBASSIES,
    title: "Sign Trade Agreement",
    desc: "Trade boosts jobs and reputation.",
    apply: (g) => {
      g.stats.jobs += 2;
      g.stats.money += 60;
      g.diplomacy.reputation += 2;
      g.diplomacy.relations.west += 6;
    },
  },

  // ---- INTERNAL AFFAIRS ----
  {
    id: "police_funding",
    category: CATEGORIES.INTERNAL,
    title: "Increase Police Funding",
    desc: "Increase security, slight happiness cost.",
    apply: (g) => {
      g.stats.money -= 110;
      g.stats.security += 8;
      g.stats.happiness -= 2;
    },
  },
  {
    id: "anti_corruption",
    category: CATEGORIES.INTERNAL,
    title: "Anti-Corruption Agency",
    desc: "Reduce corruption. Elites may resist.",
    needsVote: true,
    apply: (g) => {
      g.stats.money -= 90;
      g.stats.corruption -= 10;
      g.stats.stability -= 2;
      g.stats.happiness += 2;
    },
  },

  // ---- HEALTH ----
  {
    id: "healthcare",
    category: CATEGORIES.HEALTH,
    title: "Healthcare Investment",
    desc: "Boost happiness and stability. Costs money.",
    apply: (g) => {
      g.stats.money -= 180;
      g.stats.happiness += 6;
      g.stats.stability += 2;
    },
  },

  // ---- SPORTS ----
  {
    id: "sports_program",
    category: CATEGORIES.SPORTS,
    title: "National Sports Program",
    desc: "Improves happiness and unity.",
    apply: (g) => {
      g.stats.money -= 70;
      g.stats.happiness += 4;
      g.stats.stability += 1;
    },
  },

  // ---- MIGRATION ----
  {
    id: "border_security",
    category: CATEGORIES.MIGRATION,
    title: "Strengthen Borders",
    desc: "Higher security, may reduce happiness.",
    apply: (g) => {
      g.stats.money -= 100;
      g.stats.security += 6;
      g.stats.happiness -= 1;
    },
  },
  {
    id: "integration_program",
    category: CATEGORIES.MIGRATION,
    title: "Integration Program",
    desc: "Improves jobs and stability.",
    apply: (g) => {
      g.stats.money -= 90;
      g.stats.jobs += 2;
      g.stats.stability += 2;
    },
  },

  // ---- LAW ----
  {
    id: "justice_reform",
    category: CATEGORIES.LAW,
    title: "Justice Reform",
    desc: "Improves stability, reduces corruption.",
    needsVote: true,
    apply: (g) => {
      g.stats.money -= 120;
      g.stats.stability += 4;
      g.stats.corruption -= 4;
    },
  },

  // ---- EDUCATION ----
  {
    id: "education_reform",
    category: CATEGORIES.EDUCATION,
    title: "Education Reform",
    desc: "Long-term jobs and happiness boost.",
    apply: (g) => {
      g.stats.money -= 140;
      g.stats.jobs += 2;
      g.stats.happiness += 3;
    },
  },

  // ---- ADMINISTRATION ----
  {
    id: "digital_government",
    category: CATEGORIES.ADMIN,
    title: "Digital Government",
    desc: "Improves efficiency, reduces corruption.",
    apply: (g) => {
      g.stats.money -= 110;
      g.stats.corruption -= 5;
      g.stats.stability += 1;
    },
  },
];
