let currentLang = "en";

const translations = {
  en: {
    "ui.language": "Language",
    "ui.loading": "Loading events...",
    "ui.start": "Start career →",
    "ui.continue": "Continue",
    "ui.enterBracket": "Enter bracket →",
    "ui.retire": "Retire",
    
    "stat.aim": "Aim",
    "stat.gamesense": "Gamesense",
    "stat.reflexes": "Reflexes",
    "stat.teamwork": "Teamwork",
    "stat.mental": "Mental",
    
    "log.start": "You start on FACEIT with a real goal in mind: go pro.",
    "log.signed": "You sign with {team}.",
    "ui.playerRole": "Player Role",
    "ui.yearlyAverages": "Yearly Averages",
    "ui.year": "Year",
    "ui.noTeam": "No team signed yet",
    "ui.contractedIn": "Contracted in Y{y} · M{m}",
    "ui.careerHub": "Career Hub",
    "ui.faceitGrind": "FACEIT grind",
    "ui.careerDesc": "You start as a teenage FACEIT player. Each year, three real orgs can contact you with a contract offer. Sign a team first, then tournament mode unlocks.",
    "ui.careerStatusSigned": "You are signed to {team}. Open tournament mode from the team panel.",
    "ui.careerStatusUnsigned": "No team yet. Keep playing until the next contract window arrives.",
    "ui.careerMode": "Career mode",
    "ui.teamOffers": "Team offers",
    "teamStat.firepower": "Firepower",
    "teamStat.tactics": "Tactics",
    "teamStat.entry": "Entry",
    "teamStat.clutch": "Clutch",
    "teamStat.teamwork": "Teamwork",
  },
  zh: {
    "ui.language": "語言",
    "ui.loading": "讀取事件中...",
    "ui.start": "開始職業生涯 →",
    "ui.continue": "繼續",
    "ui.enterBracket": "進入淘汰賽 →",
    "ui.retire": "退役",
    
    "stat.aim": "槍法",
    "stat.gamesense": "意識",
    "stat.reflexes": "反應",
    "stat.teamwork": "團隊合作",
    "stat.mental": "心態",
    "teamStat.firepower": "火力",
    "teamStat.tactics": "戰術",
    "teamStat.entry": "突破",
    "teamStat.clutch": "殘局",
    "teamStat.teamwork": "團隊合作",
    
    "log.start": "你在 FACEIT 上開始了征程，心懷一個真實的目標：成為職業選手。",
    "log.signed": "你與 {team} 簽約了。",
    "ui.playerRole": "選手定位",
    "ui.yearlyAverages": "年度平均數據",
    "ui.year": "第 {y} 年",
    "ui.noTeam": "尚未簽約戰隊",
    "ui.contractedIn": "簽約於 第 {y} 年 · {m} 月",
    "ui.careerHub": "生涯中心",
    "ui.faceitGrind": "FACEIT 積分奮戰",
    "ui.careerDesc": "你以一名年輕的 FACEIT 玩家起步。每年會有三支真實的電競俱樂部向你發出合約。先簽約一支戰隊，然後解鎖錦標賽模式。",
    "ui.careerStatusSigned": "你已與 {team} 簽約。請從戰隊面板開啟錦標賽模式。",
    "ui.careerStatusUnsigned": "還沒有戰隊。繼續打比賽，直到下一個合約窗口到來。",
    "ui.careerMode": "生涯模式",
    "ui.teamOffers": "戰隊報價",
  }
};

function t(key, variables = {}) {
  let text = translations[currentLang][key] || key;
  Object.keys(variables).forEach(varKey => {
    text = text.replace(`{${varKey}}`, variables[varKey]);
  });
  return text;
}