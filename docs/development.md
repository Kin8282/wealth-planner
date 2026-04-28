# Development Guide

The project is a static browser app. There is no bundler, package manager, backend service, or generated asset pipeline.

## Local Workflow

Run a local static server from the repo root:

```bash
python3 -m http.server 8090
```

Open:

```text
http://localhost:8090
```

Use browser developer tools while changing calculators or charts. Most failures surface as console errors because chart rendering is client-side.

## Source Layout

- `index.html` owns the page shell, global inputs, tab navigation, and tab panel markup.
- `styles.css` owns the design tokens, responsive layout, cards, tables, charts, and module-specific styling.
- `app.js` owns core strategy modeling, tab initialization, shared input listeners, chart rendering, scenario snapshots, and PDF export.
- `features.js` owns newer modules that extend the base app, including net worth, Roth conversion, RMD, business sale, year-end checklist, scenario comparison, lifetime tax, and AI chat.
- `test_sankey.html` is a small isolated page for verifying the Sankey chart plugin.

## Adding A New Module

1. Add a new tab button in `index.html` with a unique `data-tab` value.
2. Add a matching `<section id="panel-{tab}">` panel in `index.html`.
3. Add the module renderer in `app.js` or `features.js`.
4. Register the renderer in the tab switch logic in `initTabs()`.
5. Wire module-specific inputs in `initInputListeners()` if the module should update while active.
6. Add or reuse styles in `styles.css`.
7. Update `README.md` and `docs/assumptions.md` if the module introduces new assumptions.

## Coding Conventions

- Keep the app dependency-free unless a browser-only CDN dependency is clearly justified.
- Prefer explicit IDs for inputs, chart canvases, and generated result containers.
- Destroy and recreate Chart.js instances before re-rendering to avoid duplicate canvases and memory leaks.
- Keep model assumptions near the code that uses them.
- Use clear fallback values for optional DOM elements so partially loaded tabs do not crash.
- Avoid storing sensitive data beyond browser `localStorage`; there is no secure backend in this architecture.

## Manual Test Checklist

Run through this checklist before merging documentation, UI, or calculation changes:

- App loads from `http://localhost:8090` without console errors.
- Main scenario inputs update the live summary.
- Strategy, ROI, Monte Carlo, Income, Tax, Relocation, Education, Estate, Retirement, Equity, 1031, AQR, Insurance, and Playbook tabs render.
- Net Worth, Roth Ladder, RMD Planner, Business Sale, Year-End Checklist, Compare Scenarios, Lifetime Tax, and AI Advisor tabs render.
- Scenario saving, loading, deleting, and comparing work from `localStorage`.
- PDF export produces `Private_Wealth_Executive_Summary.pdf`.
- `test_sankey.html` shows `SUCCESS` after Sankey dependency changes.

## Deployment Notes

The production site can be served by GitHub Pages or any static host. Keep the root files together so relative references continue to resolve:

- `index.html`
- `styles.css`
- `app.js`
- `features.js`

If production reliability matters, pin floating CDN versions and test the app after browser, CDN, or API changes.
