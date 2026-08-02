/* =========================================================
  data.js — static reference data (countries, archetypes, tiers)
  Team/org data lives in js/teams.js and tournament data lives in js/tournaments.js.
  Event content itself lives in data/events.json, loaded by app.js.
========================================================= */

const COUNTRIES = [
  ["US","United States"],["BR","Brazil"],["RU","Russia"],["UA","Ukraine"],
  ["PL","Poland"],["DK","Denmark"],["SE","Sweden"],["FI","Finland"],
  ["FR","France"],["DE","Germany"],["GB","United Kingdom"],["TR","Turkey"],
  ["KZ","Kazakhstan"],["RO","Romania"],["ES","Spain"],["PT","Portugal"],
  ["CN","China"],["KR","South Korea"],["AU","Australia"],["CA","Canada"],
  ["NL","Netherlands"],["BE","Belgium"],["AR","Argentina"],["CL","Chile"]
];

function flag(code){
  return String.fromCodePoint(...[...code.toUpperCase()].map(c=>127397+c.charCodeAt()));
}

const ARCHETYPES = [
  {id:"entry", name:"Entry Fragger", desc:"First through the door. High aim, high pressure.",
   base:{aim:58,gamesense:42,reflexes:52,teamwork:44,mental:40}},
  {id:"awp", name:"AWPer", desc:"One shot, one kill. Precision over everything.",
   base:{aim:60,gamesense:46,reflexes:56,teamwork:38,mental:42}},
  {id:"igl", name:"In-Game Leader", desc:"Calls the shots. Sees the round before it happens.",
   base:{aim:40,gamesense:60,reflexes:42,teamwork:56,mental:50}},
  {id:"support", name:"Support", desc:"Flashes, trades, no glory. The glue of the roster.",
   base:{aim:44,gamesense:50,reflexes:44,teamwork:60,mental:52}},
  {id:"lurk", name:"Lurker", desc:"Alone on the flank, reading the map like a book.",
   base:{aim:50,gamesense:56,reflexes:50,teamwork:38,mental:46}},
];

const STAT_LABELS = {
  aim:"Aim", gamesense:"Game Sense", reflexes:"Reflexes", teamwork:"Teamwork", mental:"Mental"
};

const TIERS = [
  {min:0,  name:"Cybercafé Grinder"},
  {min:55, name:"Open Bracket Amateur"},
  {min:100,name:"Semi-Pro"},
  {min:150,name:"Tier 2 Pro"},
  {min:200,name:"Tier 1 Pro"},
  {min:250,name:"Major Contender"},
  {min:300,name:"Legend"},
];

function overall(s){
  return s.aim + s.gamesense + s.reflexes + s.teamwork + s.mental; // out of 500
}
function tierFor(score){
  let t = TIERS[0];
  for(const tier of TIERS){ if(score >= tier.min) t = tier; }
  return t;
}
function tierIndex(score){
  let idx = 0;
  TIERS.forEach((t,i)=>{ if(score>=t.min) idx=i; });
  return idx;
}
