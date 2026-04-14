# 💎 Wealth Strategy Planner — What-If Scenario Analysis

An interactive, client-side wealth planning tool designed for individuals with **concentrated stock positions** ($500K–$10M+). Compare tax-efficient strategies, run Monte Carlo simulations, plan 529 education savings, and evaluate state relocation — all in one premium dashboard.

🔗 **Live Demo:** [kinchit8282.github.io/wealth-planner](https://kinchit8282.github.io/wealth-planner/)

---

## ✨ Features

### 📊 Strategy Comparison
Compare 6 tax-efficient strategies side-by-side with pros, cons, and multi-dimensional radar scoring:
- **Sell & Reinvest** — Pay taxes now, invest freely
- **Charitable Remainder Trust (CRT)** — Donate, defer, receive income for life
- **Exchange Fund** — Pool stocks, defer taxes indefinitely
- **Deferred Sales Trust (DST)** — Spread tax over 10–30 years
- **Opportunity Zone Fund** — Defer + eliminate future gains
- **Hedged Collar + Loan** — Protect value, borrow against it

### 📈 ROI Deep Dive
- 20-year wealth growth projection for all strategies
- Tax drag impact visualization
- Year-by-year breakdown table
- Summary cards with final values and comparisons

### 🎲 Monte Carlo Probability Analysis
- 1,000+ simulated outcomes using **Geometric Brownian Motion**
- Probability cones (5th / 25th / 50th / 75th / 95th percentile)
- Adjustable volatility (σ) and simulation count
- **Probability that Exchange Fund outperforms selling**
- Sensitivity analysis across 3%–13% return scenarios

### 💰 Income & Breakeven
- Annual passive income projections (CRT payouts, dividends, DST installments)
- Breakeven analysis — when does each strategy overtake selling?
- Cumulative income comparison over time

### 🧾 Tax Strategies
- Immediate tax burden comparison chart
- 6 advanced tax minimization strategies:
  - Step-Up in Basis at Death
  - Tax-Loss Harvesting
  - Gifting to Family Members
  - Donor-Advised Fund (DAF)
  - Direct Indexing
  - Installment Sale to IDIT

### 🏠 State Relocation Tax Savings
- Compare 9 zero-tax states (TX, FL, NV, WA, WY, SD, TN, AK, NH)
- 11 high-tax source states with accurate rates
- Cumulative savings chart (cap gains + ongoing income tax)
- Expert tips on domicile rules, CA clawback, timing

### 🎓 529 Education Savings Planner
- **Child's age**, **529 balance**, and **monthly contribution** inputs
- Choose between **Public In-State**, **Out-of-State**, **Private**, or **Elite/Ivy**
- Coverage percentage and gap analysis
- 529 growth vs. projected college cost chart (with 5% inflation)
- 6 education planning tips (Superfunding, Roth rollover, state deductions)

### 🎯 Master Playbook
- Recommended hybrid allocation (50% Exchange / 30% CRT / 20% OZ+Collar)
- 8 emerging investment strategies (PPLI, GRAT, CLT, QSBS, Muni Bonds, etc.)
- Combined wealth trajectory projection

---

## 🛠️ Tech Stack

- **HTML5** + **Vanilla CSS** + **JavaScript** (no frameworks)
- **Chart.js 4.x** for all visualizations
- **Inter** + **JetBrains Mono** fonts (Google Fonts)
- Fully client-side — no server, no database, no tracking

## 🚀 Running Locally

```bash
# Just open directly
open index.html

# Or serve with Python
python3 -m http.server 8090
```

## 📁 Project Structure

```
wealth-planner/
├── index.html    # Main HTML structure (8 tab panels)
├── styles.css    # Complete CSS design system (dark luxury theme)
├── app.js        # Application logic, calculations, Chart.js rendering
└── README.md
```

## ⚖️ Disclaimer

This tool is for **educational purposes only** and does not constitute financial, tax, or legal advice. Please consult a qualified CPA, estate attorney, and Registered Investment Advisor before implementing any strategy. Tax laws change; all projections are estimates.
