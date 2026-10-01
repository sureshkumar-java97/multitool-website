
# MultiTool

A responsive utility website built with React, Vite, React Router, and Lucide. The catalogue includes calculators, converters, developer tools, text and design helpers, career checks, student tools, and everyday planners.

## Run locally

1. Install Node.js 20.19+.
2. Run `npm install` in this folder.
3. Start the app with `npm run dev`.
4. Create a production bundle with `npm run build` and preview it with `npm run preview`.
5. Format source with `npm run format`.

## Project map

- `src/data/registry.js` — the single source for tool groups, names, descriptions, and search terms.
- `src/App.jsx` — navigation, theme, local clock/weather, search dialog, home, catalogue, and feedback page.
- `src/pages/ToolPage.jsx` — dedicated routes, shared tool panel, and special tool components.
- `src/tools/calculators/` — basic and scientific calculator workspaces.
- `src/tools/converters/` — currency and world-clock workspaces.
- `src/tools/developer/` — API request builder.
- `src/tools/student/` — Pomodoro and exam countdown widgets.
- `src/utils/toolLogic.js` — tested input validation and local calculations/generators.
- `src/styles.css` — design tokens, burgundy/white and burgundy/black themes, glass surfaces, responsive rules, and reduced-motion support.

## Tool behavior and APIs

- Frankfurter supplies the latest published currency reference rate and available currency list. Rates are mid-market reference data, not live trading quotes; the output shows its rate date. See [Frankfurter documentation](https://frankfurter.dev/).
- World Clock loads timezone names and current time from [World Time API](https://timeapi.world/), with a local timezone-formatting fallback if the service is unavailable.
- The navigation weather control asks for browser location only after a click, then sends coordinates to [Open-Meteo](https://open-meteo.com/en/docs) for current weather. The device clock itself does not need location permission.
- API Request Builder sends the request configured by the user to the destination they enter. Browser cross-origin restrictions may prevent access to some servers.
- Calculators, generators, color tools, text tools, and career checks run in the browser. Resume checks report measurable text matches and section checks; they do not claim an ATS score or hiring outcome. JWT decoding does not verify a signature.
- Feedback is a frontend demonstration and is not sent to a server.

## Add or edit a tool

1. Add the name and category in `src/data/registry.js`.
2. Add a user-facing description in the same registry file.
3. Add an operation and input validation in `src/utils/toolLogic.js`, or create a focused component under `src/tools/<category>/<ToolName>/` when a tool needs custom controls.
4. Add an example and clear input hint in `exampleFor` and `inputHint` in `src/utils/toolLogic.js`.
5. For external API requests, provide loading, failure, and success states; state which service is contacted and avoid inventing data.

## Privacy notes

Local transformations stay in the current browser session. Currency requests send currency codes to Frankfurter. Weather requests send the coordinates from the browser's location permission to Open-Meteo. API Request Builder sends the configured HTTP request to the URL the user enters.


