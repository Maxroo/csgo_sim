/* =========================================================
   app.js — career logic. Depends on data.js, teams.js, tournaments.js, and data/events.json.
========================================================= */

let EVENTS = [];
let state = null;

async function loadEvents() {
  // Use the currentLang variable (from i18n.js) to load either events_en.json or events_zh.json
  const res = await fetch(`data/events_${currentLang}.json`);
  if (!res.ok) throw new Error(`Could not load data/events_${currentLang}.json (status ${res.status})`);
  EVENTS = await res.json();
}

function newState() {
  return {
    name: "",
    country: "US",
    archetype: "entry",
    age: 16,
    month: 1,
    stats: { aim: 0, gamesense: 0, reflexes: 0, teamwork: 0, mental: 0 },
    money: 0,
    fame: 0,
    log: [],
    seenEvents: new Set(),
    currentEvent: null,
    pendingResult: null,
    mode: "career",
    team: null,
    contract: null,
    tournament: null,
    tournamentBuff: 0,
    lastOfferYear: 1,
    lastTournamentYear: 0,
    tournamentsThisYear: 0,
    maxTournamentsPerYear: 3, 
    yearlyPerformance: {}, 
    eventsPerYear: 6,
    lastCareerReport: null,
    ended: false,
  };
}

function clamp(v) {
  return Math.max(0, Math.min(100, v));
}

function monthsPerEvent() {
  return Math.max(1, Math.floor(12 / Math.max(1, state.eventsPerYear)));
}

function currentYear() {
  return Math.floor((state.month - 1) / 12) + 1;
}

function currentMonth() {
  return ((state.month - 1) % 12) + 1;
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(screen => screen.classList.remove("active"));
  document.getElementById(`screen-${id}`).classList.add("active");
}

function addLog(text) {
  state.log.push({ year: currentYear(), mo: currentMonth(), text });
}

function renderLog() {
  const logList = document.getElementById("logList");
  logList.innerHTML = "";
  state.log.slice(-40).forEach(entry => {
    const item = document.createElement("div");
    item.className = "log-item";
    item.innerHTML = `<div class="log-time">Y${entry.year}·M${entry.mo}</div><div class="log-text">${entry.text}</div>`;
    logList.appendChild(item);
  });
}

function renderHud() {
  const tier = tierFor(overall(state.stats));
  document.getElementById("hudName").textContent = `${flag(state.country)} ${state.name}`;
  document.getElementById("hudTier").textContent = state.team ? state.team.name : tier.name;
  document.getElementById("hudAge").textContent = `${state.age}`;
  document.getElementById("hudMoney").innerHTML = `$${state.money.toLocaleString()}`;
  document.getElementById("hudFame").textContent = `${state.fame}`;
  document.getElementById("hudTime").textContent = `Y${currentYear()} · M${currentMonth()}`;
}

function renderPlayerStats() {
  const playerStatsList = document.getElementById("playerStatsList");
  if (!playerStatsList) return;
  playerStatsList.innerHTML = "";

  const roleWeights = TEAM_ROLE_WEIGHTS[state.archetype] || TEAM_ROLE_WEIGHTS.entry;
  const influencePreview = document.createElement("div");
  influencePreview.className = "team-summary";
  influencePreview.innerHTML = `<div class="team-name">${ARCHETYPES.find(a => a.id === state.archetype)?.name || t("ui.playerRole")}</div>`;
  playerStatsList.appendChild(influencePreview);

  Object.keys(STAT_LABELS).forEach(key => {
    const value = clamp(state.stats[key]);
    const cls = key === "mental" ? "mental" : key === "aim" || key === "reflexes" ? "orange" : "";
    const row = document.createElement("div");
    row.className = "stat-row";
    // We dynamically call t("stat." + key) here so it always translates on the fly!
    row.innerHTML = `
      <div class="stat-top"><span class="sname">${t("stat." + key)}</span><span class="sval">${value}</span></div>
      <div class="bar-track"><div class="bar-fill ${cls}" style="width:${value}%"></div></div>
    `;
    playerStatsList.appendChild(row);
  });

  if (Object.keys(state.yearlyPerformance).length > 0) {
    const perfHeader = document.createElement("div");
    perfHeader.className = "team-summary";
    perfHeader.innerHTML = `<div class="team-name" style="margin-top:16px;">${t("ui.yearlyAverages")}</div>`;
    playerStatsList.appendChild(perfHeader);

    Object.keys(state.yearlyPerformance).sort((a, b) => b - a).forEach(year => {
      const yp = state.yearlyPerformance[year];
      if (yp.matches > 0) {
        const avgK = (yp.kills / yp.matches).toFixed(1);
        const avgD = (yp.deaths / yp.matches).toFixed(1);
        const avgA = (yp.assists / yp.matches).toFixed(1);
        const avgR = (yp.ratingSum / yp.matches).toFixed(2);
        
        const row = document.createElement("div");
        row.className = "stat-row";
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.width = "100%";
        row.innerHTML = `
          <span class="sname">${t("ui.year", { y: year })}</span>
          <span class="sval">${avgR} RTG (${avgK} / ${avgD} / ${avgA})</span>
        `;
        playerStatsList.appendChild(row);
      }
    });
  }
}

