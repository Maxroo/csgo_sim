/* =========================================================
   teams.js — team templates and team stat helpers.
========================================================= */

const TEAM_STAT_KEYS = ["firepower", "tactics", "entry", "clutch", "teamwork"];

const TEAM_STAT_LABELS = {
  firepower: "Firepower",
  tactics: "Tactics",
  entry: "Entry",
  clutch: "Clutch",
  teamwork: "Teamwork",
};

const TEAM_ROLE_WEIGHTS = {
  entry: { firepower: 0.28, tactics: 0.08, entry: 0.30, clutch: 0.08, teamwork: 0.06 },
  awp: { firepower: 0.30, tactics: 0.10, entry: 0.05, clutch: 0.18, teamwork: 0.05 },
  igl: { firepower: 0.06, tactics: 0.30, entry: 0.05, clutch: 0.10, teamwork: 0.22 },
  support: { firepower: 0.05, tactics: 0.16, entry: 0.05, clutch: 0.10, teamwork: 0.30 },
  lurk: { firepower: 0.12, tactics: 0.16, entry: 0.22, clutch: 0.14, teamwork: 0.05 },
};

const TEAM_ORGS = [
  { name: "Team Vitality", region: "Europe", style: "Patient control with elite closing power", baseStats: { firepower: 92, tactics: 84, entry: 88, clutch: 90, teamwork: 87 } },
  { name: "Natus Vincere", region: "Europe", style: "Explosive openings and sharp mid-round calls", baseStats: { firepower: 85, tactics: 88, entry: 84, clutch: 85, teamwork: 89 } },
  { name: "FaZe Clan", region: "Europe", style: "Star power with aggressive tempo swings", baseStats: { firepower: 82, tactics: 76, entry: 79, clutch: 83, teamwork: 82} },
  { name: "G2 Esports", region: "Europe", style: "Fast tempo and confident duels", baseStats: { firepower: 85, tactics: 85, entry: 85, clutch: 83, teamwork: 82 } },
  { name: "MOUZ", region: "Europe", style: "Disciplined trading and structured rounds", baseStats: { firepower: 84, tactics: 86, entry: 82, clutch: 83, teamwork: 86 } },
  { name: "Team Spirit", region: "Europe", style: "Young pace and fearless decisions", baseStats: { firepower: 88, tactics: 80, entry: 89, clutch: 82, teamwork: 81 } },
  { name: "Astralis", region: "Europe", style: "System CS with brutal team discipline", baseStats: { firepower: 82, tactics: 85, entry: 78, clutch: 83, teamwork: 84 } },
  { name: "Heroic", region: "Europe", style: "Clean executes and dependable utility", baseStats: { firepower: 76, tactics: 80, entry: 75, clutch: 74, teamwork: 82 } },
  { name: "Liquid", region: "North America", style: "Measured space-taking and strong support play", baseStats: { firepower: 81, tactics: 79, entry: 78, clutch: 82, teamwork: 77 } },
  { name: "NRG", region: "North America", style: "Sharp trading with make play based on map control", baseStats: { firepower: 77, tactics: 73, entry: 74, clutch: 76, teamwork: 75 } },
  { name: "FURIA", region: "South America", style: "High-speed fights and fearless pushes", baseStats: { firepower: 85, tactics: 83, entry: 83, clutch: 85, teamwork: 83 } },
  { name: "MIBR", region: "South America", style: "Scrappy brawling with momentum swings", baseStats: { firepower: 82, tactics: 76, entry: 83, clutch: 77, teamwork: 79 } },
  { name: "ENCE", region: "Europe", style: "Measured executes with dependable structure", baseStats: { firepower: 72, tactics: 74, entry: 70, clutch: 72, teamwork: 71 } },
  { name: "BIG", region: "Europe", style: "Set-piece utility and methodical pacing", baseStats: { firepower: 77, tactics: 83, entry: 76, clutch: 79, teamwork: 81 } },
  { name: "Virtus.pro", region: "Europe", style: "Slow pressure and punishing late rounds", baseStats: { firepower: 73, tactics: 75, entry: 72, clutch: 70, teamwork: 69 } },
  { name: "The MongolZ", region: "Asia", style: "Wild tempo with fearless dueling", baseStats: { firepower: 83, tactics: 84, entry: 82, clutch: 82, teamwork: 79 } },
  { name: "paiN Gaming", region: "South America", style: "Relentless fights and direct site pressure", baseStats: { firepower: 80, tactics: 76, entry: 81, clutch: 73, teamwork: 75 } },
  { name: "GamerLegion", region: "Europe", style: "Adaptable game plans with clean utility", baseStats: { firepower: 79, tactics: 84, entry: 81, clutch: 80, teamwork: 84 } },
  { name: "BetBoom", region: "Europe", style: "Crisp utility and strong prep work", baseStats: { firepower: 81, tactics: 82, entry: 84, clutch: 80, teamwork: 81 } },
  { name: "3DMAX", region: "Europe", style: "Loose map control and sudden bursts", baseStats: { firepower: 79, tactics: 80, entry: 77, clutch: 78, teamwork: 79 } },
  { name: "SAW", region: "Europe", style: "Fundamentals first and stubborn defense", baseStats: { firepower: 77, tactics: 79, entry: 78, clutch: 74, teamwork: 76 } },
  { name: "Falcons", region: "Europe", style: "Star-driven aggression with deep prep", baseStats: { firepower: 90, tactics: 82, entry: 87, clutch: 85, teamwork: 83 } },
  { name: "FlyQuest", region: "Asia", style: "Clean spacing and disciplined executes", baseStats: { firepower: 75, tactics: 73, entry: 72, clutch: 69, teamwork: 75 } },
  { name: "Aurora", region: "Europe", style: "Sharp mechanics with confident swing rounds", baseStats: { firepower: 86, tactics: 79, entry: 84, clutch: 83, teamwork: 82 } },
  { name: "fnatic", region: "Europe", style: "Legacy fragging with flexible structure", baseStats: { firepower: 71, tactics: 73, entry: 69, clutch: 72, teamwork: 82 } },
  { name: "Ninjas in Pyjamas", region: "Europe", style: "Patient utility and late-round timing", baseStats: { firepower: 77, tactics: 76, entry: 73, clutch: 77, teamwork: 79 } },
  { name: "OG", region: "Europe", style: "Loose ideas with creative playmaking", baseStats: { firepower: 76, tactics: 80, entry: 74, clutch: 76, teamwork: 82 } },
  { name: "Tyloo", region: "Asia", style: "Slow-paced gameplay with strategic depth", baseStats: { firepower: 82, tactics: 83, entry: 77, clutch: 76, teamwork: 78 } },
  { name: "Lynn Vision Gaming", region: "Asia", style: "Focus on fundamentals and make plays based on firepower", baseStats: { firepower:80, tactics: 74, entry: 76, clutch: 74, teamwork: 76 } },
  { name: "100 Thieves", region: "North America", style: "Based on experience and adaptability", baseStats: { firepower: 79, tactics: 83, entry: 78, clutch: 81, teamwork: 80 } },
];

