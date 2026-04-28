# Modeling Assumptions

This app is designed for fast scenario exploration. It intentionally uses simplified assumptions so users can compare relative outcomes without needing a full financial planning engine.

## Global Assumptions

- Federal long-term capital gains are modeled with a 20% rate plus 3.8% NIIT in the core concentrated-stock calculations.
- State tax is user-entered as a flat percentage in the shared scenario sidebar.
- Growth projections generally use annual compounding.
- Strategy-specific fees, liquidity limits, and return drags are approximations, not quotes from providers.
- Charts are deterministic unless a module explicitly performs simulation.
- Results are nominal unless a module explicitly models inflation.

## Module Notes

| Module | Key assumptions |
| --- | --- |
| Strategy comparison | Strategy scores and return multipliers are illustrative. They are useful for comparing tradeoffs, not for choosing an implementation provider. |
| Monte Carlo | Simulations use simplified market-return assumptions and should be read as directional probability ranges. |
| Relocation | State tax comparisons are simplified and do not determine domicile, source-income treatment, clawback rules, or audit risk. |
| 529 education | College cost inflation is modeled at a fixed rate. Actual costs, financial aid, tax treatment, and contribution limits vary by state and institution. |
| Estate transfer | Estate tax exposure uses simplified exemption and growth assumptions. It does not model every trust structure, valuation discount, GST issue, or state estate tax. |
| Retirement | Retirement projections use simplified spending, Social Security, inflation, and portfolio return assumptions. They are not a full safe-withdrawal analysis. |
| Equity and founders | ISO, NSO, AMT, and QSBS calculations are approximations. Real outcomes depend on grant documents, holding periods, entity qualification, income, and state rules. |
| 1031 exchange | Depreciation, leverage, cap rate, and tax deferral are simplified. Actual exchanges require strict timing, qualified intermediary handling, and property-specific tax review. |
| AQR strategy | Risk, return, Sharpe ratio, correlation, and factor exposure values are illustrative and not fund recommendations. |
| Insurance | PPLI, whole life, and IUL projections are generic. Actual policy economics depend on underwriting, charges, crediting methods, loan terms, and carrier illustrations. |
| Roth ladder and RMD | Retirement account projections simplify tax brackets, contribution rules, RMD rules, and QCD treatment. Update assumptions when tax law changes. |
| Business sale | Sale-structure modeling simplifies entity tax, purchase price allocation, installment treatment, QSBS, and state tax. Transaction documents drive actual outcomes. |
| Lifetime tax | Lifetime projections are directional and combine assumptions across tax brackets, Social Security taxation, IRMAA, withdrawals, and Roth conversion logic. |
| AI Advisor | Responses depend on the prompt, current scenario inputs, and the external model response. They should be reviewed like any other educational output. |

## Maintenance Notes

Review the following at least annually:

- Federal capital gains, NIIT, ordinary income, estate tax, AMT, and corporate tax rates.
- Estate and gift tax exemption amounts.
- Annual gift exclusion, QCD limits, RMD start age, and RMD factor tables.
- College cost assumptions and 529 planning rules.
- State tax rates and relocation-specific rules.
- External CDN versions and API endpoints.

When updating assumptions, document the date and rationale in the relevant code comment or pull request so future changes can be audited.
