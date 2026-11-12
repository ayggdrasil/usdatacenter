# US Data Center Grid & Water Intelligence Atlas

Interactive US data center project map, state power and water comparison, infrastructure planning, household utility bill scenarios, policy positions, and chip-demand scenarios.

- [Live service](https://xpacex.trade/datacenter-atlas/)
- [GitHub Pages mirror](https://ayggdrasil.github.io/usdatacenter/)

## Languages

English is the default. Use the Language selector to choose English, 한국어, or 日本語. The choice is saved locally. A share link can specify `?lang=en`, `?lang=ko`, or `?lang=ja`. `?view=stateView` opens the state comparison directly.

`index.html` contains the original application and calculations. `locale.js` translates rendered content, dynamic updates, chart text, and accessibility labels without changing data values. `translations.js` bundles the English and Japanese translations. Main navigation and technical UI terms are reviewed; longer descriptions use automatic translation from the Korean original. Korean remains available for source-text comparison.

## Run locally

Serve this folder with any static HTTP server, for example `python3 -m http.server 8080`. No build step or translation service is required at runtime. External map tiles, chart libraries, icons and fonts use their existing CDNs; the original vector map and chart fallbacks remain available.

## Data and interpretation

This is a scenario and research application. Its project facts, policy statements, source links, model assumptions and dated financial snapshots are supplied in the original package and have not been independently audited by this deployment. Quantitative outputs are estimates rather than measured future outcomes or live stock prices.

Sources referenced by the application include DOE/LBNL, EPRI, USGS, NERC, EIA and project reporting. Use the Sources view for the original links. Translation does not validate these sources.

## Deployment

GitHub Pages publishes the main branch. The xpacex.trade host mounts the same static assets at `/datacenter-atlas/`, with a home card, navigation entry and direct section links. The historical package filename `us_datacenter_atlas.html` remains available as an equivalent entry point.

## Per-project impact summaries

Each of the 26 projects has a one-line power, direct-water and policy-pressure assessment in the project list and selected-project panel. The expandable methodology explains the screening thresholds. These are scenario labels based on the supplied dataset, not calibrated forecasts or evidence of enacted restrictions. Missing state-specific policy entries stay unknown. Three projects with mismatched original state proxies (Nevada, Tennessee/Mississippi and North Carolina) are explicitly unassessed rather than assigned another state's score.

`severity.js` contains the deterministic rules and hand-written explanations in all three languages. The underlying engineering calculations are preserved.


Analysis panels support wrapping in English,Korean,andJapanese. The investment value chain uses responsive stage cards; political map labels wrap inside their badges.
