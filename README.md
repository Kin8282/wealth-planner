# Wealth Strategy Planner

Interactive, client-side wealth planning dashboard for modeling concentrated stock positions, tax-aware diversification strategies, estate planning, retirement income, business exits, and related high-net-worth scenarios.

Live demo: https://kinchit8282.github.io/wealth-planner/

## What It Does

The app lets users adjust a shared scenario, compare strategy outputs, save local scenario snapshots, and export a PDF summary. Everything runs in the browser; there is no backend, database, login, or build step.

Primary use cases:

- Compare tax-efficient exits for concentrated stock positions.
- Model ROI, income, breakeven timing, and Monte Carlo outcome ranges.
- Estimate tax impact from relocation, estate transfer, business sale, 1031 exchange, Roth conversion, and RMD decisions.
- Save multiple scenarios in browser storage and compare them side by side.
- Generate an executive PDF summary from the current scenario.

## Feature Map

| Tab | Purpose |
| --- | --- |
| Strategy Comparison | Compares sell-and-reinvest, CRT, exchange fund, deferred sale, opportunity zone, and hedged collar/loan strategies. |
| ROI Deep Dive | Projects long-term wealth and tax drag across strategies. |
| Monte Carlo | Simulates probability ranges and sensitivity across return assumptions. |
| Income & Breakeven | Models passive income, cumulative income, and when each strategy overtakes selling. |
| Tax Strategies | Summarizes capital gains mitigation tactics and immediate tax burden. |
| State Relocation | Estimates savings from moving from high-tax states to zero-tax states before liquidation. |
| 529 Education | Projects education costs, 529 growth, contribution gaps, and coverage ratios. |
| Estate Transfer | Estimates estate tax exposure and compares transfer strategies. |
| Retirement | Tests whether concentrated stock and other assets can support retirement spending. |
| Equity & Founders | Models ISO/NSO outcomes, AMT impact, exit scenarios, and QSBS treatment. |
| 1031 Exchange | Compares real estate sale, hold, and tax-deferred exchange outcomes. |
| AQR Strategy | Compares systematic portfolio approaches such as 60/40, risk parity, managed futures, and multi-factor. |
| Insurance | Compares PPLI, whole life, IUL, and taxable investing baselines. |
| Playbook | Shows a combined strategy allocation and emerging planning ideas. |
| Net Worth | Tracks assets, liabilities, liquidity profile, and growth trajectory. |
| Roth Ladder | Models systematic Roth conversions and long-term tax-free balance growth. |
| RMD Planner | Projects required minimum distributions, taxes, and QCD opportunities. |
| Business Sale | Compares asset sale, stock sale, installment sale, C-corp double tax, and QSBS effects. |
| Year-End Checklist | Generates scenario-aware action items sorted by priority. |
| Compare Scenarios | Compares saved scenario snapshots from localStorage. |
| Lifetime Tax | Projects retirement-phase taxes and strategy savings over a lifetime horizon. |
| AI Advisor | Optional browser-side advisor chat using a user-provided Anthropic API key. |

## Running Locally

No package install is required.

```bash
python3 -m http.server 8090
```

Then open:

```text
http://localhost:8090
```

You can also open `index.html` directly, but serving over localhost better matches the GitHub Pages deployment and avoids browser restrictions that can affect CDN-loaded assets.

## Project Structure

```text
wealth-planner/
|-- index.html          # App shell, scenario inputs, and tab panel markup
|-- styles.css          # Responsive dark-theme design system and component styles
|-- app.js              # Core calculators, charts, snapshots, PDF export, and initial tabs
|-- features.js         # Supplemental modules: net worth, Roth, RMD, business sale, AI, lifetime tax
|-- test_sankey.html    # Minimal Chart.js Sankey smoke-test page
|-- docs/
|   |-- assumptions.md  # Modeling assumptions and caveats
|   `-- development.md  # Local development and maintenance notes
`-- README.md
```

## External Dependencies

Dependencies are loaded from CDNs in `index.html`:

- Chart.js 4.4.7 for charts.
- `chartjs-chart-sankey` for estate flow diagrams.
- `html2pdf.js` 0.10.1 for PDF export.
- Google Fonts for Inter and JetBrains Mono.

For reproducible deployments, pin any dependency currently loaded with a floating tag before release.

## Privacy And Data Flow

- Financial inputs are processed in the browser.
- Saved scenarios are stored in `localStorage` under `wealthPlannerSnapshots`.
- The optional AI Advisor stores the API key in `localStorage` under `wealthPlannerApiKey`.
- The AI Advisor sends the current scenario and user prompt directly from the browser to Anthropic's API when the user submits a message.
- There is no project-owned server, database, analytics pipeline, or account system in this repo.

## Deployment

The app is static and can be deployed with GitHub Pages or any static host.

Minimal deployment requirements:

- Serve `index.html`, `styles.css`, `app.js`, and `features.js` from the same directory.
- Allow outbound browser access to the CDN dependencies listed above.
- If the AI Advisor is used, allow outbound browser requests to `https://api.anthropic.com/v1/messages`.

## Validation Checklist

Before publishing changes:

- Start a local server and load `http://localhost:8090`.
- Confirm all tabs open without console errors.
- Change the primary scenario inputs and verify visible charts/tables update.
- Save at least two scenarios and compare them in the Compare Scenarios tab.
- Export a PDF and verify the file contains the expected summary.
- Open `test_sankey.html` if changes touched the Sankey chart dependency or estate flow rendering.

## Important Limitations

This project is a planning and education tool, not financial, tax, legal, investment, or insurance advice. The calculations are simplified projections and should not be used as implementation guidance without review by qualified professionals. Tax rules, exemptions, brackets, state rules, deduction limits, retirement distribution rules, and product terms change over time.

See [docs/assumptions.md](docs/assumptions.md) for modeling details and caveats.