function clampTeamStat(value) {
  return Math.max(0, Math.min(100, value));
}

function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function teamStatFromPlayerStat(player, teamStatKey) {
  const mapping = {
    firepower: "aim",
    tactics: "gamesense",
    entry: "reflexes",
    clutch: "mental",
    teamwork: "teamwork",
  };
  return player.stats[mapping[teamStatKey]];
}

function roleWeights(roleId) {
  return TEAM_ROLE_WEIGHTS[roleId] || TEAM_ROLE_WEIGHTS.entry;
}

function teamFitScore(template, player) {
  const source = template.baseStats ? template.baseStats : template;
  const weights = roleWeights(player.archetype);
  let score = 50 + overall(player.stats) * 0.08;
  TEAM_STAT_KEYS.forEach(key => {
    score += source[key] * (weights[key] || 0.06);
    score += teamStatFromPlayerStat(player, key) * 0.02;
  });
  return score;
}

function buildTeamStats(baseStats, player, roleId) {
  const weights = roleWeights(roleId);
  const stats = {};
  const roleBonus = {};

  TEAM_STAT_KEYS.forEach(key => {
    const playerStat = teamStatFromPlayerStat(player, key);
    const influence = Math.round((playerStat - 40) * (weights[key] || 0.06));
    const randomDrift = randBetween(-2, 3);
    roleBonus[key] = influence;
    stats[key] = clampTeamStat(baseStats[key] + influence + randomDrift);
  });

  return { stats, roleBonus };
}

function buildSignedTeam(template, player) {
  const roleId = player.archetype;
  const baseStats = { ...template.baseStats };
  const built = buildTeamStats(baseStats, player, roleId);
  return {
    name: template.name,
    region: template.region,
    style: template.style,
    roleId,
    baseStats,
    stats: built.stats,
    roleBonus: built.roleBonus,
    fit: Math.round(teamFitScore(template, player)),
  };
}

function refreshSignedTeam(team, player) {
  const built = buildTeamStats(team.baseStats, player, team.roleId || player.archetype);
  return {
    ...team,
    stats: built.stats,
    roleBonus: built.roleBonus,
    fit: Math.round(teamFitScore(team.baseStats, player)),
  };
}

function pickWeightedTeams(pool, count, player, excludedNames = []) {
  const remaining = pool.filter(team => !excludedNames.includes(team.name));
  const picks = [];

  while (picks.length < count && remaining.length > 0) {
    const weights = remaining.map(team => Math.max(1, teamFitScore(team, player)));
    const total = weights.reduce((sum, value) => sum + value, 0);
    let roll = Math.random() * total;
    let index = 0;

    for (let i = 0; i < remaining.length; i += 1) {
      roll -= weights[i];
      if (roll <= 0) {
        index = i;
        break;
      }
    }

    picks.push(remaining[index]);
    remaining.splice(index, 1);
  }

  return picks;
}

function teamInfluenceLines(team) {
  return TEAM_STAT_KEYS.map(key => {
    const bonus = team.roleBonus?.[key] || 0;
    return `<span class="pill ${bonus >= 0 ? "up" : "down"}">${TEAM_STAT_LABELS[key]} ${bonus >= 0 ? "+" : ""}${bonus}</span>`;
  }).join("");
}
