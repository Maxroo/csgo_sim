# GO PRO Guide

This file is a map for future edits. It explains where the important systems live and what each file controls.

## Project Summary

GO PRO is a browser career sim about starting as a FACEIT grinder, receiving yearly weighted team offers from real esports orgs, and then competing in simulated tournaments. 

The game features full i18n (internationalization) support for English and Traditional Chinese. Tournament mode is lightweight but interactive: it shows the team, the next opponent, and a simulated bracket result. Tournaments spawn dynamically via event pop-ups. Players simulate personal KDA and HLTV 1.0 style ratings based on their individual stats and track their yearly performance averages.

## Key Flow

1. Setup screen creates the player and selects the UI/Event language.
2. Career loop advances time and shows events.
3. `eventsPerYear` controls how many career events happen in a year.
4. Once per in-game year, the game can generate three weighted org offers. Accepting an offer signs a team.
5. While signed, players have a chance to receive "Tournament Invitations" via the event system, up to a yearly limit (`maxTournamentsPerYear`).
6. Mid-tournament, special `tournament_only` events have a chance to interrupt the bracket before a match. These events utilize stat-based RNG success/failure rolls.
7. Event choices can grant a temporary `tournamentBuff` which directly affects the win probability of the next match.
8. Matches simulate team outcomes and personal KDA/HLTV Rating simultaneously, updating the player's yearly averages.

## File Map

- `index.html` controls the page structure, UI elements (tagged with `data-i18n`), and script order.
- `css/style.css` controls layout, panels, stat bars, event cards, and responsive behavior.
- `js/i18n.js` holds the translation dictionary and the `t()` helper function for system text.
- `js/data.js` holds player-facing reference data like countries, archetypes, and tiers.
- `js/teams.js` holds real org templates, team stat labels, role weights, and helpers for building or refreshing signed teams.
- `js/tournaments.js` holds tournament templates, opponent generation, and the core match/HLTV Rating simulation math.
- `js/app.js` is the main state machine for setup, career progression, yearly offers, event RNG resolution, tournament bracket flow, and rendering.
- `data/events_en.json` & `data/events_zh.json` hold the localized career event content. Supports both static outcomes and dynamic RNG outcomes (`successChance`, `successStat`).

## Important Symbols

### In `js/app.js`

- `newState()` creates the run state, including `yearlyPerformance` and `tournamentBuff`.
- `updateUI()` scans the DOM for `data-i18n` tags and applies translations from `i18n.js`.
- `nextEvent()` advances the timeline, rolls for yearly offers, and randomly triggers tournament invites if under the yearly limit.
- `eligibleEvents()` filters the event pool (explicitly ignoring `tournament_only` categories).
- `resolveChoice()` handles standard events, processes RNG success/failure math, scales probabilities via player stats, and queues tournaments.
- `playTournamentMatch()` checks for mid-bracket `tournament_only` events before simulating.
- `resolveTournamentMatch()` calculates the bracket match, updates the player's KDA averages, and advances the tournament.
- `continueCareer()` includes safeguard logic to prevent double-click bugs that break the tournament state.
- `continueTournament()` returns to the career flow or next bracket round, and resets `tournamentBuff`.

### In `js/i18n.js`

- `translations` is the dictionary object containing language keys (e.g., `en`, `zh`).
- `t(key, variables)` fetches the translated string and injects dynamic variables (like team names).

### In `js/tournaments.js`

- `buildTournament()` creates the bracket state and shuffles opponents.
- `projectedWinChance()` calculates the pre-match UI win probability, factoring in `tournamentBuff`.
- `simulateTournamentMatch()` resolves a match's win/loss margin and generates a personal KDA rating using a recreation of the HLTV 1.0 formula (calculating KPR, SPR, and APR based on inferred rounds).

## Edit Rules

- Keep team data in `js/teams.js` and tournament data in `js/tournaments.js`.
- Keep career/RNG logic in `js/app.js`.
- Always wrap hardcoded UI/log text in the `t()` function.
- If adding a new language, add the dictionary to `i18n.js`, add an `<option>` to `index.html`, and create a corresponding `events_XX.json` file.
- Event JSONs support both static outcomes (`result`, `effects`) and RNG outcomes (`successChance`, `success`, `failure`, `successStat`). Both can be mixed freely.
- Ensure `tournamentBuff` is always reset to 0 in `continueTournament()` so advantages don't bleed into future events.

## Useful Search Anchors

- `eventsPerYear`
- `maxTournamentsPerYear`
- `yearlyPerformance`
- `tournamentBuff`
- `successChance`
- `resolveChoice`
- `simulateTournamentMatch`
- `data-i18n`
- `updateUI`