function renderTeamStats() {
  const teamStatsPanel = document.getElementById("teamStatsPanel");
  const teamStatsList = document.getElementById("teamStatsList");
  if (!teamStatsPanel || !teamStatsList) return;

  teamStatsPanel.style.display = "block";
  teamStatsList.innerHTML = "";

  if (!state.team) {
    const intro = document.createElement("div");
    intro.className = "team-summary";
    intro.innerHTML = `<div class="team-name">${t("ui.noTeam")}</div>`;
    teamStatsList.appendChild(intro);

    TEAM_STAT_KEYS.forEach(key => {
      const row = document.createElement("div");
      row.className = "stat-row";
      // Assuming you added keys like "teamStat.firepower" to your i18n.js
      row.innerHTML = `
        <div class="stat-top"><span class="sname">${t("teamStat." + key) || TEAM_STAT_LABELS[key]}</span><span class="sval">—</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:0%"></div></div>
      `;
      teamStatsList.appendChild(row);
    });
    return;
  }

  const intro = document.createElement("div");
  intro.className = "team-summary";
  intro.innerHTML = `
    <div class="team-name">${state.team.name}</div>
    <div class="team-meta">${state.team.region} · ${state.team.style}</div>
    <div class="team-meta muted">${t("ui.contractedIn", { y: state.contract.signedAtYear, m: state.contract.signedAtMonth })}</div>
    <div class="btn-row" style="justify-content:flex-start; margin-top:14px;"></div>
  `;
  teamStatsList.appendChild(intro);

  TEAM_STAT_KEYS.forEach(key => {
    const value = clamp(state.team.stats[key]);
    const cls = key === "clutch" ? "mental" : key === "firepower" || key === "entry" ? "orange" : "";
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <div class="stat-top"><span class="sname">${TEAM_STAT_LABELS[key]}</span><span class="sval">${value}</span></div>
      <div class="bar-track"><div class="bar-fill ${cls}" style="width:${value}%"></div></div>
    `;
    teamStatsList.appendChild(row);
  });
}

function renderCareerHub(card) {
  const statusText = state.team 
    ? t("ui.careerStatusSigned", { team: state.team.name }) 
    : t("ui.careerStatusUnsigned");

  card.innerHTML = `
    <div class="event-kicker">${t("ui.careerHub")}</div>
    <div class="event-title">${t("ui.faceitGrind")}</div>
    <div class="event-desc">${t("ui.careerDesc")}</div>
    <div class="result-box">
      <p>${statusText}</p>
      <div class="effect-pills">
        <span class="pill up">${t("ui.careerMode")}</span>
        <span class="pill up">${t("ui.teamOffers")}</span>
      </div>
    </div>
  `;
}

function renderEventCard(card, ev) {
  card.innerHTML = `
    <div class="event-kicker">${ev.kicker}</div>
    <div class="event-title">${ev.title}</div>
    <div class="event-desc">${ev.desc}</div>
    <div class="choices" id="choicesWrap"></div>
  `;

  const wrap = document.getElementById("choicesWrap");
  ev.choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.innerHTML = `
      <span class="choice-text">
        <strong>${choice.label}</strong>
        ${choice.subtitle ? `<small>${choice.subtitle}</small>` : ""}
      </span>
      <span class="arrow">→</span>
    `;
    btn.onclick = () => resolveChoice(ev, choice);
    wrap.appendChild(btn);
  });
}

function renderResultCard(card, result) {
  card.innerHTML = `
    <div class="event-kicker">${result.event.kicker}</div>
    <div class="event-title">${result.event.title}</div>
    <div class="result-box">
      <p>${result.text}</p>
      <div class="effect-pills">${result.pills.join("")}</div>
      <div class="choices">
        <button class="choice-btn" id="continueBtn">
          <span class="choice-text"><strong>Continue</strong><small>${result.continueLabel}</small></span>
          <span class="arrow">→</span>
        </button>
      </div>
    </div>
  `;

  const enterTournamentCardBtn = document.getElementById("enterTournamentCardBtn");
  if (enterTournamentCardBtn) {
    enterTournamentCardBtn.onclick = enterTournamentMode;
  }
  document.getElementById("continueBtn").onclick = continueCareer;
}

function renderTournamentCard(card) {
  const tournament = state.tournament;
  if (!tournament) {
    card.innerHTML = `
      <div class="event-kicker">Tournament Mode</div>
      <div class="event-title">Locked</div>
      <div class="event-desc">Sign with a team first to unlock tournament mode.</div>
    `;
    return;
  }

  if (tournament.lastMatch) {
    const result = tournament.lastMatch;
    const title = result.win ? "Round secured" : "Run cut short";
    const summary = result.win
      ? `You beat ${result.opponent.name} by ${result.margin} rounds. Team rating ${result.playerPower} over ${result.enemyPower}.`
      : `${result.opponent.name} edge you out by ${result.margin} rounds. Team rating ${result.playerPower} under ${result.enemyPower}.`;
    const continueLabel = tournament.completed ? "Return to career" : "Next opponent";

    card.innerHTML = `
      <div class="event-kicker">Tournament Result</div>
      <div class="event-title">${title}</div>
      <div class="result-box">
        <p>${summary}</p>
        <div class="effect-pills">
          <span class="pill ${result.win ? "up" : "down"}">${result.win ? "Advance" : "Eliminated"}</span>
          ${result.win ? `<span class="pill up">Prize +$${prizeForRound(result.roundIndex).toLocaleString()}</span>` : ""}
        </div>
        <button class="btn" id="continueTournamentBtn">${continueLabel} →</button>
      </div>
    `;
    document.getElementById("continueTournamentBtn").onclick = continueTournament;
    return;
  }

  const opponent = currentTournamentOpponent(tournament);
  if (!opponent) {
    card.innerHTML = `
      <div class="event-kicker">Tournament Mode</div>
      <div class="event-title">Bracket complete</div>
      <div class="event-desc">The current tournament has no opponent left in the queue.</div>
    `;
    return;
  }

  const teamPower = teamScore(state.team.stats);
  const enemyPower = teamScore(opponent.stats);
  const chance = projectedWinChance(state.team, opponent);

  card.innerHTML = `
    <div class="event-kicker">Tournament Mode</div>
    <div class="event-title">${tournament.name}</div>
    <div class="event-desc">Your signed team is ${state.team.name}. Next opponent: ${opponent.name} from ${opponent.region}. Tournament mode is lightweight on purpose: team, opponent, and bracket state only.</div>
    <div class="result-box">
      <p>Team rating ${teamPower} vs ${enemyPower}. Projected win chance ${chance}%.</p>
      <div class="effect-pills">
        <span class="pill up">${state.team.name}</span>
        <span class="pill down">${opponent.name}</span>
      </div>
      <button class="btn" id="playMatchBtn">Play next match →</button>
    </div>
  `;
  document.getElementById("playMatchBtn").onclick = playTournamentMatch;
}

function buildTournamentInviteEvent() {
  // Pick a random tournament from TOURNAMENTS
  const template = TOURNAMENTS[Math.floor(Math.random() * TOURNAMENTS.length)];
  
  return {
    id: `tournament_invite_${currentYear()}_${state.tournamentsThisYear}`,
    kicker: "Tournament Invitation",
    title: template.name,
    desc: `Your team, ${state.team.name}, has been invited to compete in the ${template.name}.`,
    choices: [
      {
        label: "Accept Invitation",
        subtitle: `Compete for the $${template.prizePool[template.prizePool.length-1].toLocaleString()} grand prize`,
        isTournamentEntry: true,
        template: template
      },
      {
        label: "Decline",
        subtitle: "Focus on practice",
        result: `You skipped the ${template.name} to focus on training.`,
        effects: { mental: 2, teamwork: 1 }
      }
    ],
  };
}

function renderMainPanel() {
  const card = document.getElementById("eventCard");
  
  // Events and results now render on top, even if we are in a tournament
  if (state.pendingResult) {
    renderResultCard(card, state.pendingResult);
    return;
  }
  if (state.currentEvent) {
    renderEventCard(card, state.currentEvent);
    return;
  }
  
  // Fall back to tournament bracket or career hub
  if (state.mode === "tournament") {
    renderTournamentCard(card);
    return;
  }
  renderCareerHub(card);
}

function renderGame() {
  renderHud();
  renderPlayerStats();
  renderTeamStats();
  renderLog();
  renderMainPanel();
}

function teamOfferPreviewText(team) {
  const statsText = TEAM_STAT_KEYS.map(key => `${TEAM_STAT_LABELS[key]} ${team.stats[key]}`).join(" · ");
  return `${team.region} · ${team.style} · ${statsText}`;
}

function buildYearlyOfferEvent() {
  const availableTeams = TEAM_ORGS.filter(team => !state.team || team.name !== state.team.name);
  const templates = pickWeightedTeams(availableTeams, 3, state, state.team ? [state.team.name] : []);
  const offers = templates.map(template => buildSignedTeam(template, state));

  return {
    id: `yearly_offer_${currentYear()}`,
    once: true,
    kicker: `Year ${currentYear()}`,
    title: "Three orgs want you",
    desc: "A yearly contract window opens. Three orgs contact you, and you choose whether to sign or keep grinding FACEIT.",
    choices: [
      ...offers.map(profile => ({
        label: `Join ${profile.name}`,
        subtitle: teamOfferPreviewText(profile),
        offer: profile,
        result: `You sign with ${profile.name}.`,
        effects: { money: 5000, fame: 6 },
      })),
      {
        label: "Stay on FACEIT",
        subtitle: "Keep grinding until the next offer window",
        result: "You stay unsigned and keep building your name.",
        effects: { mental: 2, teamwork: 1 },
      },
    ],
  };
}

function eligibleEvents() {
  const score = overall(state.stats);
  const idx = tierIndex(score);
  return EVENTS.filter(event => {
    // NEW: Prevent tournament events from showing up in normal career flow
    if (event.category === "tournament_only") return false;
    
    if (event.once && state.seenEvents.has(event.id)) return false;
    if (event.minAge && state.age < event.minAge) return false;
    if (event.maxAge && state.age > event.maxAge) return false;
    if (event.minTier !== undefined && idx < event.minTier) return false;
    if (event.maxTier !== undefined && idx > event.maxTier) return false;
    return true;
  });
}

function shouldTriggerOffer() {
  return !state.team && currentYear() > state.lastOfferYear;
}

function nextEvent() {
  state.month += monthsPerEvent();
  state.age = 16 + Math.floor((state.month - 1) / 12);

  if (checkEndConditions()) return;

  if (currentYear() > state.lastTournamentYear) {
    state.tournamentsThisYear = 0;
    state.lastTournamentYear = currentYear();
  }

  if (shouldTriggerOffer()) {
    state.lastOfferYear = currentYear();
    state.currentEvent = buildYearlyOfferEvent();
    state.pendingResult = null;
    renderGame();
    return;
  }

  // 35% chance to trigger a tournament if signed and under the limit
  if (state.team && state.tournamentsThisYear < state.maxTournamentsPerYear && Math.random() < 0.35) {
    state.currentEvent = buildTournamentInviteEvent();
    state.pendingResult = null;
    renderGame();
    return;
  }

  const pool = eligibleEvents();
  
  if (pool.length > 0) {
    state.currentEvent = pool[Math.floor(Math.random() * pool.length)];
  } else {
    const safeFallback = EVENTS.filter(e => e.category !== "tournament_only");
    state.currentEvent = safeFallback[Math.floor(Math.random() * safeFallback.length)];
  }

  state.pendingResult = null;
  if (state.currentEvent.once) state.seenEvents.add(state.currentEvent.id);
  renderGame();
}

function signTeam(profile) {
  state.team = refreshSignedTeam(profile, state);
  state.contract = {
    org: profile.name,
    signedAtYear: currentYear(),
    signedAtMonth: currentMonth(),
  };
  state.lastOfferYear = currentYear();
  addLog(`You sign with ${profile.name}.`);
}

function applyChoiceEffects(outcome) {
  const effects = outcome.effects || {};
  const pills = [];

  Object.keys(effects).forEach(key => {
    if (key === "money" || key === "fame" || key === "tournamentBuff") return;
    if (!Object.prototype.hasOwnProperty.call(state.stats, key)) return;
    const delta = effects[key];
    state.stats[key] = clamp(state.stats[key] + delta);
    if (delta !== 0) {
      pills.push(`<span class="pill ${delta > 0 ? "up" : "down"}">${STAT_LABELS[key] || key} ${delta > 0 ? "+" : ""}${delta}</span>`);
    }
  });

  if (effects.tournamentBuff) {
    state.tournamentBuff += effects.tournamentBuff;
    pills.push(`<span class="pill ${effects.tournamentBuff > 0 ? "up" : "down"}">Tournament Edge ${effects.tournamentBuff > 0 ? "+" : ""}${effects.tournamentBuff}</span>`);
  }

  const moneyDelta = outcome.money ?? effects.money ?? 0;
  const fameDelta = outcome.fame ?? effects.fame ?? 0;

  if (moneyDelta) {
    state.money += moneyDelta;
    pills.push(`<span class="pill ${moneyDelta > 0 ? "up" : "down"}">$${moneyDelta > 0 ? "+" : ""}${moneyDelta.toLocaleString()}</span>`);
  }

  if (fameDelta) {
    state.fame = Math.max(0, state.fame + fameDelta);
    pills.push(`<span class="pill ${fameDelta > 0 ? "up" : "down"}">Fame ${fameDelta > 0 ? "+" : ""}${fameDelta}</span>`);
  }

  if (state.team) {
    state.team = refreshSignedTeam(state.team, state);
  }

  return pills;
}

function resolveChoice(ev, choice) {
  let outcome = choice; 
  let isSuccess = true;

  if (choice.successChance !== undefined) {
    let chance = choice.successChance;
    
    // NEW: Apply stat-based bonuses to the success chance
    if (choice.successStat && state.stats[choice.successStat] !== undefined) {
      // Default to 0.005 (100 stat = +50% chance) if scale isn't defined
      const scale = choice.successStatScale !== undefined ? choice.successStatScale : 0.005;
      const statBonus = state.stats[choice.successStat] * scale;
      chance += statBonus;
    }
    
    // Cap the chance between 5% and 95% so nothing is ever guaranteed
    chance = Math.max(0.05, Math.min(0.95, chance));
    
    isSuccess = Math.random() < chance;
    outcome = isSuccess ? choice.success : choice.failure;
  }

  // Accept invite and enter tournament directly
  if (choice.isTournamentEntry) {
    state.tournamentsThisYear += 1;
    enterTournamentMode(choice.template); 
    return; 
  }

  const pills = applyChoiceEffects(outcome);

  if (choice.offer) { 
    signTeam(choice.offer);
    pills.push(`<span class="pill up">${choice.offer.name} signed</span>`);
  }

  const flavorResult = outcome.result || choice.result;
  addLog(`<b>${ev.title}:</b> ${choice.label}. ${flavorResult}`);
  
  state.pendingResult = {
    event: ev,
    text: flavorResult,
    pills,
    continueLabel: state.queuedMatch ? "See match result" : (state.team ? "Resume career" : "Next event"),
  };
  renderGame();
}

function continueCareer() {
  state.pendingResult = null;
  state.currentEvent = null;

  // If we just finished a mid-match event, calculate the match!
  if (state.queuedMatch) {
    state.queuedMatch = false;
    resolveTournamentMatch();
    return;
  }

  // NEW: Safeguard against double-clicks! 
  // Never advance the career timeline if we are in the middle of a tournament bracket.
  if (state.mode === "tournament") {
    renderGame();
    return;
  }

  nextEvent();
}

function enterTournamentMode(template) {
  if (!state.team || state.mode === "tournament") return;
  state.mode = "tournament";
  state.currentEvent = null;
  state.pendingResult = null;
  state.tournament = buildTournament(state.team, template);
  addLog(`You entered ${state.tournament.name}.`);
  renderGame();
}

function playTournamentMatch() {
  if (!state.tournament || state.tournament.completed) return;

  // Look for mid-tournament events
  const tourneyEvents = EVENTS.filter(e => e.category === "tournament_only");
  
  // If we have tournament events, trigger one before the match
  // Added a 30% chance so events don't happen every single round
  if (tourneyEvents.length > 0 && Math.random() < 0.3) {
    state.currentEvent = tourneyEvents[Math.floor(Math.random() * tourneyEvents.length)];
    state.queuedMatch = true; 
    state.pendingResult = null;
    renderGame();
    return;
  }

  // Fallback: If no tournament events are in JSON yet, just play the match
  resolveTournamentMatch();
}

function resolveTournamentMatch() {
  // Simulates the match using the buff gained from the event
  const result = simulateTournamentMatch(state.team, state.tournament, state.stats, state.tournamentBuff);
  if (!result) return;
  
  // Record personal KDA performance
  const y = currentYear();
  if (!state.yearlyPerformance[y]) {
    state.yearlyPerformance[y] = { kills: 0, deaths: 0, assists: 0, ratingSum: 0, matches: 0 };
  }
  const yp = state.yearlyPerformance[y];
  yp.kills += result.kda.kills;
  yp.deaths += result.kda.deaths;
  yp.assists += result.kda.assists;
  yp.ratingSum += result.kda.rating;
  yp.matches += 1;

  advanceTournament(state.tournament, result);
  state.tournament.lastMatch = result;
  
  if (result.win) {
    state.money += prizeForRound(result.roundIndex);
    state.fame += 8 + result.roundIndex * 3;
  } else {
    state.fame = Math.max(0, state.fame - 4);
  }
  
  addLog(tournamentMatchSummary(result));
  renderGame();
}

function continueTournament() {
  if (!state.tournament || !state.tournament.lastMatch) return;

  state.tournamentBuff = 0; //Reset the buff after the match concludes!
  
  if (state.tournament.completed) {
    const report = state.tournament.champion
      ? `${state.team.name} win ${state.tournament.name} and leave with $${state.tournament.prize.toLocaleString()}.`
      : `${state.team.name} exit ${state.tournament.name} with a ${state.tournament.wins}-${state.tournament.losses} record.`;
    
    state.lastCareerReport = report;
    state.tournamentBuff = 0;
    
    addLog(report);
    state.mode = "career";
    state.tournament = null;
    state.currentEvent = null;
    state.pendingResult = null;
    nextEvent();
    return;
  }

  state.tournament.lastMatch = null;
  renderGame();
}

function checkEndConditions() {
  if (state.age >= 34) {
    endCareer("age");
    return true;
  }
  if (state.stats.mental <= 0) {
    endCareer("burnout");
    return true;
  }
  return false;
}

document.getElementById("retireBtn").onclick = () => {
  if (confirm("End your career here? This can't be undone.")) {
    endCareer("voluntary");
  }
};

function endCareer(reason) {
  state.ended = true;
  const score = overall(state.stats);
  const tier = tierFor(score);

  const flavors = {
    age: "Thirty-four. The reflexes have their own opinion now, and it isn't yours. Time to hang up the mouse.",
    burnout: "Somewhere between the scrims and the qualifiers, the game stopped being fun, and then it stopped being possible.",
    voluntary: "You walk away on your own terms, which is more than most players get.",
  };
  const titles = {
    age: "Aged Out",
    burnout: "Burned Out",
    voluntary: "Retired",
  };

  document.getElementById("endKicker").textContent = `Peak Rank · ${tier.name}`;
  document.getElementById("endTitle").textContent = titles[reason];
  document.getElementById("endFlavor").textContent = flavors[reason];

  const statsGrid = document.getElementById("endStats");
  statsGrid.innerHTML = `
    <div><div class="v">${state.age}</div><div class="l">Retired Age</div></div>
    <div><div class="v">$${state.money.toLocaleString()}</div><div class="l">Career Earnings</div></div>
    <div><div class="v">${state.fame}</div><div class="l">Fame</div></div>
    <div><div class="v">${score}</div><div class="l">Overall (/500)</div></div>
    <div><div class="v">${tier.name}</div><div class="l">Peak Tier</div></div>
    <div><div class="v">${state.log.length}</div><div class="l">Events Lived</div></div>
  `;

  showScreen("end");
}

document.getElementById("restartBtn").onclick = () => {
  document.getElementById("pname").value = "";
  showScreen("setup");
};

const countrySelect = document.getElementById("pcountry");
COUNTRIES.forEach(([code, name]) => {
  const opt = document.createElement("option");
  opt.value = code;
  opt.textContent = `${flag(code)}  ${name}`;
  countrySelect.appendChild(opt);
});

const archetypeGrid = document.getElementById("archetypes");
let selectedArchetype = ARCHETYPES[0].id;

function renderArchetypes() {
  archetypeGrid.innerHTML = "";
  ARCHETYPES.forEach(archetype => {
    const button = document.createElement("button");
    button.className = `archetype${archetype.id === selectedArchetype ? " sel" : ""}`;
    button.innerHTML = `<b>${archetype.name}</b><small>${archetype.desc}</small>`;
    button.onclick = () => {
      selectedArchetype = archetype.id;
      renderArchetypes();
    };
    archetypeGrid.appendChild(button);
  });
}

renderArchetypes();

document.getElementById("startBtn").onclick = () => {
  const name = document.getElementById("pname").value.trim();
  state = newState();
  state.name = name || "Rookie";
  state.country = countrySelect.value;
  state.archetype = selectedArchetype;
  state.eventsPerYear = Number(document.getElementById("pevents").value) || 6;
  const arch = ARCHETYPES.find(a => a.id === selectedArchetype);
  Object.keys(arch.base).forEach(key => {
    state.stats[key] = arch.base[key] + Math.floor(Math.random() * 7) - 3;
  });
  addLog("You start on FACEIT with a real goal in mind: go pro.");
  showScreen("game");
  renderGame();
  nextEvent();
};

async function boot() {
  const startBtn = document.getElementById("startBtn");
  
  // 1. Sync the language variable with the dropdown
  const langSelect = document.getElementById("langSelect");
  if (langSelect) {
    currentLang = langSelect.value || "en";
  }
  
  // 2. Translate the static HTML elements immediately
  updateUI();

  // 3. Set button to loading state
  if (startBtn) {
    startBtn.disabled = true;
    startBtn.textContent = t("ui.loading");
  }

  // 4. Attempt to load the JSON file
  try {
    await loadEvents();
    
    // Success: Unlock the button!
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = t("ui.start");
    }
  } catch (err) {
    // Failure: Print the error so it doesn't get stuck
    console.error("Critical boot error:", err);
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.textContent = "Error loading events (Press F12)";
    }
    alert(
      `Couldn't load data/events_${currentLang}.json.\n\n` +
      "Make sure you have correctly renamed your files to 'events_en.json' and 'events_zh.json'."
    );
  }
}

// Scan HTML for data-i18n tags and update text
function updateUI() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
}

// Listen for dropdown changes
const langSelect = document.getElementById("langSelect");
if (langSelect) {
  langSelect.addEventListener("change", async (e) => {
    currentLang = e.target.value;
    updateUI();
    
    const startBtn = document.getElementById("startBtn");
    startBtn.disabled = true;
    startBtn.textContent = t("ui.loading");

    try {
      await loadEvents();
      startBtn.disabled = false;
      startBtn.textContent = t("ui.start");
    } catch (err) {
      console.error("Failed to load events for language", currentLang, err);
    }
  });
}

boot();
