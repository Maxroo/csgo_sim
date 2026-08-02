# GO PRO Career Simulator

This is a browser game about starting as a FACEIT grinder, collecting yearly team offers from real esports orgs, signing a team, and then entering tournament mode.

## Flow

- Create a player, choose a country, and pick a playstyle.
- Play through career events while the game advances time.
- Once per in-game year, three real orgs can contact the player with a contract offer.
- Accept one offer to sign a team.
- After signing, tournament mode becomes available.
- Tournament mode shows the signed team, the next opponent, and a lightweight simulated bracket step. No actual game rendering happens.

## Files

- [index.html](index.html) is the page layout. It contains the setup screen, career screen, and end screen, and it loads the data and logic scripts in order.
- [css/style.css](css/style.css) contains the visual styling for the layout, panels, buttons, stat bars, and responsive behavior.
- [js/data.js](js/data.js) stores core player data such as countries, archetypes, tier thresholds, and player stat labels.
- [js/teams.js](js/teams.js) stores real esports org templates, team stat labels, and the helper functions that build and refresh signed teams.
- [js/tournaments.js](js/tournaments.js) stores the tournament template data and the helpers that build brackets, opponents, and match results.
- [js/app.js](js/app.js) contains the main career state machine, yearly offer events, team signing, tournament mode, and screen rendering.
- [data/events.json](data/events.json) stores the career event content used by the legacy event loop.
- [LLM_GUIDE.md](LLM_GUIDE.md) is the quick project map for future LLM edits.

## Notes

- Roster management is still skipped for now.
- Team stats use Firepower, Tactics, Entry, Clutch, and Teamwork.
- The player role and stat gains influence the team stats after signing.
- Tournament mode is only available after signing a team.
