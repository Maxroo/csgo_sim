/* =========================================================
   tournaments.js — tournament templates and tournament helpers.
========================================================= */

const TOURNAMENTS = [
  {
    id: "faceit_open",
    name: "FACEIT Open Circuit",
    rounds: 4,
    prizePool: [12000, 24000, 48000, 96000],
  },
  {
    id: "faceit_open",
    name: "FACEIT Open Circuit",
    rounds: 4,
    prizePool: [12000, 24000, 48000, 96000],
  },
];

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function prizeForRound(roundIndex, tournament = TOURNAMENTS[0]) {
  return tournament.prizePool[roundIndex] || 0;
}

function teamScore(stats) {
  return Math.round(
    stats.firepower * 1.35 +
    stats.tactics * 1.15 +
    stats.entry * 1.10 +
    stats.clutch * 1.20 +
    stats.teamwork * 1.20
  );
}

function buildOpponentProfile(template, roundIndex) {
  const stats = {};
  TEAM_STAT_KEYS.forEach(key => {
    const growth = roundIndex * 3;
    stats[key] = clampTeamStat(template.baseStats[key] + growth + randBetween(-2, 4));
  });

  return {
    name: template.name,
    region: template.region,
    style: template.style,
    baseStats: { ...template.baseStats },
    stats,
  };
}

function buildTournament(team, template = TOURNAMENTS[0]) {
  const pool = shuffle(TEAM_ORGS.filter(org => org.name !== team.name));
  const opponents = pool.slice(0, template.rounds).map((org, roundIndex) => buildOpponentProfile(org, roundIndex));

  return {
    id: template.id,
    name: template.name,
    round: 0,
    totalRounds: template.rounds,
    prizePool: [...template.prizePool],
    wins: 0,
    losses: 0,
    prize: 0,
    opponents,
    completed: false,
    champion: false,
    lastMatch: null,
  };
}

function currentTournamentOpponent(tournament) {
  if (!tournament || tournament.completed) return null;
  return tournament.opponents[tournament.round] || null;
}

function projectedWinChance(team, opponent, tournamentBuff = 0) {
  const modifiedTeamScore = teamScore(team.stats) + tournamentBuff;
  const edge = modifiedTeamScore - teamScore(opponent.stats);
  return Math.max(12, Math.min(88, Math.round(50 + edge * 0.33)));
}

function simulateTournamentMatch(team, tournament, playerStats, tournamentBuff = 0) {
  const opponent = currentTournamentOpponent(tournament);
  if (!opponent) return null;

  // Apply the event buff to the player's team power
  const playerPower = teamScore(team.stats) + tournamentBuff;
  const enemyPower = teamScore(opponent.stats);
  const roundIndex = tournament.round;
  const swing = randBetween(-18, 18);
  const roll = playerPower - enemyPower + swing;
  const win = roll >= 0;
 const margin = Math.max(13, Math.min(16, Math.round(Math.abs(roll) / 5) + randBetween(0, 2)));

  const perfSwing = (win ? margin * 0.4 : -margin * 0.4);

  // Simulate KDA based on player stats and win margin
  const rounds = Math.max(13, 26 - margin);

  // Now it can safely use perfSwing
  const kills = Math.max(1, Math.round(12 + (playerStats.aim / 10) + perfSwing + (Math.random() * 8 - 4)));
  
  // Cap deaths at total rounds (you can't die 20 times in a 15-round match)
  const rawDeaths = Math.round(18 - (playerStats.gamesense / 10) - perfSwing + (Math.random() * 6 - 3));
  const deaths = Math.max(1, Math.min(rounds, rawDeaths)); 
  
  const assists = Math.max(1, Math.round(2 + (playerStats.teamwork / 10) + (Math.random() * 4 - 2)));

  // HLTV 1.0 Rating Approximation
  const kpr = kills / rounds;                // Kills Per Round
  const spr = (rounds - deaths) / rounds;    // Survival Per Round
  const apr = assists / rounds;              // Assists Per Round

  // divide each stat by the historical pro average (KPR: ~0.679, SPR: ~0.317, APR: ~0.14)
  // Averaging them together gives us a clean 1.00 baseline rating.
  const baseRating = ((kpr / 0.679) + (spr / 0.317) + (apr / 0.14)) / 3;
  const rating = baseRating.toFixed(2);

  return {
    roundIndex,
    roundLabel: `R${roundIndex + 1}`,
    opponent,
    win,
    margin,
    playerPower,
    enemyPower,
    kda: { kills, deaths, assists, rating: parseFloat(rating) }
  };
}

function advanceTournament(tournament, result) {
  tournament.lastMatch = result;

  if (result.win) {
    tournament.wins += 1;
    tournament.prize += prizeForRound(result.roundIndex, tournament);
    tournament.round += 1;
    if (tournament.round >= tournament.totalRounds) {
      tournament.completed = true;
      tournament.champion = true;
    }
  } else {
    tournament.losses += 1;
    tournament.completed = true;
    tournament.champion = false;
  }

  return tournament;
}

function tournamentMatchSummary(result) {
  const baseText = result.win
    ? `You beat ${result.opponent.name} by ${result.margin} rounds. Team rating ${result.playerPower} over ${result.enemyPower}.`
    : `${result.opponent.name} edge you out by ${result.margin} rounds. Team rating ${result.playerPower} under ${result.enemyPower}.`;
  
  return baseText + ` You dropped ${result.kda.kills}K/${result.kda.deaths}D/${result.kda.assists}A (${result.kda.rating} Rating).`;
}
