/* ========================================
   WEALTH STRATEGY PLANNER — APPLICATION
   ======================================== */

// ============ CONSTANTS & STATE ============
const FED_LTCG_RATE = 0.20;
const NIIT_RATE = 0.038;
const BASE_CAP_GAINS_RATE = FED_LTCG_RATE + NIIT_RATE; // 23.8%

// Current university costs (2024-2025, source: College Board)
const UNIVERSITY_COSTS = {
  'public-in':  { annual: 23_250, label: 'Public In-State', tuitionOnly: 11_260 },
  'public-out': { annual: 41_920, label: 'Public Out-of-State', tuitionOnly: 29_150 },
  'private':    { annual: 58_600, label: 'Private University', tuitionOnly: 42_160 },
  'elite':      { annual: 82_000, label: 'Elite / Ivy-Level', tuitionOnly: 62_000 },
};
const COLLEGE_INFLATION = 0.05; // ~5% annual increase
const COLLEGE_YEARS = 4;

// Chart instances
let radarChart, projectionChart, taxDragChart, taxBarChart, eduChart, playbookChart;
let mcExchangeChart, mcSellChart, sensitivityChart;
let incomeChart, breakevenChart, cumulativeIncomeChart;
let relocationChart;
let estateChart, transferChart, estateSankeyChart;
let retireDrawdownChart, retireIncomeChart;
let exchange1031Chart, exchange1031IncomeChart;
let aqrComparisonChart, aqrFactorChart;
let insuranceCashValueChart, insuranceComparisonChart, insuranceIncomeChart;
let equityTaxChart, equityScenarioChart;

// ============ STRATEGIES ============
function buildStrategies(stockValue, costBasis, capGainsRate) {
  const gain = Math.max(0, stockValue - costBasis);
  const taxIfSold = Math.round(gain * capGainsRate);
  const afterTax = stockValue - taxIfSold;
  const crtDeduction = Math.round(stockValue * 0.25); // ~25% charitable deduction

  return {
    sell: {
      name: 'Sell & Reinvest',
      color: '#ef4444',
      icon: '💸',
      taxNow: taxIfSold,
      afterTax: afterTax,
      capitalDeployed: afterTax,
      returnMultiplier: 1,
      tagline: 'Pay now, reinvest freely',
      pros: [
        'Immediate full diversification',
        'Full liquidity — access anytime',
        'Simplest option to execute',
        'No restrictions on investment choices',
      ],
      cons: [
        `~$${(taxIfSold/1000).toFixed(0)}K capital gains tax immediately`,
        'Significant opportunity cost from lost capital',
        'No legacy or charitable benefit',
      ],
    },
    crt: {
      name: 'Charitable Remainder Trust',
      color: '#10b981',
      icon: '🏛️',
      taxNow: 0,
      afterTax: stockValue,
      capitalDeployed: stockValue,
      returnMultiplier: 0.94, // slightly less due to payout requirement
      tagline: 'Donate, defer tax, receive income',
      pros: [
        'Zero capital gains on sale inside trust',
        `~$${(crtDeduction/1000).toFixed(0)}K immediate tax deduction`,
        'Income stream of 5-8% annually for life',
        'Strong charitable legacy and impact',
        'Reduces estate tax exposure',
      ],
      cons: [
        'Remaining assets go to charity at death',
        'Irrevocable — cannot change terms',
        'Annual payout requirement (5-50%)',
        'Complex setup and admin costs',
      ],
    },
    exchange: {
      name: 'Exchange Fund',
      color: '#6366f1',
      icon: '🔄',
      taxNow: 0,
      afterTax: stockValue,
      capitalDeployed: stockValue,
      returnMultiplier: 0.935, // ~0.65% fee drag
      tagline: 'Pool stocks, defer indefinitely',
      pros: [
        'Zero taxes — indefinite deferral',
        'Instant diversification into 20-30 stocks',
        'Full principal preserved & compounding',
        'No charity required — keep everything',
      ],
      cons: [
        'Mandatory 7-year lock-up period',
        'Limited fund selection & availability',
        'Accredited investor required ($5M+ net worth typical)',
        '~1-1.5% annual management fees',
      ],
    },
    dso: {
      name: 'Deferred Sales Trust',
      color: '#f59e0b',
      icon: '📋',
      taxNow: 0,
      afterTax: stockValue,
      capitalDeployed: stockValue,
      returnMultiplier: 0.97, // some interest cost
      tagline: 'Sell now, spread tax over decades',
      pros: [
        'Tax payments spread over 10-30 years',
        'Full investment flexibility retained',
        'No charity commitment required',
        'You control how proceeds are invested',
      ],
      cons: [
        'IRS scrutiny — must be impeccably structured',
        'Complex setup costs ($20K–$50K in legal/advisory fees)',
        'Interest owed on deferred tax balance',
        'Need qualified DST attorney',
      ],
    },
    ozone: {
      name: 'Opportunity Zone Fund',
      color: '#8b5cf6',
      icon: '🏙️',
      taxNow: 0,
      afterTax: stockValue,
      capitalDeployed: stockValue,
      returnMultiplier: 1.1, // higher target return (real estate/development)
      tagline: 'Defer gains + eliminate future growth tax',
      pros: [
        'Defer original capital gains',
        'Future gains eliminated after 10-year hold',
        'Double tax benefit (deferral + exclusion)',
        'High upside in developing markets',
      ],
      cons: [
        'Illiquid — 10-year minimum hold',
        'Real estate & development risk',
        'Market/location dependent returns',
        'Limited established track records',
      ],
    },
    collar: {
      name: 'Hedged Collar + Loan',
      color: '#0ea5e9',
      icon: '🔒',
      taxNow: 0,
      afterTax: stockValue,
      capitalDeployed: stockValue,
      returnMultiplier: 0.92, // capped upside & loan interest drag
      tagline: 'Protect value, borrow against it',
      pros: [
        'No taxable event at all',
        `Access $${(stockValue * 0.7 / 1000).toFixed(0)}K–$${(stockValue * 0.8 / 1000).toFixed(0)}K via margin loan`,
        'Downside fully protected via put option',
        'Can invest borrowed proceeds freely',
      ],
      cons: [
        'Interest on margin loan (~5-7% annually)',
        'Upside capped by call option',
        'Requires sophisticated broker (Goldman, Morgan Stanley)',
        'Complex derivatives maintenance',
      ],
    },
  };
}

const radarMetrics = [
  { subject: 'Tax Efficiency',  sell: 2,  crt: 9,  exchange: 10, dso: 7, ozone: 8,  collar: 9  },
  { subject: 'Liquidity',       sell: 10, crt: 5,  exchange: 3,  dso: 7, ozone: 2,  collar: 8  },
  { subject: 'Simplicity',      sell: 10, crt: 5,  exchange: 6,  dso: 4, ozone: 5,  collar: 4  },
  { subject: 'Legacy / Impact', sell: 3,  crt: 10, exchange: 4,  dso: 3, ozone: 6,  collar: 3  },
  { subject: 'Return Potential', sell: 7,  crt: 6,  exchange: 8,  dso: 8, ozone: 9,  collar: 6  },
  { subject: 'Control',         sell: 10, crt: 4,  exchange: 5,  dso: 8, ozone: 6,  collar: 7  },
];

const taxIdeas = [
  {
    title: '🏦 Step-Up in Basis at Death',
    color: '#6366f1',
    desc: 'Hold concentrated stock until death. Heirs receive full step-up in cost basis — eliminating ALL capital gains tax permanently. This is the ultimate "do nothing" strategy.',
    impact: 'Eliminates entire tax liability',
    caveat: 'Must hold stock and accept concentration risk. Estate tax may apply for estates >$13.6M.',
  },
  {
    title: '📉 Tax-Loss Harvesting',
    color: '#10b981',
    desc: 'Offset the capital gain by selling other losing positions in your portfolio. Each $1 of realized losses cancels $1 of gains. Direct indexing can harvest losses daily.',
    impact: 'Up to full gain offset',
    caveat: 'Requires existing losing positions. Be careful of 30-day wash-sale rules.',
  },
  {
    title: '🎁 Gifting to Family Members',
    color: '#f59e0b',
    desc: 'Gift $18K/year per person tax-free (2024). Gift to children in lower tax brackets — 0% capital gains rate applies under ~$47K income. Can use lifetime exemption for larger gifts.',
    impact: '0% tax rate on gains',
    caveat: 'Annual limit $18K or must use lifetime exemption ($13.6M). Complex for $1M positions.',
  },
  {
    title: '🏥 Donor-Advised Fund (DAF)',
    color: '#8b5cf6',
    desc: 'Contribute appreciated stock to a DAF for an immediate tax deduction at full market value. No capital gains tax on the appreciation. Recommend grants to charities over time.',
    impact: 'Full deduction + zero cap gains',
    caveat: 'Funds must go to charity eventually. Cannot personally benefit from DAF assets.',
  },
  {
    title: '📊 Direct Indexing',
    color: '#0ea5e9',
    desc: 'Build a custom index of 200-500 individual stocks. Algorithmic daily tax-loss harvesting generates losses to offset your concentrated stock gains. Offered by Parametric, Vanguard, Fidelity.',
    impact: '2-5% annual tax alpha',
    caveat: 'Requires $500K+ typically. May not fully offset a $900K gain in year one.',
  },
  {
    title: '🔐 Installment Sale to IDIT',
    color: '#f43f5e',
    desc: 'Sell stock to an Intentionally Defective Irrevocable Trust in exchange for a promissory note. Freezes value for estate tax purposes while deferring capital gains recognition.',
    impact: 'Estate freeze + gain deferral',
    caveat: 'Requires existing trust with seed capital (usually 10% of sale). Complex legal setup.',
  },
];

const newInvestmentIdeas = [
  {
    title: 'Private Placement Life Insurance (PPLI)',
    desc: 'Wrap your investment portfolio inside a life insurance policy. All growth is tax-deferred; proceeds pass to heirs income-tax free. Can hold alternative investments. Minimum $1M+ premium.',
    tag: 'Ultra-HNW',
  },
  {
    title: 'GRAT (Grantor Retained Annuity Trust)',
    desc: 'Transfer future stock appreciation to heirs with zero gift tax. If the stock grows above the IRS hurdle rate (~5.4% in 2024), heirs keep the excess tax-free. Perfect for high-growth stocks.',
    tag: 'Wealth Transfer',
  },
  {
    title: 'Non-Grantor Charitable Lead Trust (CLT)',
    desc: 'Trust pays a stream to charity for a set term, then remaining assets pass to your heirs gift-tax free. Excellent when interest rates are low. Double benefit: charitable + wealth transfer.',
    tag: 'Estate Planning',
  },
  {
    title: 'Synthetic Equity via Total Return Swap',
    desc: 'Swap the economic exposure of your concentrated stock for a diversified portfolio return. No tax event triggered. Maintains stock ownership on paper. Used by ultra-HNW families.',
    tag: 'Advanced',
  },
  {
    title: 'Qualified Small Business Stock (QSBS)',
    desc: 'If your stock qualifies under Section 1202 (C-corp, held 5+ years, acquired at founding), you can exclude up to $10M or 10x basis of capital gains. 100% federal exclusion.',
    tag: 'Startup Founders',
  },
  {
    title: 'Municipal Bond Portfolio',
    desc: 'Reinvest proceeds into high-quality municipal bonds for tax-exempt income. Yields of 4-5% are equivalent to 6.5-8% pre-tax for top bracket investors. Ideal for income-focused retirees.',
    tag: 'Tax-Free Income',
  },
  {
    title: 'Cryptocurrency via Opportunity Zone',
    desc: 'Roll crypto gains into an Opportunity Zone fund for deferral + future gain elimination. Works for any capital gains, not just stock. 10-year hold eliminates growth taxation.',
    tag: 'Crypto Strategy',
  },
  {
    title: 'Real Estate Cost Segregation',
    desc: 'Purchase income property and accelerate depreciation via cost segregation study. Generate paper losses to offset stock gains. Bonus depreciation allows 60-80% first-year write-off.',
    tag: 'Real Estate',
  },
];

const eduTips = [
  {
    title: 'Superfunding a 529',
    desc: 'Contribute up to 5 years of annual gift exclusions at once ($90K individual / $180K couple in 2024). Jump-start compounding with one large deposit from your stock gains.',
    tag: 'Max Growth',
  },
  {
    title: '529 to Roth IRA Rollover',
    desc: 'Starting 2024, unused 529 funds can roll into a beneficiary Roth IRA (15-year account age required, $35K lifetime limit). Eliminates the "overfunding" risk completely.',
    tag: 'New Rule',
  },
  {
    title: 'State Tax Deduction',
    desc: 'Over 30 states offer income tax deductions for 529 contributions. Your state may allow $10K-$20K+ in annual deductions — effectively a guaranteed return on contributions.',
    tag: 'Tax Savings',
  },
  {
    title: 'Use Appreciated Stock for 529',
    desc: 'Sell a portion of your concentrated stock, pay capital gains, then contribute the proceeds to a 529. Or use charitable deductions from a CRT to offset the gains from the sale.',
    tag: 'Strategy Combo',
  },
  {
    title: 'Age-Based vs. Static Allocation',
    desc: 'For younger children (0-10), use aggressive equity allocations for maximum growth. Switch to conservative bond-heavy funds as college approaches. Most plans offer automatic glide paths.',
    tag: 'Investment',
  },
  {
    title: 'Multiple 529 Accounts Strategy',
    desc: 'Open separate 529 accounts for each child. You can also change beneficiaries between family members. Grandparent-owned 529s no longer count against financial aid (as of 2024 FAFSA).',
    tag: 'Planning',
  },
];

// ============ HELPER FUNCTIONS ============
function fmt(n) {
  if (Math.abs(n) >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (Math.abs(n) >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
  return '$' + n.toFixed(0);
}

function fmtFull(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function getInputs() {
  const stockValue   = parseFloat(document.getElementById('stockValue').value) || 1_000_000;
  const costBasis    = parseFloat(document.getElementById('costBasis').value) || 0;
  const annualReturn = (parseFloat(document.getElementById('annualReturn').value) || 7) / 100;
  const timeHorizon  = parseInt(document.getElementById('timeHorizon').value) || 20;
  const taxBracket   = parseFloat(document.getElementById('taxBracket').value) || 0.37;
  const stateRate    = (parseFloat(document.getElementById('stateRate').value) || 0) / 100;
  const capGainsRate = BASE_CAP_GAINS_RATE + stateRate;

  return { stockValue, costBasis, annualReturn, timeHorizon, taxBracket, stateRate, capGainsRate };
}

function getEduInputs() {
  return {
    balance:       parseFloat(document.getElementById('edu529Balance').value) || 0,
    monthly:       parseFloat(document.getElementById('eduMonthlyContrib').value) || 0,
    childAge:      parseInt(document.getElementById('eduChildAge').value) || 8,
    childCount:    parseInt(document.getElementById('eduChildCount').value) || 1,
    uniType:       document.getElementById('eduType').value || 'public-in',
    returnRate:    (parseFloat(document.getElementById('edu529Return').value) || 6) / 100,
  };
}

function projectWealth(initial, rate, years) {
  return Array.from({ length: years + 1 }, (_, i) => ({
    year: i,
    value: Math.round(initial * Math.pow(1 + rate, i)),
  }));
}

// ============ UPDATE LIVE SUMMARY ============
function updateLiveSummary() {
  const { stockValue, costBasis, capGainsRate, stateRate } = getInputs();
  const gain = Math.max(0, stockValue - costBasis);
  const fedTax = Math.round(gain * BASE_CAP_GAINS_RATE);
  const stateTax = Math.round(gain * stateRate);
  const totalTax = fedTax + stateTax;
  const afterTax = stockValue - totalTax;

  document.getElementById('unrealizedGain').textContent = fmtFull(gain);
  document.getElementById('fedTax').textContent = fmtFull(fedTax);
  document.getElementById('stateTax').textContent = fmtFull(stateTax);
  document.getElementById('totalTax').textContent = fmtFull(totalTax);
  document.getElementById('afterTax').textContent = fmtFull(afterTax);
}

// ============ TAB SWITCHING ============
function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('panel-' + tab).classList.add('active');
      rebuildCurrentTab(tab);
    });
  });
}

function rebuildCurrentTab(tab) {
  switch(tab) {
    case 'strategies':   renderStrategies(); renderRadarChart(); break;
    case 'roi':          renderROI(); break;
    case 'montecarlo':   renderMonteCarlo(); break;
    case 'income':       renderIncomeBreakeven(); break;
    case 'tax':          renderTaxTab(); break;
    case 'relocation':   renderRelocation(); break;
    case 'education':    renderEducation(); break;
    case 'estate':       renderEstate(); break;
    case 'retirement':   renderRetirement(); break;
    case 'equity':       renderEquity(); break;
    case '1031exchange': render1031Exchange(); break;
    case 'aqr':          renderAQR(); break;
    case 'insurance':    renderInsurance(); break;
    case 'playbook':     renderPlaybook(); break;
    case 'networth':     renderNetWorth(); break;
    case 'roth':         renderRothConversion(); break;
    case 'rmd':          renderRMD(); break;
    case 'businesssale': renderBusinessSale(); break;
    case 'yearend':      renderYearEndChecklist(); break;
    case 'compare':      renderScenarioComparison(); break;
    case 'aichat':       renderAIChat(); break;
  }
}

// ============ RENDER: STRATEGIES TAB ============
function renderStrategies() {
  const { stockValue, costBasis, capGainsRate } = getInputs();
  const strategies = buildStrategies(stockValue, costBasis, capGainsRate);
  const grid = document.getElementById('strategies-grid');
  
  grid.innerHTML = Object.entries(strategies).map(([key, s], i) => `
    <div class="strategy-card animate-in stagger-${i + 1}" style="--card-color: ${s.color};" onclick="selectAndGoCompare('${key}')">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${s.color};opacity:0;" class="card-accent"></div>
      <div class="strategy-card-header">
        <span class="strategy-icon">${s.icon}</span>
        <div>
          <div class="strategy-name">${s.name}</div>
          <div class="strategy-tagline">${s.tagline}</div>
        </div>
      </div>
      <div class="strategy-stats">
        <div class="stat-box">
          <div class="stat-label">Tax Now</div>
          <div class="stat-value" style="color: ${s.taxNow === 0 ? '#10b981' : '#ef4444'}">
            ${s.taxNow === 0 ? '$0' : '−' + fmt(s.taxNow)}
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Capital Deployed</div>
          <div class="stat-value" style="color: var(--text-primary)">${fmt(s.capitalDeployed)}</div>
        </div>
      </div>
      <span class="strategy-tag" style="background: ${s.taxNow === 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; color: ${s.taxNow === 0 ? '#10b981' : '#ef4444'}">
        ${s.taxNow === 0 ? '✓ Zero Tax Now' : '⚠ Tax Due'}
      </span>
      <div class="strategy-pros">
        <div class="strategy-pros-title">✅ Advantages</div>
        ${s.pros.slice(0, 3).map(p => `
          <div class="strategy-list-item">
            <span class="bullet" style="color:#10b981">▸</span>
            <p>${p}</p>
          </div>
        `).join('')}
      </div>
      <div class="strategy-cons">
        <div class="strategy-cons-title">⚠️ Watch Outs</div>
        ${s.cons.slice(0, 2).map(c => `
          <div class="strategy-list-item">
            <span class="bullet" style="color:#ef4444">▸</span>
            <p>${c}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  // Add hover effects
  grid.querySelectorAll('.strategy-card').forEach(card => {
    const accent = card.querySelector('.card-accent');
    card.addEventListener('mouseenter', () => { if (accent) accent.style.opacity = '1'; });
    card.addEventListener('mouseleave', () => { if (accent) accent.style.opacity = '0'; });
  });
}

function selectAndGoCompare(key) {
  // Stub — keeps on strategies tab but useful for future drill-down
}

// ============ RENDER: RADAR CHART ============
function renderRadarChart() {
  const ctx = document.getElementById('radarChart');
  if (!ctx) return;
  if (radarChart) radarChart.destroy();

  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: radarMetrics.map(m => m.subject),
      datasets: [
        {
          label: 'Exchange Fund',
          data: radarMetrics.map(m => m.exchange),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.12)',
          borderWidth: 2,
          pointBackgroundColor: '#6366f1',
          pointRadius: 3,
        },
        {
          label: 'Charitable Trust',
          data: radarMetrics.map(m => m.crt),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.08)',
          borderWidth: 2,
          pointBackgroundColor: '#10b981',
          pointRadius: 3,
        },
        {
          label: 'Sell & Reinvest',
          data: radarMetrics.map(m => m.sell),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.06)',
          borderWidth: 2,
          pointBackgroundColor: '#ef4444',
          pointRadius: 3,
        },
        {
          label: 'Opp Zone',
          data: radarMetrics.map(m => m.ozone),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139,92,246,0.06)',
          borderWidth: 2,
          pointBackgroundColor: '#8b5cf6',
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: 10,
          ticks: { display: false },
          grid: { color: '#1e293b' },
          angleLines: { color: '#1e293b' },
          pointLabels: {
            color: '#94a3b8',
            font: { size: 11, family: 'Inter' },
          },
        },
      },
      plugins: {
        legend: {
          labels: { color: '#94a3b8', font: { size: 11 }, padding: 16, usePointStyle: true },
        },
      },
    },
  });
}

// ============ RENDER: ROI TAB ============
function renderROI() {
  const { stockValue, costBasis, annualReturn, timeHorizon, capGainsRate } = getInputs();
  const strategies = buildStrategies(stockValue, costBasis, capGainsRate);

  // Build projection data
  const projData = Array.from({ length: timeHorizon + 1 }, (_, i) => i);

  const datasets = [
    {
      label: 'Sell & Reinvest',
      data: projData.map(yr => Math.round(strategies.sell.afterTax * Math.pow(1 + annualReturn, yr))),
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239,68,68,0.05)',
      fill: false,
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 0,
    },
    {
      label: 'Exchange Fund',
      data: projData.map(yr => Math.round(stockValue * Math.pow(1 + annualReturn * 0.935, yr))),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.08)',
      fill: true,
      borderWidth: 2.5,
      tension: 0.3,
      pointRadius: 0,
    },
    {
      label: 'Charitable Trust',
      data: projData.map(yr => Math.round(stockValue * Math.pow(1 + annualReturn * 0.94, yr))),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.05)',
      fill: false,
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 0,
    },
    {
      label: 'Opportunity Zone',
      data: projData.map(yr => {
        const val = stockValue * Math.pow(1 + annualReturn * 1.1, yr);
        return Math.round(yr >= 10 ? val * 0.95 : val);
      }),
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139,92,246,0.05)',
      fill: false,
      borderWidth: 2,
      tension: 0.3,
      borderDash: [5, 3],
      pointRadius: 0,
    },
    {
      label: 'Deferred Sales Trust',
      data: projData.map(yr => Math.round(stockValue * Math.pow(1 + annualReturn * 0.97, yr))),
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245,158,11,0.05)',
      fill: false,
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 0,
    },
    {
      label: 'Collar + Loan',
      data: projData.map(yr => Math.round(stockValue * Math.pow(1 + annualReturn * 0.92, yr))),
      borderColor: '#0ea5e9',
      backgroundColor: 'rgba(14,165,233,0.05)',
      fill: false,
      borderWidth: 2,
      tension: 0.3,
      borderDash: [3, 3],
      pointRadius: 0,
    },
  ];

  // Projection Chart
  const projCtx = document.getElementById('projectionChart');
  if (projCtx) {
    if (projectionChart) projectionChart.destroy();
    projectionChart = new Chart(projCtx, {
      type: 'line',
      data: {
        labels: projData.map(yr => 'Yr ' + yr),
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { color: '#1e293b' },
            ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 10 },
          },
          y: {
            grid: { color: '#1e293b' },
            ticks: {
              color: '#475569',
              font: { size: 10 },
              callback: v => '$' + (v / 1_000_000).toFixed(1) + 'M',
            },
          },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, padding: 12, usePointStyle: true } },
          tooltip: {
            backgroundColor: '#0f172a',
            borderColor: '#334155',
            borderWidth: 1,
            titleColor: '#94a3b8',
            bodyColor: '#e2e8f0',
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`,
            },
          },
        },
      },
    });
  }

  // Tax Drag Chart
  const taxDragCtx = document.getElementById('taxDragChart');
  if (taxDragCtx) {
    if (taxDragChart) taxDragChart.destroy();
    const sellData = projData.map(yr => Math.round(strategies.sell.afterTax * Math.pow(1 + annualReturn, yr)));
    const exchangeData = projData.map(yr => Math.round(stockValue * Math.pow(1 + annualReturn * 0.935, yr)));
    const dragData = projData.map((yr, i) => exchangeData[i] - sellData[i]);

    taxDragChart = new Chart(taxDragCtx, {
      type: 'bar',
      data: {
        labels: projData.map(yr => 'Yr ' + yr),
        datasets: [{
          label: 'Tax Drag Cost (Lost Wealth)',
          data: dragData,
          backgroundColor: projData.map((_, i) => {
            const pct = i / timeHorizon;
            return `rgba(239, 68, 68, ${0.3 + pct * 0.5})`;
          }),
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 10 },
          },
          y: {
            grid: { color: '#1e293b' },
            ticks: {
              color: '#475569',
              font: { size: 10 },
              callback: v => '$' + (v / 1_000).toFixed(0) + 'K',
            },
          },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true } },
          tooltip: {
            backgroundColor: '#0f172a',
            borderColor: '#334155',
            borderWidth: 1,
            callbacks: {
              label: ctx => `Lost wealth: ${fmt(ctx.parsed.y)}`,
            },
          },
        },
      },
    });
  }

  // ROI Summary Cards
  const cardsContainer = document.getElementById('roi-summary-cards');
  if (cardsContainer) {
    const endValues = [
      { label: 'Sell & Reinvest',  val: datasets[0].data[timeHorizon], color: '#ef4444', extra: 'Baseline after tax' },
      { label: 'Exchange Fund',    val: datasets[1].data[timeHorizon], color: '#6366f1', extra: '⭐ Best risk-adjusted' },
      { label: 'Charitable Trust', val: datasets[2].data[timeHorizon], color: '#10b981', extra: '+ income stream + deduction' },
      { label: 'Opportunity Zone', val: datasets[3].data[timeHorizon], color: '#8b5cf6', extra: 'Highest upside, illiquid' },
      { label: 'Deferred Sales',   val: datasets[4].data[timeHorizon], color: '#f59e0b', extra: 'Tax spread over time' },
      { label: 'Collar + Loan',    val: datasets[5].data[timeHorizon], color: '#0ea5e9', extra: 'Liquidity without selling' },
    ];

    cardsContainer.innerHTML = endValues.map((item, i) => `
      <div class="roi-card animate-in stagger-${i + 1}" style="border-color: ${item.color}33;">
        <div class="roi-card-label">${item.label}</div>
        <div class="roi-card-value" style="color: ${item.color}">${fmt(item.val)}</div>
        <div class="roi-card-extra">${item.extra}</div>
        <div style="margin-top:8px; font-size:11px; color: var(--text-dim);">
          ${item.val > endValues[0].val
            ? `+${fmt(item.val - endValues[0].val)} vs selling`
            : item.label === 'Sell & Reinvest'
              ? 'Baseline comparison'
              : `${fmt(item.val - endValues[0].val)} vs selling`
          }
        </div>
      </div>
    `).join('');
  }

  // Year-by-Year Table
  const table = document.getElementById('year-table');
  if (table) {
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    thead.innerHTML = `<tr>
      <th>Year</th>
      <th>Sell & Reinvest</th>
      <th>Exchange Fund</th>
      <th>Charitable Trust</th>
      <th>Opp Zone</th>
      <th>Deferred Sales</th>
      <th>Collar + Loan</th>
    </tr>`;
    
    tbody.innerHTML = projData.filter(yr => yr % (timeHorizon > 15 ? 5 : yr > 10 ? 2 : 1) === 0 || yr === timeHorizon).map(yr => `
      <tr>
        <td>Year ${yr}</td>
        ${datasets.map(ds => `<td style="color: ${ds.borderColor}">${fmtFull(ds.data[yr])}</td>`).join('')}
      </tr>
    `).join('');
  }
}

// ============ RENDER: TAX TAB ============
function renderTaxTab() {
  const { stockValue, costBasis, capGainsRate } = getInputs();
  const strategies = buildStrategies(stockValue, costBasis, capGainsRate);
  const crtDeduction = Math.round(stockValue * 0.25);

  // Tax bar chart
  const taxData = [
    { name: 'Sell Now',       tax: strategies.sell.taxNow, color: '#ef4444' },
    { name: 'CRT',            tax: -crtDeduction,          color: '#10b981' },
    { name: 'Exchange Fund',  tax: 0,                      color: '#6366f1' },
    { name: 'Deferred Sales', tax: strategies.sell.taxNow,  color: '#f59e0b' },
    { name: 'Opp Zone',       tax: 0,                      color: '#8b5cf6' },
    { name: 'Collar + Loan',  tax: 0,                      color: '#0ea5e9' },
  ];

  const taxCtx = document.getElementById('taxBarChart');
  if (taxCtx) {
    if (taxBarChart) taxBarChart.destroy();
    taxBarChart = new Chart(taxCtx, {
      type: 'bar',
      data: {
        labels: taxData.map(d => d.name),
        datasets: [{
          label: 'Immediate Tax Impact',
          data: taxData.map(d => d.tax),
          backgroundColor: taxData.map(d => d.tax > 0 ? 'rgba(239,68,68,0.5)' : d.tax < 0 ? 'rgba(16,185,129,0.5)' : 'rgba(99,102,241,0.3)'),
          borderColor: taxData.map(d => d.color),
          borderWidth: 2,
          borderRadius: 6,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: '#1e293b' },
            ticks: {
              color: '#475569',
              font: { size: 11 },
              callback: v => (v < 0 ? '−' : '') + '$' + Math.abs(v / 1_000).toFixed(0) + 'K',
            },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { size: 12, family: 'Inter' } },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            borderColor: '#334155',
            borderWidth: 1,
            callbacks: {
              label: ctx => {
                const v = ctx.parsed.x;
                if (v < 0) return `Tax Deduction: ${fmtFull(Math.abs(v))}`;
                if (v === 0) return 'No Tax Due';
                return `Tax Due: ${fmtFull(v)}`;
              },
            },
          },
        },
      },
    });
  }

  // Tax ideas
  const container = document.getElementById('tax-ideas-grid');
  if (container) {
    container.innerHTML = taxIdeas.map((idea, i) => `
      <div class="tax-idea-card animate-in stagger-${(i % 6) + 1}" style="border-color: ${idea.color}33;">
        <div class="tax-idea-title" style="color: ${idea.color}">${idea.title}</div>
        <div class="tax-idea-desc">${idea.desc}</div>
        <div class="tax-idea-impact"><p>💰 Potential: ${idea.impact}</p></div>
        <div class="tax-idea-caveat">⚠️ ${idea.caveat}</div>
      </div>
    `).join('');
  }
}

// ============ RENDER: EDUCATION TAB ============
function renderEducation() {
  const { balance, monthly, childAge, childCount, uniType, returnRate } = getEduInputs();
  const uni = UNIVERSITY_COSTS[uniType];
  const yearsUntilCollege = Math.max(0, 18 - childAge);
  const monthsUntilCollege = yearsUntilCollege * 12;

  // Project 529 growth
  const monthlyRate = returnRate / 12;
  let projected529 = balance;
  const growthByYear = [{ year: childAge, balance: Math.round(projected529), cost: 0 }];
  
  for (let m = 1; m <= monthsUntilCollege; m++) {
    projected529 = projected529 * (1 + monthlyRate) + monthly;
    if (m % 12 === 0) {
      growthByYear.push({
        year: childAge + (m / 12),
        balance: Math.round(projected529),
        cost: 0,
      });
    }
  }

  // College costs at enrollment (with inflation)
  const costAtEnrollment = uni.annual * Math.pow(1 + COLLEGE_INFLATION, yearsUntilCollege);
  const totalCollegeCost = costAtEnrollment * COLLEGE_YEARS * childCount;
  const totalCollegeCostInflated = Array.from({ length: COLLEGE_YEARS }, (_, i) =>
    uni.annual * Math.pow(1 + COLLEGE_INFLATION, yearsUntilCollege + i)
  ).reduce((a, b) => a + b, 0) * childCount;

  // Add college years to chart
  let remaining529 = projected529;
  for (let yr = 0; yr < COLLEGE_YEARS; yr++) {
    const yearCost = uni.annual * Math.pow(1 + COLLEGE_INFLATION, yearsUntilCollege + yr) * childCount;
    remaining529 = remaining529 * (1 + returnRate * 0.5) - yearCost; // conservative during drawdown
    growthByYear.push({
      year: 18 + yr + (childAge > 0 ? 0 : 1),
      balance: Math.max(0, Math.round(remaining529)),
      cost: Math.round(yearCost),
    });
  }

  const coveragePct = Math.min(200, Math.round((projected529 / totalCollegeCostInflated) * 100));
  const gap = totalCollegeCostInflated - projected529;

  // Monthly needed to close gap
  let monthlyNeeded = 0;
  if (gap > 0 && monthsUntilCollege > 0) {
    // PMT formula
    const r = monthlyRate;
    const n = monthsUntilCollege;
    monthlyNeeded = Math.round((gap - balance * Math.pow(1 + r, n)) * r / (Math.pow(1 + r, n) - 1));
    if (monthlyNeeded < 0) monthlyNeeded = 0;
  }

  // Results cards
  const resultsContainer = document.getElementById('edu-results');
  if (resultsContainer) {
    const cards = [
      {
        label: 'Projected 529 at 18',
        value: fmtFull(projected529),
        note: `${yearsUntilCollege} years of compounding`,
        color: '#6366f1',
      },
      {
        label: `Total ${uni.label} Cost`,
        value: fmtFull(totalCollegeCostInflated),
        note: `${COLLEGE_YEARS} yrs × ${childCount} child${childCount > 1 ? 'ren' : ''} (w/ 5% inflation)`,
        color: '#f59e0b',
      },
      {
        label: 'Coverage',
        value: coveragePct + '%',
        note: coveragePct >= 100 ? '✅ Fully covered!' : `Gap: ${fmtFull(Math.abs(gap))}`,
        color: coveragePct >= 100 ? '#10b981' : '#ef4444',
      },
      {
        label: coveragePct >= 100 ? 'Surplus Projected' : 'Extra Monthly Needed',
        value: coveragePct >= 100 ? fmtFull(Math.abs(gap)) : fmtFull(monthlyNeeded) + '/mo',
        note: coveragePct >= 100 ? 'Above tuition costs' : 'To fully cover tuition',
        color: coveragePct >= 100 ? '#10b981' : '#ef4444',
      },
    ];

    resultsContainer.innerHTML = cards.map((c, i) => `
      <div class="edu-result-card animate-in stagger-${i + 1}">
        <div class="edu-result-label">${c.label}</div>
        <div class="edu-result-value" style="color: ${c.color}">${c.value}</div>
        <div class="edu-result-note">${c.note}</div>
      </div>
    `).join('');
  }

  // Education Chart
  const eduCtx = document.getElementById('eduChart');
  if (eduCtx) {
    if (eduChart) eduChart.destroy();

    // Build cost line
    const costLine = growthByYear.map(g => {
      if (g.year >= 18 && g.year < 18 + COLLEGE_YEARS) {
        return g.cost;
      }
      return 0;
    });

    // Running total cost
    const cumulativeCost = [];
    let runningCost = 0;
    growthByYear.forEach(g => {
      if (g.year >= 18 && g.year < 18 + COLLEGE_YEARS) {
        runningCost += g.cost;
      }
      cumulativeCost.push(runningCost);
    });

    eduChart = new Chart(eduCtx, {
      type: 'line',
      data: {
        labels: growthByYear.map(g => 'Age ' + g.year),
        datasets: [
          {
            label: '529 Balance',
            data: growthByYear.map(g => g.balance),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.1)',
            fill: true,
            borderWidth: 2.5,
            tension: 0.3,
            pointRadius: 0,
          },
          {
            label: 'Cumulative Cost',
            data: cumulativeCost,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.08)',
            fill: true,
            borderWidth: 2,
            tension: 0.3,
            borderDash: [5, 3],
            pointRadius: 0,
          },
          {
            label: 'Annual Cost',
            data: costLine,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0.3)',
            type: 'bar',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { color: '#1e293b' },
            ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 12 },
          },
          y: {
            grid: { color: '#1e293b' },
            ticks: {
              color: '#475569',
              font: { size: 10 },
              callback: v => '$' + (v / 1_000).toFixed(0) + 'K',
            },
          },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, padding: 12 } },
          tooltip: {
            backgroundColor: '#0f172a',
            borderColor: '#334155',
            borderWidth: 1,
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${fmtFull(ctx.parsed.y)}`,
            },
          },
        },
      },
    });
  }

  // Education tips
  const tipsContainer = document.getElementById('edu-tips-grid');
  if (tipsContainer) {
    tipsContainer.innerHTML = eduTips.map(tip => `
      <div class="edu-tip-card">
        <div class="edu-tip-header">
          <span class="edu-tip-title">${tip.title}</span>
          <span class="edu-tip-tag">${tip.tag}</span>
        </div>
        <p class="edu-tip-desc">${tip.desc}</p>
      </div>
    `).join('');
  }
}

// ============ RENDER: PLAYBOOK TAB ============
function renderPlaybook() {
  const { stockValue, costBasis, annualReturn, timeHorizon, capGainsRate } = getInputs();
  const strategies = buildStrategies(stockValue, costBasis, capGainsRate);
  const crtDeduction = Math.round(stockValue * 0.25);

  // Dynamic allocation
  const exchangeAmt = Math.round(stockValue * 0.50);
  const crtAmt      = Math.round(stockValue * 0.30);
  const ozoneAmt    = Math.round(stockValue * 0.10);
  const collarAmt   = Math.round(stockValue * 0.10);

  const steps = [
    {
      step: '01', pct: '50%', amount: fmtFull(exchangeAmt),
      title: 'Exchange Fund', icon: '🔄', color: '#6366f1',
      desc: `Pool ${fmt(exchangeAmt)} into a qualified exchange fund. Zero capital gains taxes. Instantly diversified into 20-30 blue-chip stocks. Hold 7+ years for full tax-deferred benefit.`,
      outcome: `${fmt(exchangeAmt)} → ${fmt(Math.round(exchangeAmt * Math.pow(1 + annualReturn * 0.935, timeHorizon)))} (${timeHorizon}yr)`,
    },
    {
      step: '02', pct: '30%', amount: fmtFull(crtAmt),
      title: 'Charitable Trust', icon: '🏛️', color: '#10b981',
      desc: `Transfer ${fmt(crtAmt)} into a CRT. Get a ~${fmt(Math.round(crtAmt * 0.25))} tax deduction. Trust sells stock tax-free, invests the proceeds, and pays you 5-7% annually for life.`,
      outcome: `${fmt(crtAmt)} → ${fmt(Math.round(crtAmt * Math.pow(1 + annualReturn * 0.94, timeHorizon)))} + ${fmt(Math.round(crtAmt * 0.06))}/yr income`,
    },
    {
      step: '03', pct: '20%', amount: fmtFull(ozoneAmt + collarAmt),
      title: 'OZ Fund + Collar', icon: '🏙️', color: '#f59e0b',
      desc: `Deploy ${fmt(ozoneAmt)} into an Opportunity Zone fund — eliminate future gains after 10 years. Use a hedged collar on ${fmt(collarAmt)} to borrow ${fmt(Math.round(collarAmt * 0.7))} cash, no tax event.`,
      outcome: `${fmt(ozoneAmt + collarAmt)} → ${fmt(Math.round(ozoneAmt * Math.pow(1 + annualReturn * 1.1, Math.min(timeHorizon, 10)) + collarAmt * Math.pow(1 + annualReturn * 0.92, timeHorizon)))} (tax-optimized)`,
    },
  ];

  const stepsContainer = document.getElementById('playbook-steps');
  if (stepsContainer) {
    stepsContainer.innerHTML = steps.map((s, i) => `
      <div class="playbook-step animate-in stagger-${i + 1}" style="border-color: ${s.color}44;">
        <div class="playbook-step-header">
          <span class="step-number" style="color: ${s.color}">STEP ${s.step}</span>
          <span class="step-pct" style="color: #020817; background: ${s.color}">${s.pct}</span>
        </div>
        <div class="step-icon">${s.icon}</div>
        <div class="step-title" style="color: ${s.color}">${s.title}</div>
        <div class="step-amount">${s.amount}</div>
        <div class="step-desc">${s.desc}</div>
        <div class="step-outcome">
          <p>📈 ${s.outcome}</p>
        </div>
      </div>
    `).join('');
  }

  // New ideas
  const ideasContainer = document.getElementById('new-ideas-grid');
  if (ideasContainer) {
    ideasContainer.innerHTML = newInvestmentIdeas.map(idea => `
      <div class="idea-card">
        <div class="idea-header">
          <span class="idea-title">${idea.title}</span>
          <span class="idea-tag">${idea.tag}</span>
        </div>
        <p class="idea-desc">${idea.desc}</p>
      </div>
    `).join('');
  }

  // Playbook chart — hybrid strategy projection
  const pbCtx = document.getElementById('playbookChart');
  if (pbCtx) {
    if (playbookChart) playbookChart.destroy();
    
    const horizonData = Array.from({ length: timeHorizon + 1 }, (_, yr) => yr);
    
    // Hybrid combined
    const hybridData = horizonData.map(yr => {
      const exVal = exchangeAmt * Math.pow(1 + annualReturn * 0.935, yr);
      const crtVal = crtAmt * Math.pow(1 + annualReturn * 0.94, yr);
      const ozVal = ozoneAmt * Math.pow(1 + annualReturn * (yr < 10 ? 1.1 : 1.05), yr);
      const colVal = collarAmt * Math.pow(1 + annualReturn * 0.92, yr);
      return Math.round(exVal + crtVal + ozVal + colVal);
    });

    // Sell all
    const sellData = horizonData.map(yr => Math.round(strategies.sell.afterTax * Math.pow(1 + annualReturn, yr)));
    
    // Keep concentrated (do nothing)
    const holdData = horizonData.map(yr => Math.round(stockValue * Math.pow(1 + annualReturn, yr)));

    playbookChart = new Chart(pbCtx, {
      type: 'line',
      data: {
        labels: horizonData.map(yr => 'Yr ' + yr),
        datasets: [
          {
            label: '⭐ Hybrid Strategy',
            data: hybridData,
            borderColor: '#a5b4fc',
            backgroundColor: 'rgba(165,180,252,0.12)',
            fill: true,
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 0,
          },
          {
            label: 'Hold Concentrated (Do Nothing)',
            data: holdData,
            borderColor: '#64748b',
            fill: false,
            borderWidth: 1.5,
            tension: 0.3,
            borderDash: [6, 4],
            pointRadius: 0,
          },
          {
            label: 'Sell & Reinvest',
            data: sellData,
            borderColor: '#ef4444',
            fill: false,
            borderWidth: 1.5,
            tension: 0.3,
            borderDash: [3, 3],
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { color: '#1e293b' },
            ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 10 },
          },
          y: {
            grid: { color: '#1e293b' },
            ticks: {
              color: '#475569',
              font: { size: 10 },
              callback: v => '$' + (v / 1_000_000).toFixed(1) + 'M',
            },
          },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, padding: 14, usePointStyle: true } },
          tooltip: {
            backgroundColor: '#0f172a',
            borderColor: '#334155',
            borderWidth: 1,
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`,
            },
          },
        },
      },
    });
  }
}

// ============ STATE TAX RATES ============
const STATE_TAXES = {
  CA: { name: 'California', capGains: 0.133, income: 0.133, flag: '🌴' },
  NY: { name: 'New York', capGains: 0.109, income: 0.109, flag: '🗽' },
  NJ: { name: 'New Jersey', capGains: 0.1075, income: 0.1075, flag: '🏖️' },
  OR: { name: 'Oregon', capGains: 0.099, income: 0.099, flag: '🌲' },
  MN: { name: 'Minnesota', capGains: 0.0985, income: 0.0985, flag: '❄️' },
  HI: { name: 'Hawaii', capGains: 0.11, income: 0.11, flag: '🌺' },
  VT: { name: 'Vermont', capGains: 0.0875, income: 0.0875, flag: '🍁' },
  IA: { name: 'Iowa', capGains: 0.0853, income: 0.0853, flag: '🌽' },
  CO: { name: 'Colorado', capGains: 0.044, income: 0.044, flag: '⛰️' },
  IL: { name: 'Illinois', capGains: 0.0495, income: 0.0495, flag: '🏙️' },
  MA: { name: 'Massachusetts', capGains: 0.09, income: 0.09, flag: '🎓' },
  OTHER: { name: 'Other', capGains: 0, income: 0, flag: '📍' },
};

const ZERO_TAX_STATES = [
  { code: 'TX', name: 'Texas', flag: '🤠', note: 'No state income tax. Robust economy, lower cost of living.' },
  { code: 'FL', name: 'Florida', flag: '🌴', note: 'No state income tax. Popular for retirees. Homestead exemption.' },
  { code: 'NV', name: 'Nevada', flag: '🎰', note: 'No state income tax. No corporate income tax either.' },
  { code: 'WA', name: 'Washington', flag: '☕', note: 'No income tax (has 7% cap gains tax on gains >$270K).' },
  { code: 'WY', name: 'Wyoming', flag: '🦬', note: 'No state income tax. Dynasty trust–friendly.' },
  { code: 'SD', name: 'South Dakota', flag: '🏔️', note: 'No state income tax. Best trust laws in the nation.' },
  { code: 'TN', name: 'Tennessee', flag: '🎸', note: 'No income tax on wages/salaries. Hall tax eliminated 2021.' },
  { code: 'AK', name: 'Alaska', flag: '🐻', note: 'No income tax. Pays residents a Permanent Fund dividend.' },
  { code: 'NH', name: 'New Hampshire', flag: '🏔️', note: 'No income/sales tax. 3% tax on interest & dividends (ending 2027).' },
];

const relocationTips = [
  {
    title: 'Establish Genuine Domicile',
    desc: 'High-tax states (CA, NY) aggressively audit departures. You must change voter registration, driver\'s license, bank accounts, and spend 183+ days in the new state.',
    tag: 'Critical',
  },
  {
    title: 'Timing the Move',
    desc: 'Relocate BEFORE the liquidity event. Selling stock while still a CA/NY resident means full state tax applies regardless of when you move afterward.',
    tag: 'Timing',
  },
  {
    title: 'California Clawback Rules',
    desc: 'California tracks former residents for years. Maintaining significant ties (home, business, family) can result in "sourcing" income back to CA even after moving.',
    tag: 'CA Warning',
  },
  {
    title: 'Dynasty Trust in SD or NV',
    desc: 'South Dakota and Nevada allow perpetual (dynasty) trusts with no state tax. Set up a trust before relocating for multi-generational wealth transfer.',
    tag: 'Estate Plan',
  },
  {
    title: 'Washington State 7% Exception',
    desc: 'WA enacted a 7% capital gains tax on gains exceeding $270K (2024). Move to TX, FL, or NV instead if your gains are above this threshold.',
    tag: 'Watch Out',
  },
  {
    title: 'Cost of Living Offset',
    desc: 'Moving from CA/NY to TX/FL often reduces cost of living 20-40%. Factor in housing, insurance, and daily expenses — not just taxes — in your total savings calculation.',
    tag: 'Bonus Savings',
  },
];

// ============ RENDER: MONTE CARLO TAB ============
function renderMonteCarlo() {
  const { stockValue, costBasis, annualReturn, timeHorizon, capGainsRate } = getInputs();
  const volatility = (parseFloat(document.getElementById('mcVolatility')?.value) || 15) / 100;
  const numSims = parseInt(document.getElementById('mcSimulations')?.value) || 1000;
  const stressScenario = document.getElementById('mcStressTest')?.value || 'none';
  const strategies = buildStrategies(stockValue, costBasis, capGainsRate);

  // Run Monte Carlo
  function runSim(initial, returnMult, sims, years, vol) {
    const mu = annualReturn * returnMult;
    let crisisYears = [];
    if (stressScenario === '2008') crisisYears = [-0.38, 0.26, 0.15];
    else if (stressScenario === 'dotcom') crisisYears = [-0.10, -0.12, -0.22];
    else if (stressScenario === '1970s') crisisYears = [-0.10, -0.05, 0.05, -0.10, -0.05, 0.05, 0.0, -0.10, 0.0, -0.05];

    const allPaths = [];
    for (let s = 0; s < sims; s++) {
      const path = [initial];
      let val = initial;
      for (let y = 1; y <= years; y++) {
        let r;
        if (y <= crisisYears.length && stressScenario !== 'none') {
          r = crisisYears[y - 1];
        } else {
          const z = gaussianRandom();
          r = mu - 0.5 * vol * vol + vol * z;
        }
        val = val * Math.exp(r);
        path.push(Math.round(val));
      }
      allPaths.push(path);
    }
    return allPaths;
  }

  function gaussianRandom() {
    // Box-Muller transform
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  function getPercentiles(allPaths, pcts) {
    const years = allPaths[0].length;
    const result = {};
    pcts.forEach(p => result[p] = []);
    for (let y = 0; y < years; y++) {
      const vals = allPaths.map(path => path[y]).sort((a, b) => a - b);
      pcts.forEach(p => {
        const idx = Math.floor(vals.length * p / 100);
        result[p].push(vals[Math.min(idx, vals.length - 1)]);
      });
    }
    return result;
  }

  // Exchange Fund simulation
  const exchangePaths = runSim(stockValue, 0.935, numSims, timeHorizon, volatility);
  const exchangePcts = getPercentiles(exchangePaths, [5, 25, 50, 75, 95]);

  // Sell & Reinvest simulation
  const sellPaths = runSim(strategies.sell.afterTax, 1, numSims, timeHorizon, volatility);
  const sellPcts = getPercentiles(sellPaths, [5, 25, 50, 75, 95]);

  const labels = Array.from({ length: timeHorizon + 1 }, (_, i) => 'Yr ' + i);

  function buildConeChart(ctx, pcts, title, color) {
    return new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '95th Percentile',
            data: pcts[95],
            borderColor: color + '44',
            backgroundColor: color + '08',
            fill: '+1',
            borderWidth: 1,
            tension: 0.3,
            pointRadius: 0,
          },
          {
            label: '75th Percentile',
            data: pcts[75],
            borderColor: color + '66',
            backgroundColor: color + '12',
            fill: '+1',
            borderWidth: 1.5,
            tension: 0.3,
            pointRadius: 0,
          },
          {
            label: 'Median (50th)',
            data: pcts[50],
            borderColor: color,
            backgroundColor: 'transparent',
            fill: false,
            borderWidth: 2.5,
            tension: 0.3,
            pointRadius: 0,
          },
          {
            label: '25th Percentile',
            data: pcts[25],
            borderColor: color + '66',
            backgroundColor: color + '12',
            fill: '+1',
            borderWidth: 1.5,
            tension: 0.3,
            pointRadius: 0,
          },
          {
            label: '5th Percentile',
            data: pcts[5],
            borderColor: color + '44',
            backgroundColor: 'transparent',
            fill: false,
            borderWidth: 1,
            tension: 0.3,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { color: '#1e293b' },
            ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 10 },
          },
          y: {
            grid: { color: '#1e293b' },
            ticks: {
              color: '#475569',
              font: { size: 10 },
              callback: v => '$' + (v / 1_000_000).toFixed(1) + 'M',
            },
          },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 10 }, usePointStyle: true, padding: 10 } },
          tooltip: {
            backgroundColor: '#0f172a',
            borderColor: '#334155',
            borderWidth: 1,
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`,
            },
          },
        },
      },
    });
  }

  // Render exchange cone
  const exCtx = document.getElementById('mcExchangeChart');
  if (exCtx) {
    if (mcExchangeChart) mcExchangeChart.destroy();
    mcExchangeChart = buildConeChart(exCtx, exchangePcts, 'Exchange Fund', '#6366f1');
  }

  // Render sell cone
  const sellCtx = document.getElementById('mcSellChart');
  if (sellCtx) {
    if (mcSellChart) mcSellChart.destroy();
    mcSellChart = buildConeChart(sellCtx, sellPcts, 'Sell & Reinvest', '#ef4444');
  }

  // MC Stats
  const statsGrid = document.getElementById('mc-stats-grid');
  if (statsGrid) {
    const exMedian = exchangePcts[50][timeHorizon];
    const sellMedian = sellPcts[50][timeHorizon];
    const exWorst = exchangePcts[5][timeHorizon];
    const exBest = exchangePcts[95][timeHorizon];
    const probExWins = exchangePaths.filter((p, i) => p[timeHorizon] > sellPaths[i][timeHorizon]).length / numSims * 100;

    const stats = [
      { label: 'Exchange Fund Median', value: fmt(exMedian), note: `${timeHorizon}-year 50th percentile`, color: '#6366f1' },
      { label: 'Sell & Reinvest Median', value: fmt(sellMedian), note: `${timeHorizon}-year 50th percentile`, color: '#ef4444' },
      { label: 'Exchange Fund Range', value: `${fmt(exWorst)} – ${fmt(exBest)}`, note: '5th to 95th percentile', color: '#a5b4fc' },
      { label: 'Prob. Exchange Wins', value: probExWins.toFixed(0) + '%', note: `out of ${numSims.toLocaleString()} simulations`, color: probExWins > 50 ? '#10b981' : '#ef4444' },
    ];

    statsGrid.innerHTML = stats.map((s, i) => `
      <div class="mc-stat-card animate-in stagger-${i + 1}">
        <div class="mc-stat-label">${s.label}</div>
        <div class="mc-stat-value" style="color: ${s.color}">${s.value}</div>
        <div class="mc-stat-note">${s.note}</div>
      </div>
    `).join('');
  }

  // Sensitivity Analysis
  const sensCtx = document.getElementById('sensitivityChart');
  if (sensCtx) {
    if (sensitivityChart) sensitivityChart.destroy();
    const returnScenarios = [0.03, 0.05, 0.07, 0.09, 0.11, 0.13];
    const stratNames = ['Sell & Reinvest', 'Exchange Fund', 'Charitable Trust', 'Opp Zone'];
    const colors = ['#ef4444', '#6366f1', '#10b981', '#8b5cf6'];

    const sensDatasets = stratNames.map((name, si) => ({
      label: name,
      data: returnScenarios.map(r => {
        switch (si) {
          case 0: return Math.round(strategies.sell.afterTax * Math.pow(1 + r, timeHorizon));
          case 1: return Math.round(stockValue * Math.pow(1 + r * 0.935, timeHorizon));
          case 2: return Math.round(stockValue * Math.pow(1 + r * 0.94, timeHorizon));
          case 3: return Math.round(stockValue * Math.pow(1 + r * 1.1, timeHorizon));
        }
      }),
      borderColor: colors[si],
      backgroundColor: colors[si] + '30',
      borderWidth: 2,
      borderRadius: 4,
    }));

    sensitivityChart = new Chart(sensCtx, {
      type: 'bar',
      data: {
        labels: returnScenarios.map(r => (r * 100).toFixed(0) + '% Return'),
        datasets: sensDatasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
          y: {
            grid: { color: '#1e293b' },
            ticks: { color: '#475569', font: { size: 10 }, callback: v => '$' + (v / 1_000_000).toFixed(1) + 'M' },
          },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, padding: 12 } },
          tooltip: {
            backgroundColor: '#0f172a',
            borderColor: '#334155',
            borderWidth: 1,
            callbacks: { label: ctx => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` },
          },
        },
      },
    });
  }
}

// ============ RENDER: INCOME & BREAKEVEN TAB ============
function renderIncomeBreakeven() {
  const { stockValue, costBasis, annualReturn, timeHorizon, capGainsRate } = getInputs();
  const strategies = buildStrategies(stockValue, costBasis, capGainsRate);

  const years = Array.from({ length: timeHorizon + 1 }, (_, i) => i);

  // Annual income from each strategy
  // CRT: 6% annual payout of trust value
  // Exchange Fund: ~1.5% dividends from diversified portfolio
  // Sell & Reinvest: ~2% dividends from diversified
  // Collar: dividends from stock minus interest (~net 0-1%)
  // Opp Zone: ~3-4% rental/development income
  // DST: installment payments (deferred)

  const crtPayoutRate = 0.06;
  const exchangeDivRate = 0.015;
  const sellDivRate = 0.02;
  const collarNetRate = 0.005;
  const ozoneIncomeRate = 0.035;
  const dstPayoutRate = 0.04;

  const incomeData = {
    crt: years.map(yr => Math.round(stockValue * Math.pow(1 + annualReturn * 0.94, yr) * crtPayoutRate)),
    exchange: years.map(yr => Math.round(stockValue * Math.pow(1 + annualReturn * 0.935, yr) * exchangeDivRate)),
    sell: years.map(yr => Math.round(strategies.sell.afterTax * Math.pow(1 + annualReturn, yr) * sellDivRate)),
    collar: years.map(yr => Math.round(stockValue * Math.pow(1 + annualReturn * 0.92, yr) * collarNetRate)),
    ozone: years.map(yr => yr >= 10 ? Math.round(stockValue * Math.pow(1 + annualReturn * 1.1, yr) * ozoneIncomeRate) : 0),
    dst: years.map(yr => Math.round(stockValue * dstPayoutRate)), // fixed payout
  };

  // Income Chart
  const incCtx = document.getElementById('incomeChart');
  if (incCtx) {
    if (incomeChart) incomeChart.destroy();
    incomeChart = new Chart(incCtx, {
      type: 'line',
      data: {
        labels: years.map(yr => 'Yr ' + yr),
        datasets: [
          { label: 'CRT Income', data: incomeData.crt, borderColor: '#10b981', borderWidth: 2.5, tension: 0.3, pointRadius: 0, fill: false },
          { label: 'Sell Dividends', data: incomeData.sell, borderColor: '#ef4444', borderWidth: 2, tension: 0.3, pointRadius: 0, fill: false },
          { label: 'Exchange Dividends', data: incomeData.exchange, borderColor: '#6366f1', borderWidth: 2, tension: 0.3, pointRadius: 0, fill: false },
          { label: 'Opp Zone (post-yr10)', data: incomeData.ozone, borderColor: '#8b5cf6', borderWidth: 2, tension: 0.3, borderDash: [5, 3], pointRadius: 0, fill: false },
          { label: 'DST Payout', data: incomeData.dst, borderColor: '#f59e0b', borderWidth: 2, tension: 0.3, borderDash: [3, 3], pointRadius: 0, fill: false },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 10 } },
          y: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => '$' + (v / 1000).toFixed(0) + 'K' } },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, padding: 10 } },
          tooltip: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, callbacks: { label: ctx => `${ctx.dataset.label}: ${fmtFull(ctx.parsed.y)}/yr` } },
        },
      },
    });
  }

  // Breakeven Chart — when does each strategy overtake selling?
  const bkCtx = document.getElementById('breakevenChart');
  if (bkCtx) {
    if (breakevenChart) breakevenChart.destroy();

    const sellWealth = years.map(yr => strategies.sell.afterTax * Math.pow(1 + annualReturn, yr));
    const exchangeDiff = years.map(yr => stockValue * Math.pow(1 + annualReturn * 0.935, yr) - sellWealth[yr]);
    const crtDiff = years.map(yr => stockValue * Math.pow(1 + annualReturn * 0.94, yr) - sellWealth[yr]);
    const ozoneDiff = years.map(yr => {
      const val = stockValue * Math.pow(1 + annualReturn * 1.1, yr);
      return (yr >= 10 ? val * 0.95 : val) - sellWealth[yr];
    });

    breakevenChart = new Chart(bkCtx, {
      type: 'line',
      data: {
        labels: years.map(yr => 'Yr ' + yr),
        datasets: [
          { label: 'Exchange vs Sell', data: exchangeDiff, borderColor: '#6366f1', borderWidth: 2.5, tension: 0.3, pointRadius: 0, fill: { target: 'origin', above: 'rgba(99,102,241,0.08)', below: 'rgba(239,68,68,0.08)' } },
          { label: 'CRT vs Sell', data: crtDiff, borderColor: '#10b981', borderWidth: 2, tension: 0.3, pointRadius: 0, fill: false },
          { label: 'Opp Zone vs Sell', data: ozoneDiff, borderColor: '#8b5cf6', borderWidth: 2, tension: 0.3, borderDash: [5, 3], pointRadius: 0, fill: false },
          { label: 'Breakeven Line', data: years.map(() => 0), borderColor: '#475569', borderWidth: 1, borderDash: [4, 4], pointRadius: 0, fill: false },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 10 } },
          y: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => (v >= 0 ? '+' : '') + '$' + (v / 1000).toFixed(0) + 'K' } },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, padding: 10 } },
          tooltip: {
            backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1,
            callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y >= 0 ? '+' : ''}${fmt(ctx.parsed.y)}` },
          },
        },
      },
    });
  }

  // Income summary cards
  const cardsContainer = document.getElementById('income-summary-cards');
  if (cardsContainer) {
    const yr10 = Math.min(10, timeHorizon);
    const yr20 = timeHorizon;
    const cumCRT = incomeData.crt.reduce((a, b) => a + b, 0);
    const cumSell = incomeData.sell.reduce((a, b) => a + b, 0);
    const cumExchange = incomeData.exchange.reduce((a, b) => a + b, 0);

    // Find breakeven years
    const sellWealth = years.map(yr => strategies.sell.afterTax * Math.pow(1 + annualReturn, yr));
    let exBreakeven = 'Yr 0';
    for (let yr = 0; yr <= timeHorizon; yr++) {
      if (stockValue * Math.pow(1 + annualReturn * 0.935, yr) > sellWealth[yr]) {
        exBreakeven = 'Year ' + yr;
        break;
      }
    }

    const cards = [
      { label: 'CRT Total Income', value: fmt(cumCRT), extra: `Over ${timeHorizon} years @ 6% payout`, color: '#10b981' },
      { label: 'Exchange Breakeven', value: exBreakeven, extra: 'When Exchange Fund overtakes Sell', color: '#6366f1' },
      { label: 'CRT Year 1 Income', value: fmtFull(incomeData.crt[1] || 0) + '/yr', extra: 'First year payout', color: '#10b981' },
      { label: 'CRT Year ' + yr20 + ' Income', value: fmtFull(incomeData.crt[yr20] || 0) + '/yr', extra: 'Final year payout', color: '#10b981' },
      { label: 'Sell Cumulative Dividends', value: fmt(cumSell), extra: `Over ${timeHorizon} years @ 2% yield`, color: '#ef4444' },
      { label: 'Income Advantage (CRT)', value: '+' + fmt(cumCRT - cumSell), extra: 'CRT total income minus Sell dividends', color: cumCRT > cumSell ? '#10b981' : '#ef4444' },
    ];

    cardsContainer.innerHTML = cards.map((c, i) => `
      <div class="roi-card animate-in stagger-${i + 1}" style="border-color: ${c.color}33;">
        <div class="roi-card-label">${c.label}</div>
        <div class="roi-card-value" style="color: ${c.color}">${c.value}</div>
        <div class="roi-card-extra">${c.extra}</div>
      </div>
    `).join('');
  }

  // Cumulative income chart
  const cumCtx = document.getElementById('cumulativeIncomeChart');
  if (cumCtx) {
    if (cumulativeIncomeChart) cumulativeIncomeChart.destroy();

    function cumSum(arr) {
      let total = 0;
      return arr.map(v => { total += v; return total; });
    }

    cumulativeIncomeChart = new Chart(cumCtx, {
      type: 'line',
      data: {
        labels: years.map(yr => 'Yr ' + yr),
        datasets: [
          { label: 'CRT Cumulative', data: cumSum(incomeData.crt), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', fill: true, borderWidth: 2.5, tension: 0.3, pointRadius: 0 },
          { label: 'Sell Dividends Cumulative', data: cumSum(incomeData.sell), borderColor: '#ef4444', fill: false, borderWidth: 2, tension: 0.3, pointRadius: 0 },
          { label: 'Exchange Dividends Cumulative', data: cumSum(incomeData.exchange), borderColor: '#6366f1', fill: false, borderWidth: 2, tension: 0.3, pointRadius: 0 },
          { label: 'DST Cumulative', data: cumSum(incomeData.dst), borderColor: '#f59e0b', fill: false, borderWidth: 2, tension: 0.3, borderDash: [5, 3], pointRadius: 0 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 10 } },
          y: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => '$' + (v / 1000).toFixed(0) + 'K' } },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, padding: 10 } },
          tooltip: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, callbacks: { label: ctx => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` } },
        },
      },
    });
  }
}

// ============ RENDER: STATE RELOCATION TAB ============
function renderRelocation() {
  const { stockValue, costBasis } = getInputs();
  const gain = Math.max(0, stockValue - costBasis);
  const currentStateCode = document.getElementById('currentState')?.value || 'CA';
  const annualIncome = parseFloat(document.getElementById('annualIncome')?.value) || 500000;
  const yearsAfter = parseInt(document.getElementById('yearsInNewState')?.value) || 10;
  const currentState = STATE_TAXES[currentStateCode] || STATE_TAXES.CA;
  if (currentStateCode === 'OTHER') {
    currentState.capGains = (parseFloat(document.getElementById('stateRate')?.value) || 0) / 100;
    currentState.income = currentState.capGains;
  }

  const capGainsSavings = Math.round(gain * currentState.capGains);
  const annualIncomeSavings = Math.round(annualIncome * currentState.income);

  // Relocation cards
  const grid = document.getElementById('relocation-grid');
  if (grid) {
    // Current state card
    let html = `
      <div class="relocation-card current-state">
        <div class="relocation-state-flag">${currentState.flag}</div>
        <div class="relocation-state-name">${currentState.name} (Current)</div>
        <div class="relocation-rate" style="color: #ef4444">${(currentState.capGains * 100).toFixed(1)}%</div>
        <div class="relocation-savings" style="color: #ef4444">
          State tax on gains: ${fmtFull(capGainsSavings)}
        </div>
        <div class="relocation-detail">Annual income tax: ${fmtFull(annualIncomeSavings)}/yr</div>
      </div>
    `;

    // Zero-tax state cards
    ZERO_TAX_STATES.slice(0, 8).forEach(st => {
      const totalSavings = capGainsSavings + (annualIncomeSavings * yearsAfter);
      html += `
        <div class="relocation-card">
          <div class="relocation-state-flag">${st.flag}</div>
          <div class="relocation-state-name">${st.name}</div>
          <div class="relocation-rate" style="color: #10b981">0%</div>
          <div class="relocation-savings" style="color: #10b981">
            Save: ${fmtFull(totalSavings)} over ${yearsAfter}yr
          </div>
          <div class="relocation-detail">${st.note}</div>
        </div>
      `;
    });

    grid.innerHTML = html;
  }

  // Relocation chart
  const relCtx = document.getElementById('relocationChart');
  if (relCtx) {
    if (relocationChart) relocationChart.destroy();
    const yearsArr = Array.from({ length: yearsAfter + 1 }, (_, i) => i);
    const colors = ['#10b981', '#6366f1', '#f59e0b', '#8b5cf6', '#0ea5e9'];
    const topStates = ZERO_TAX_STATES.slice(0, 5);

    const datasets = topStates.map((st, si) => ({
      label: st.name,
      data: yearsArr.map(yr => yr === 0 ? capGainsSavings : capGainsSavings + (annualIncomeSavings * yr)),
      borderColor: colors[si],
      backgroundColor: si === 0 ? colors[si] + '15' : 'transparent',
      fill: si === 0,
      borderWidth: si === 0 ? 2.5 : 2,
      tension: 0.3,
      pointRadius: 0,
    }));

    relocationChart = new Chart(relCtx, {
      type: 'line',
      data: {
        labels: yearsArr.map(yr => 'Yr ' + yr),
        datasets,
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 } } },
          y: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => '$' + (v / 1000).toFixed(0) + 'K' } },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, padding: 12 } },
          tooltip: {
            backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1,
            callbacks: { label: ctx => `${ctx.dataset.label}: ${fmtFull(ctx.parsed.y)} saved` },
          },
        },
      },
    });
  }

  // Relocation tips
  const tipsContainer = document.getElementById('relocation-tips');
  if (tipsContainer) {
    tipsContainer.innerHTML = relocationTips.map(tip => `
      <div class="edu-tip-card">
        <div class="edu-tip-header">
          <span class="edu-tip-title">${tip.title}</span>
          <span class="edu-tip-tag">${tip.tag}</span>
        </div>
        <p class="edu-tip-desc">${tip.desc}</p>
      </div>
    `).join('');
  }
}

// ============ EVENT LISTENERS ============
function initInputListeners() {
  const scenarioInputs = ['stockValue', 'costBasis', 'annualReturn', 'timeHorizon', 'taxBracket', 'stateRate'];
  const eduInputs = ['edu529Balance', 'eduMonthlyContrib', 'eduChildAge', 'eduChildCount', 'eduType', 'edu529Return'];
  const relocationInputs = ['currentState', 'annualIncome', 'yearsInNewState'];

  scenarioInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', debounce(() => {
        updateLiveSummary();
        const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
        if (activeTab) rebuildCurrentTab(activeTab);
      }, 300));
    }
  });

  eduInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', debounce(() => {
        const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
        if (activeTab === 'education') renderEducation();
      }, 300));
    }
  });

  relocationInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', debounce(() => {
        const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
        if (activeTab === 'relocation') renderRelocation();
      }, 300));
    }
  });

  // Estate inputs
  const estateInputs = ['totalNetWorth', 'currentAge', 'filingStatus', 'estateGrowth', 'lifeExpectancy', 'numHeirs'];
  estateInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', debounce(() => {
        const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
        if (activeTab === 'estate') renderEstate();
      }, 300));
    }
  });

  // Retirement inputs
  const retireInputs = ['retireAge', 'retireSpending', 'socialSecurity', 'otherRetireAssets', 'retireInflation', 'ssStartAge'];
  retireInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', debounce(() => {
        const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
        if (activeTab === 'retirement') renderRetirement();
      }, 300));
    }
  });

  // Monte Carlo run button
  const mcBtn = document.getElementById('runMonteCarlo');
  if (mcBtn) {
    mcBtn.addEventListener('click', () => {
      mcBtn.classList.add('running');
      mcBtn.textContent = '⏳ Running...';
      setTimeout(() => {
        renderMonteCarlo();
        mcBtn.classList.remove('running');
        mcBtn.textContent = '▶ Run Simulation';
      }, 100);
    });
  }

  // 1031 Exchange inputs
  const exchange1031Inputs = ['exchangePropertyValue', 'exchangeCostBasis', 'exchangeTargetValue', 'exchangeCapRate', 'exchangeHoldPeriod', 'exchangeAppreciation', 'exchangeDepreciation', 'exchangeLeverage', 'exchangeMortgageRate'];
  exchange1031Inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', debounce(() => {
        const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
        if (activeTab === '1031exchange') render1031Exchange();
      }, 300));
    }
  });

  // Equity inputs
  const equityInputs = ['eqOptionType', 'eqShares', 'eqStrike', 'eqCurrentFmv', 'eqExitPrice', 'eqQsbs', 'eqOrdinaryRate', 'eqAmtRate'];
  equityInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', debounce(() => {
        const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
        if (activeTab === 'equity') renderEquity();
      }, 300));
    }
  });

  // AQR inputs
  const aqrInputs = ['aqrPortfolioSize', 'aqrHorizon', 'aqrRiskTolerance', 'aqrLeverage', 'aqrInflation', 'aqrRebalance'];
  aqrInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', debounce(() => {
        const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
        if (activeTab === 'aqr') renderAQR();
      }, 300));
    }
  });

  // Insurance inputs
  const insuranceInputs = ['insurancePremium', 'insurancePremiumYears', 'insuranceAge', 'insuranceCoverage', 'insuranceTaxBracket', 'insuranceAltReturn'];
  insuranceInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', debounce(() => {
        const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
        if (activeTab === 'insurance') renderInsurance();
      }, 300));
    }
  });

  // Net Worth inputs
  const nwInputs = ['nwStocks','nwRealEstate','nwRetirement','nwRothIra','nwPrivateEquity','nwCrypto','nwBusiness','nwCash','nwLiabilities'];
  nwInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', debounce(() => {
      if (document.querySelector('.tab-btn.active')?.dataset.tab === 'networth') renderNetWorth();
    }, 300));
  });

  // Roth inputs
  ['rothIraBalance','rothCurrentAge','rothConversionYears','rothAnnualConversion','rothReturnRate','rothTaxBracket'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', debounce(() => {
      if (document.querySelector('.tab-btn.active')?.dataset.tab === 'roth') renderRothConversion();
    }, 300));
  });

  // RMD inputs
  ['rmdIraBalance','rmdCurrentAge','rmdReturnRate','rmdTaxBracket'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', debounce(() => {
      if (document.querySelector('.tab-btn.active')?.dataset.tab === 'rmd') renderRMD();
    }, 300));
  });

  // Business Sale inputs
  ['bizValue','bizBasis','bizEntityType','bizInstallments','bizInstallRate','bizQsbs','bizTaxBracket'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', debounce(() => {
      if (document.querySelector('.tab-btn.active')?.dataset.tab === 'businesssale') renderBusinessSale();
    }, 300));
  });
}

function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ============ ESTATE & WEALTH TRANSFER TAB ============
const ESTATE_EXEMPTION_2025 = 13_610_000;  // per person
const ESTATE_EXEMPTION_2026 = 7_000_000;   // after sunset
const ESTATE_TAX_RATE = 0.40;
const ANNUAL_GIFT_EXCLUSION = 18_000;      // per recipient per year

const estateTips = [
  {
    title: 'Annual Gift Exclusion',
    desc: `Gift up to $${(ANNUAL_GIFT_EXCLUSION).toLocaleString()} per recipient per year (${(ANNUAL_GIFT_EXCLUSION * 2).toLocaleString()} if married) completely tax-free. Over time, this removes substantial value from your taxable estate.`,
    tag: 'Basic',
  },
  {
    title: 'Grantor Retained Annuity Trust (GRAT)',
    desc: 'Transfer appreciating assets into a GRAT. You receive annuity payments back, and any growth above the IRS hurdle rate passes to heirs gift-tax free. "Zeroed-out" GRATs have minimal gift tax cost.',
    tag: 'Advanced',
  },
  {
    title: 'Irrevocable Life Insurance Trust (ILIT)',
    desc: 'Life insurance proceeds go directly to the trust, bypassing your taxable estate entirely. A $5M policy outside your estate saves $2M+ in estate taxes.',
    tag: 'Insurance',
  },
  {
    title: 'Spousal Lifetime Access Trust (SLAT)',
    desc: 'Use your estate exemption NOW before the 2026 sunset. A SLAT lets you gift to an irrevocable trust that your spouse can still access — locking in the higher exemption.',
    tag: '⚠️ 2026 Sunset',
  },
  {
    title: 'Dynasty Trust (SD/NV)',
    desc: 'Establish a perpetual trust in South Dakota or Nevada that avoids estate taxes across multiple generations. Assets compound tax-free for 100+ years.',
    tag: 'Multi-Gen',
  },
  {
    title: 'Charitable Lead Trust (CLT)',
    desc: 'The trust pays income to charity for a set period, then the remainder passes to heirs at a reduced gift/estate tax value. Best when interest rates are low.',
    tag: 'Charitable',
  },
  {
    title: 'Family Limited Partnership (FLP)',
    desc: 'Transfer business/investment assets into an FLP, then gift limited partnership interests at a discount (typically 25-35% valuation discount for lack of control/marketability).',
    tag: 'Discount',
  },
  {
    title: '2026 Exemption Sunset Warning',
    desc: 'The current $13.61M exemption is scheduled to drop to ~$7M in 2026. If you haven\'t used your exemption, you should consider doing so before it sunset — the IRS has confirmed "no clawback" on gifts made under the higher exemption.',
    tag: '⚠️ Critical',
  },
];

function renderEstate() {
  const netWorth = parseFloat(document.getElementById('totalNetWorth')?.value) || 5_000_000;
  const currentAge = parseInt(document.getElementById('currentAge')?.value) || 55;
  const filingStatus = document.getElementById('filingStatus')?.value || 'married';
  const estateGrowth = (parseFloat(document.getElementById('estateGrowth')?.value) || 6) / 100;
  const lifeExpect = parseInt(document.getElementById('lifeExpectancy')?.value) || 85;
  const numHeirs = parseInt(document.getElementById('numHeirs')?.value) || 2;

  const yearsToPass = Math.max(1, lifeExpect - currentAge);
  const exemption = filingStatus === 'married' ? ESTATE_EXEMPTION_2025 * 2 : ESTATE_EXEMPTION_2025;
  const exemption2026 = filingStatus === 'married' ? ESTATE_EXEMPTION_2026 * 2 : ESTATE_EXEMPTION_2026;

  // Project estate value
  const estateAtDeath = netWorth * Math.pow(1 + estateGrowth, yearsToPass);
  const taxableEstate = Math.max(0, estateAtDeath - exemption);
  const taxableEstate2026 = Math.max(0, estateAtDeath - exemption2026);
  const estateTax = Math.round(taxableEstate * ESTATE_TAX_RATE);
  const estateTax2026 = Math.round(taxableEstate2026 * ESTATE_TAX_RATE);
  const toHeirsNoPlanning = estateAtDeath - estateTax2026;  // worst case
  const toHeirsWithPlanning = estateAtDeath - estateTax;    // use current exemption
  const perHeir = Math.round(toHeirsWithPlanning / numHeirs);

  // Annual gifting impact
  const annualGiftPerHeir = filingStatus === 'married' ? ANNUAL_GIFT_EXCLUSION * 2 : ANNUAL_GIFT_EXCLUSION;
  const totalGifted = annualGiftPerHeir * numHeirs * yearsToPass;
  const estateAfterGifting = Math.max(0, estateAtDeath - totalGifted);
  const taxAfterGifting = Math.round(Math.max(0, estateAfterGifting - exemption) * ESTATE_TAX_RATE);

  // Results cards
  const resultsContainer = document.getElementById('estate-results');
  if (resultsContainer) {
    const cards = [
      { label: 'Estate at Death', value: fmt(estateAtDeath), note: `Growing ${(estateGrowth*100).toFixed(0)}%/yr for ${yearsToPass} years`, color: '#6366f1' },
      { label: 'Estate Tax (2026 Sunset)', value: fmt(estateTax2026), note: `40% rate on ${fmt(taxableEstate2026)} above ${fmt(exemption2026)} exemption`, color: '#ef4444' },
      { label: 'To Heirs (No Planning)', value: fmt(toHeirsNoPlanning), note: `${fmt(Math.round(toHeirsNoPlanning / numHeirs))} per heir`, color: '#f59e0b' },
      { label: 'Tax Saved with Planning', value: fmt(estateTax2026 - estateTax), note: `Using SLAT/gifts before sunset`, color: '#10b981' },
    ];

    resultsContainer.innerHTML = cards.map((c, i) => `
      <div class="edu-result-card animate-in stagger-${i + 1}">
        <div class="edu-result-label">${c.label}</div>
        <div class="edu-result-value" style="color: ${c.color}">${c.value}</div>
        <div class="edu-result-note">${c.note}</div>
      </div>
    `).join('');
  }

  // Estate chart — value & tax over time
  const estCtx = document.getElementById('estateChart');
  if (estCtx) {
    if (estateChart) estateChart.destroy();
    const ages = Array.from({ length: yearsToPass + 1 }, (_, i) => currentAge + i);
    const estateValues = ages.map((_, i) => Math.round(netWorth * Math.pow(1 + estateGrowth, i)));
    const taxExposure2026 = estateValues.map(v => Math.round(Math.max(0, v - exemption2026) * ESTATE_TAX_RATE));
    const taxExposureCurrent = estateValues.map(v => Math.round(Math.max(0, v - exemption) * ESTATE_TAX_RATE));

    estateChart = new Chart(estCtx, {
      type: 'line',
      data: {
        labels: ages.map(a => 'Age ' + a),
        datasets: [
          { label: 'Estate Value', data: estateValues, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)', fill: true, borderWidth: 2.5, tension: 0.3, pointRadius: 0 },
          { label: 'Tax (After 2026 Sunset)', data: taxExposure2026, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', fill: true, borderWidth: 2, tension: 0.3, pointRadius: 0 },
          { label: 'Tax (If Use Exemption Now)', data: taxExposureCurrent, borderColor: '#f59e0b', fill: false, borderWidth: 2, tension: 0.3, borderDash: [5, 3], pointRadius: 0 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 10 } },
          y: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => '$' + (v / 1_000_000).toFixed(1) + 'M' } },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, padding: 10 } },
          tooltip: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, callbacks: { label: ctx => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` } },
        },
      },
    });
  }

  // Transfer strategy comparison bar chart
  const trCtx = document.getElementById('transferChart');
  if (trCtx) {
    if (transferChart) transferChart.destroy();
    const strategies = [
      { name: 'No Planning (2026)', net: toHeirsNoPlanning, color: '#ef4444' },
      { name: 'Use Exemption Now', net: toHeirsWithPlanning, color: '#f59e0b' },
      { name: 'Annual Gifting', net: estateAfterGifting - taxAfterGifting + totalGifted, color: '#10b981' },
      { name: 'GRAT + Gifts', net: Math.round(estateAtDeath * 0.92), color: '#6366f1' },
      { name: 'Dynasty Trust', net: Math.round(estateAtDeath * 0.95), color: '#8b5cf6' },
      { name: 'SLAT + ILIT', net: Math.round(estateAtDeath * 0.93), color: '#0ea5e9' },
    ];

    transferChart = new Chart(trCtx, {
      type: 'bar',
      data: {
        labels: strategies.map(s => s.name),
        datasets: [{
          label: 'Net to Heirs',
          data: strategies.map(s => s.net),
          backgroundColor: strategies.map(s => s.color + '90'),
          borderColor: strategies.map(s => s.color),
          borderWidth: 2,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => '$' + (v / 1_000_000).toFixed(1) + 'M' } },
          y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11, family: 'Inter' } } },
        },
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, callbacks: { label: ctx => `Net to heirs: ${fmtFull(ctx.parsed.x)}` } },
        },
      },
    });
  }

  // Sankey Chart
  const skCtx = document.getElementById('estateSankeyChart');
  if (skCtx) {
    if (estateSankeyChart) estateSankeyChart.destroy();
    
    const charity = Math.round(estateAtDeath * 0.10); // Assume 10% to charity to show flow
    const netGross = estateAtDeath - charity;
    const usedExemption = Math.min(netGross, exemption2026);
    const taxable = Math.max(0, netGross - usedExemption);
    const taxes = Math.round(taxable * ESTATE_TAX_RATE);
    const netTaxable = taxable - taxes;
    const totalHeirs = netTaxable + usedExemption;

    const lGross = `Gross Estate (${fmt(estateAtDeath)})`;
    const lCharity = `Charity (${fmt(charity)})`;
    const lExempt = `Exemption (${fmt(usedExemption)})`;
    const lTaxable = `Taxable (${fmt(taxable)})`;
    const lTaxes = `Estate Taxes (${fmt(taxes)})`;
    const lHeirs = `Net to Heirs (${fmt(totalHeirs)})`;

    const data = [
      { from: lGross, to: lCharity, flow: charity },
      { from: lGross, to: lExempt, flow: usedExemption },
      { from: lGross, to: lTaxable, flow: taxable },
      { from: lTaxable, to: lTaxes, flow: taxes },
      { from: lTaxable, to: lHeirs, flow: netTaxable },
      { from: lExempt, to: lHeirs, flow: usedExemption }
    ].filter(d => d.flow > 0);

    const colors = {
      [lGross]: '#94a3b8',
      [lCharity]: '#0ea5e9',
      [lExempt]: '#10b981',
      [lTaxable]: '#f59e0b',
      [lTaxes]: '#ef4444',
      [lHeirs]: '#6366f1'
    };

    estateSankeyChart = new Chart(skCtx, {
      type: 'sankey',
      data: {
        datasets: [{
          label: 'Estate Wealth Flow',
          data: data,
          colorFrom: c => (c.raw ? colors[c.raw.from] : '#334155'),
          colorTo: c => (c.raw ? colors[c.raw.to] : '#334155'),
          colorMode: 'gradient',
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          tooltip: {
            backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1,
            callbacks: {
              label: ctx => `${ctx.raw && ctx.raw.from ? ctx.raw.from : '?'} → ${ctx.raw && ctx.raw.to ? ctx.raw.to : '?'}`
            }
          }
        }
      }
    });
  }

  // Estate tips
  const tipsContainer = document.getElementById('estate-tips');
  if (tipsContainer) {
    tipsContainer.innerHTML = estateTips.map(tip => `
      <div class="edu-tip-card">
        <div class="edu-tip-header">
          <span class="edu-tip-title">${tip.title}</span>
          <span class="edu-tip-tag">${tip.tag}</span>
        </div>
        <p class="edu-tip-desc">${tip.desc}</p>
      </div>
    `).join('');
  }
}

// ============ RETIREMENT READINESS TAB ============
const retireTips = [
  {
    title: 'The 4% Rule',
    desc: 'The traditional "safe withdrawal rate" suggests withdrawing 4% of your portfolio in year one, adjusting for inflation each year. With a $2M portfolio, that\'s $80K/year. Modern research suggests 3.5% may be safer.',
    tag: 'Fundamentals',
  },
  {
    title: 'Social Security Timing',
    desc: 'Each year you delay SS past 62 increases benefits ~7-8%. Waiting until 70 gives you 76% more than claiming at 62. If you\'re healthy and have other income, delaying is almost always optimal.',
    tag: 'Critical',
  },
  {
    title: 'Roth Conversion Ladder',
    desc: 'In early retirement (before SS/RMDs), your tax bracket is likely lower. Convert Traditional IRA to Roth each year, filling up the 12% or 22% bracket. Saves massive taxes over your lifetime.',
    tag: 'Tax Strategy',
  },
  {
    title: 'Sequence of Returns Risk',
    desc: 'A market crash in your first 5 years of retirement is devastating. Consider a "bond tent" (higher bond allocation at retirement, gradually shifting back to stocks) to mitigate this risk.',
    tag: 'Risk',
  },
  {
    title: 'Healthcare Bridge (Pre-65)',
    desc: 'Before Medicare at 65, healthcare can cost $15-25K/year per person. Budget for ACA marketplace plans. Keeping income low via Roth withdrawals can qualify you for substantial ACA subsidies.',
    tag: 'Healthcare',
  },
  {
    title: 'Required Minimum Distributions',
    desc: 'Starting at age 73 (75 for those born after 1960), you must take RMDs from Traditional IRAs/401ks. Plan ahead — RMDs can push you into higher tax brackets and increase Medicare premiums.',
    tag: 'Compliance',
  },
];

function renderRetirement() {
  const { stockValue, costBasis, annualReturn, capGainsRate } = getInputs();
  const currentAge = parseInt(document.getElementById('currentAge')?.value) || 55;
  const retireAge = parseInt(document.getElementById('retireAge')?.value) || 60;
  const spending = parseFloat(document.getElementById('retireSpending')?.value) || 150000;
  const ssMo = parseFloat(document.getElementById('socialSecurity')?.value) || 3500;
  const otherAssets = parseFloat(document.getElementById('otherRetireAssets')?.value) || 500000;
  const inflation = (parseFloat(document.getElementById('retireInflation')?.value) || 3) / 100;
  const ssStartAge = parseInt(document.getElementById('ssStartAge')?.value) || 67;
  const strategies = buildStrategies(stockValue, costBasis, capGainsRate);

  const yearsToRetire = Math.max(0, retireAge - currentAge);
  const retirementYears = 95 - retireAge;  // plan to 95

  // SS adjustment for claiming age
  const ssMultiplier = ssStartAge === 62 ? 0.70 : ssStartAge === 65 ? 0.867 : ssStartAge === 67 ? 1.0 : 1.24;
  const ssAnnual = Math.round(ssMo * 12 * ssMultiplier);

  // Grow the stock position + other assets to retirement
  const stockAtRetire = stockValue * Math.pow(1 + annualReturn * 0.935, yearsToRetire); // Exchange Fund growth
  const otherAtRetire = otherAssets * Math.pow(1 + annualReturn * 0.8, yearsToRetire); // more conservative
  const totalAtRetire = stockAtRetire + otherAtRetire;

  // 4% rule check
  const safeWithdrawal = totalAtRetire * 0.04;
  const canRetire = safeWithdrawal + ssAnnual >= spending;

  // Simulate drawdown
  const ages = [];
  const portfolioBalance = [];
  const ssIncome = [];
  const withdrawals = [];
  let balance = totalAtRetire;

  for (let yr = 0; yr <= retirementYears; yr++) {
    const age = retireAge + yr;
    ages.push(age);
    portfolioBalance.push(Math.max(0, Math.round(balance)));

    const inflatedSpending = spending * Math.pow(1 + inflation, yr);
    const ss = age >= ssStartAge ? ssAnnual * Math.pow(1 + 0.02, yr) : 0; // SS with COLA
    ssIncome.push(Math.round(ss));

    const needed = Math.max(0, inflatedSpending - ss);
    withdrawals.push(Math.round(needed));

    // Deduct and grow
    balance = (balance - needed) * (1 + annualReturn * 0.7); // conservative in retirement
    if (balance < 0) balance = 0;
  }

  // Find when money runs out
  let moneyLastsUntil = 95;
  for (let i = 0; i < portfolioBalance.length; i++) {
    if (portfolioBalance[i] <= 0) {
      moneyLastsUntil = ages[i];
      break;
    }
  }

  // Results cards
  const resultsContainer = document.getElementById('retire-results');
  if (resultsContainer) {
    const cards = [
      { label: 'Portfolio at Retirement', value: fmt(totalAtRetire), note: `Stock (${fmt(stockAtRetire)}) + Other (${fmt(otherAtRetire)})`, color: '#6366f1' },
      { label: '4% Safe Withdrawal', value: fmtFull(Math.round(safeWithdrawal)) + '/yr', note: safeWithdrawal + ssAnnual >= spending ? '✅ Covers spending!' : '⚠️ Gap: ' + fmtFull(Math.round(spending - safeWithdrawal - ssAnnual)) + '/yr', color: canRetire ? '#10b981' : '#ef4444' },
      { label: 'Money Lasts Until', value: 'Age ' + moneyLastsUntil, note: moneyLastsUntil >= 95 ? '✅ Through age 95!' : '⚠️ Runs out ' + (95 - moneyLastsUntil) + ' years early', color: moneyLastsUntil >= 95 ? '#10b981' : '#ef4444' },
      { label: 'SS Annual Income', value: fmtFull(ssAnnual) + '/yr', note: `Starting age ${ssStartAge} (${ssMultiplier < 1 ? Math.round((1-ssMultiplier)*100) + '% reduced' : ssMultiplier > 1 ? Math.round((ssMultiplier-1)*100) + '% bonus' : 'full benefit'})`, color: '#8b5cf6' },
    ];

    resultsContainer.innerHTML = cards.map((c, i) => `
      <div class="edu-result-card animate-in stagger-${i + 1}">
        <div class="edu-result-label">${c.label}</div>
        <div class="edu-result-value" style="color: ${c.color}">${c.value}</div>
        <div class="edu-result-note">${c.note}</div>
      </div>
    `).join('');
  }

  // Drawdown chart
  const ddCtx = document.getElementById('retireDrawdownChart');
  if (ddCtx) {
    if (retireDrawdownChart) retireDrawdownChart.destroy();
    retireDrawdownChart = new Chart(ddCtx, {
      type: 'line',
      data: {
        labels: ages.map(a => 'Age ' + a),
        datasets: [
          { label: 'Portfolio Balance', data: portfolioBalance, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, borderWidth: 2.5, tension: 0.3, pointRadius: 0 },
          { label: 'Annual Withdrawal', data: withdrawals, borderColor: '#ef4444', fill: false, borderWidth: 2, tension: 0.3, borderDash: [5, 3], pointRadius: 0 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 10 } },
          y: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => '$' + (v / 1_000_000).toFixed(1) + 'M' } },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, padding: 10 } },
          tooltip: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, callbacks: { label: ctx => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` } },
        },
      },
    });
  }

  // Income sources stacked area
  const incCtx = document.getElementById('retireIncomeChart');
  if (incCtx) {
    if (retireIncomeChart) retireIncomeChart.destroy();
    retireIncomeChart = new Chart(incCtx, {
      type: 'bar',
      data: {
        labels: ages.map(a => 'Age ' + a),
        datasets: [
          { label: 'Portfolio Withdrawal', data: withdrawals, backgroundColor: 'rgba(99,102,241,0.5)', borderColor: '#6366f1', borderWidth: 1, borderRadius: 2 },
          { label: 'Social Security', data: ssIncome, backgroundColor: 'rgba(139,92,246,0.5)', borderColor: '#8b5cf6', borderWidth: 1, borderRadius: 2 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 10 } },
          y: { stacked: true, grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => '$' + (v / 1000).toFixed(0) + 'K' } },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, padding: 10 } },
          tooltip: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, callbacks: { label: ctx => `${ctx.dataset.label}: ${fmtFull(ctx.parsed.y)}/yr` } },
        },
      },
    });
  }

  // Retirement tips
  const tipsContainer = document.getElementById('retire-tips');
  if (tipsContainer) {
    tipsContainer.innerHTML = retireTips.map(tip => `
      <div class="edu-tip-card">
        <div class="edu-tip-header">
          <span class="edu-tip-title">${tip.title}</span>
          <span class="edu-tip-tag">${tip.tag}</span>
        </div>
        <p class="edu-tip-desc">${tip.desc}</p>
      </div>
    `).join('');
  }
}

// ============ EQUITY COMPENSATION & FOUNDERS TAB ============
const equityTips = [
  {
    title: 'ISOs vs NSOs',
    desc: 'NSOs trigger ordinary income tax on exercise immediately. ISOs do not trigger ordinary income, but they do trigger the Alternative Minimum Tax (AMT). Holding ISO shares for 1 year after exercise (and 2 years after grant) turns all growth into long-term capital gains.',
    tag: 'Basics',
  },
  {
    title: 'The AMT Trap (ISOs)',
    desc: 'When you exercise ISOs, the difference between the FMV and the Strike Price is a "preference item" for AMT. If the FMV drops heavily after you exercise, you might still owe massive AMT on money you never realized. Always calculate AMT before exercising.',
    tag: 'Warning',
  },
  {
    title: 'Section 1202: QSBS',
    desc: 'Qualified Small Business Stock allows founders and early employees of C-corps (under $50M gross assets at issuance) to exclude 100% of federal capital gains up to $10M, or 10x the cost basis (whichever is greater). Must hold for 5 years.',
    tag: 'Holy Grail',
  },
  {
    title: 'QSBS Stacking / Multiplier',
    desc: 'If your exit will exceed the $10M QSBS limit, you can "stack" or multiply the exemption by gifting shares to non-grantor trusts for your children BEFORE signing a term sheet. Each trust gets its own $10M exclusion cap.',
    tag: 'Advanced',
  },
  {
    title: 'Section 83(b) Election',
    desc: 'When granted early-stage stock subject to vesting, file an 83(b) election within 30 days. You pay tax on the (usually tiny) current value upfront, turning all future appreciation into capital gains and starting the 5-year QSBS clock immediately.',
    tag: 'Critical Deadline',
  },
  {
    title: 'AMT Credits',
    desc: 'The AMT you pay on ISO exercises isn\'t lost forever — it generates an AMT credit. You can apply this credit in future years when your regular tax liability is higher than your AMT calculation, eventually recovering the upfront cash.',
    tag: 'Tax Strategy',
  },
  {
    title: '10b5-1 Trading Plans',
    desc: 'For executives of public companies: setting up a programmatic 10b5-1 plan protects you from insider trading allegations by scheduling your stock sales months in advance during open open windows.',
    tag: 'Compliance',
  },
  {
    title: 'Early Exercise (ISOs/NSOs)',
    desc: 'If your company allows it, exercising before the options vest (when the FMV equals the strike price) means zero tax due at exercise. You just file an 83(b) election and start the long-term capital gains clock.',
    tag: 'Tax Optimization',
  },
];

function renderEquity() {
  const opType = document.getElementById('eqOptionType')?.value || 'iso';
  const shares = parseInt(document.getElementById('eqShares')?.value) || 100000;
  const strike = parseFloat(document.getElementById('eqStrike')?.value) || 1.50;
  const fmv = parseFloat(document.getElementById('eqCurrentFmv')?.value) || 15.00;
  const exitPrice = parseFloat(document.getElementById('eqExitPrice')?.value) || 50.00;
  const isQsbs = document.getElementById('eqQsbs')?.value === 'yes';
  const ordRate = (parseFloat(document.getElementById('eqOrdinaryRate')?.value) || 37) / 100;
  const amtRate = (parseFloat(document.getElementById('eqAmtRate')?.value) || 28) / 100;
  const ltcgRate = 0.20; // assumed max federal LTCG

  const totalCost = shares * strike;
  const exitValue = shares * exitPrice;
  const totalGain = exitValue - totalCost;
  
  if (totalGain <= 0) {
    // Underwater - bail out gracefully
    const resultsContainer = document.getElementById('equity-results');
    if (resultsContainer) {
      resultsContainer.innerHTML = `<p style="color:var(--accent-red)">Options are underwater at the projected exit price. Gross value is less than exercise cost.</p>`;
    }
    return;
  }

  let taxOrdinary = 0;
  let taxAmt = 0;
  let taxLtcg = 0;
  let taxQsbsSaved = 0;

  if (opType === 'nso') {
    // NSOs: Spread at exercise is ordinary income
    const spreadAtExercise = shares * (Math.min(fmv, exitPrice) - strike);
    if (spreadAtExercise > 0) taxOrdinary = spreadAtExercise * ordRate;
    
    // Growth from FMV to Exit is LTCG (assuming held for > 1 year)
    let postExerciseGain = 0;
    if (exitPrice > fmv) {
      postExerciseGain = shares * (exitPrice - fmv);
      if (isQsbs) {
        let maxQsbs = Math.max(10_000_000, 10 * totalCost);
        let eligibleGain = Math.min(postExerciseGain, maxQsbs);
        let excessGain = Math.max(0, postExerciseGain - maxQsbs);
        taxLtcg = excessGain * ltcgRate;
        taxQsbsSaved = eligibleGain * ltcgRate;
      } else {
        taxLtcg = postExerciseGain * ltcgRate;
      }
    }
  } else {
    // ISOs: Spread at exercise triggers AMT
    const bargainElement = shares * (Math.min(fmv, exitPrice) - strike);
    if (bargainElement > 0) taxAmt = bargainElement * amtRate;

    // Assuming a qualifying disposition (held 1 yr after exercise, 2 yr after grant)
    // Entire gain (Exit - Strike) is subject to LTCG, but you get AMT credit back eventually
    if (isQsbs) {
      let maxQsbs = Math.max(10_000_000, 10 * totalCost);
      let eligibleGain = Math.min(totalGain, maxQsbs);
      let excessGain = Math.max(0, totalGain - maxQsbs);
      taxLtcg = excessGain * ltcgRate;
      taxQsbsSaved = eligibleGain * ltcgRate;
    } else {
      taxLtcg = totalGain * ltcgRate;
      // In QSBS non-qualifying, ISOs trigger AMT up front, but at exit you pay LTCG.
      // Usually, you don't pay BOTH if AMT credit is recovered. We'll simplify to just LTCG being the dominant final tax.
      // But we report AMT to show the cash requirement at exercise.
      taxAmt = Math.max(0, taxAmt - taxLtcg); 
    }
  }

  const totalTax = taxOrdinary + taxAmt + taxLtcg;
  const netProceeds = exitValue - totalCost - totalTax;
  const effectiveRate = totalGain > 0 ? (totalTax / totalGain) : 0;

  // Result cards
  const resultsContainer = document.getElementById('equity-results');
  if (resultsContainer) {
    const qsbsMsg = isQsbs && taxQsbsSaved > 0 ? `Saved ${fmtFull(taxQsbsSaved)} via Sec 1202` : (isQsbs ? `Under limit` : `Not applicable`);
    const amtMsg = opType === 'iso' ? `Requires ${fmtFull(taxAmt)} cash at exercise` : `None for NSOs`;

    const cards = [
      { label: 'Gross Exit Value', value: fmtFull(exitValue), note: `${shares.toLocaleString()} shares @ $${exitPrice}`, color: '#94a3b8' },
      { label: 'Net After-Tax Proceeds', value: fmtFull(netProceeds), note: `After $${fmtFull(totalCost)} cost basis`, color: '#10b981' },
      { label: 'Effective Tax Rate', value: (effectiveRate * 100).toFixed(1) + '%', note: `Total Tax: ${fmtFull(totalTax)}`, color: '#ef4444' },
      { label: 'Total Ordinary Tax', value: fmtFull(taxOrdinary), note: `At ${(ordRate * 100).toFixed(1)}% rate`, color: '#f59e0b' },
      { label: 'Total Cap Gains (LTCG)', value: fmtFull(taxLtcg), note: `At ${(ltcgRate * 100).toFixed(1)}% rate`, color: '#8b5cf6' },
      { label: 'QSBS Tax Savings', value: isQsbs ? fmtFull(taxQsbsSaved) : '$0', note: qsbsMsg, color: isQsbs ? '#10b981' : '#64748b' },
    ];

    resultsContainer.innerHTML = cards.map((c, i) => `
      <div class="edu-result-card animate-in stagger-${i + 1}">
        <div class="edu-result-label">${c.label}</div>
        <div class="edu-result-value" style="color: ${c.color}">${c.value}</div>
        <div class="edu-result-note">${c.note}</div>
      </div>
    `).join('');
  }

  // Bar Chart: Tax Breakdown
  const taxCtx = document.getElementById('equityTaxChart');
  if (taxCtx && exitValue > totalCost) {
    if (equityTaxChart) equityTaxChart.destroy();
    
    // Determine the chunks that make up the Gross Exit Value
    const chunks = [
      { label: 'Cost Basis', val: totalCost, color: '#475569' },
      { label: 'Net Profit', val: netProceeds, color: '#10b981' },
      { label: 'Ordinary Income Tax', val: taxOrdinary, color: '#f59e0b' },
      { label: 'Long-Term Cap Gains', val: taxLtcg, color: '#8b5cf6' },
      { label: 'AMT (Unrecovered)', val: taxAmt, color: '#ef4444' }
    ].filter(c => c.val > 0);

    // Calculate QSBS saved space purely for visualization
    const visualQsbs = taxQsbsSaved;

    equityTaxChart = new Chart(taxCtx, {
      type: 'bar',
      data: {
        labels: ['Exit Capital Breakdown'],
        datasets: chunks.map(c => ({
          label: c.label,
          data: [c.val],
          backgroundColor: c.color,
          borderWidth: 0,
        })).concat(visualQsbs > 0 ? [{
          label: 'QSBS Tax Saved (Virtual)',
          data: [visualQsbs],
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderColor: '#10b981',
          borderWidth: 2,
          borderDash: [5, 5]
        }] : [])
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: 'y', // horizontal bar
        scales: {
          x: { stacked: true, grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => '$' + (v / 1000000).toFixed(1) + 'M' } },
          y: { stacked: true, grid: { display: false }, ticks: { display: false } },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, padding: 12 } },
          tooltip: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, callbacks: { label: ctx => `${ctx.dataset.label}: ${fmtFull(ctx.parsed.x)}` } },
        },
      },
    });
  }

  // Line Chart: Scenario modeling (Exit Price from $1 to 3x projected)
  const scCtx = document.getElementById('equityScenarioChart');
  if (scCtx) {
    if (equityScenarioChart) equityScenarioChart.destroy();
    
    // Build scenarios 
    const step = Math.max(1, Math.round(exitPrice * 0.2));
    const maxSimulation = exitPrice * 2.5;
    const simPrices = [];
    for(let p = Math.max(strike, 1); p <= maxSimulation; p += step) {
      simPrices.push(p);
    }
    
    const scNet = [];
    const scGross = [];
    const scAmt = [];

    simPrices.forEach(p => {
      const g = shares * p;
      const tc = shares * strike;
      const gGain = g - tc;
      
      let tOrd = 0;
      let tAmt = 0;
      let tLtcg = 0;

      if (opType === 'nso') {
        const spread = shares * (Math.min(fmv, p) - strike);
        if (spread > 0) tOrd = spread * ordRate;
        if (p > fmv) {
          const postGain = shares * (p - fmv);
          if (isQsbs) {
            let maxQ = Math.max(10_000_000, 10 * tc);
            tLtcg = Math.max(0, postGain - maxQ) * ltcgRate;
          } else {
            tLtcg = postGain * ltcgRate;
          }
        }
      } else {
        const bargain = shares * (Math.min(fmv, p) - strike);
        if (bargain > 0) tAmt = bargain * amtRate;
        if (isQsbs) {
          let maxQ = Math.max(10_000_000, 10 * tc);
          tLtcg = Math.max(0, gGain - maxQ) * ltcgRate;
        } else {
          tLtcg = gGain * ltcgRate;
          tAmt = Math.max(0, tAmt - tLtcg);
        }
      }

      scGross.push(g);
      scNet.push(g - tc - tOrd - tAmt - tLtcg);
      scAmt.push(tAmt);
    });

    equityScenarioChart = new Chart(scCtx, {
      type: 'line',
      data: {
        labels: simPrices.map(p => '$' + p.toFixed(0)),
        datasets: [
          { label: 'Net After-Tax Proceeds', data: scNet, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, borderWidth: 2.5, tension: 0.3, pointRadius: 0 },
          { label: 'Gross Exit Value', data: scGross, borderColor: '#64748b', fill: false, borderWidth: 1.5, borderDash: [5, 3], tension: 0.3, pointRadius: 0 },
          { label: 'AMT Liability (ISOs)', data: scAmt, borderColor: '#ef4444', fill: false, borderWidth: 2, tension: 0.3, pointRadius: 0, hidden: opType !== 'iso' },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { title: { display: true, text: 'Exit Price per Share', color: '#64748b' }, grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 } } },
          y: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => '$' + (v / 1_000_000).toFixed(1) + 'M' } },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, padding: 10 } },
          tooltip: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, callbacks: { label: ctx => `${ctx.dataset.label}: ${fmtFull(ctx.parsed.y)}` } },
        },
      },
    });
  }

  // Tips
  const tipsContainer = document.getElementById('equity-tips');
  if (tipsContainer) {
    tipsContainer.innerHTML = equityTips.map(tip => `
      <div class="edu-tip-card">
        <div class="edu-tip-header">
          <span class="edu-tip-title">${tip.title}</span>
          <span class="edu-tip-tag">${tip.tag}</span>
        </div>
        <p class="edu-tip-desc">${tip.desc}</p>
      </div>
    `).join('');
  }
}

// ============ 1031 LIKE-KIND EXCHANGE TAB ============
const exchange1031Tips = [
  {
    title: '45-Day Identification Rule',
    desc: 'You must identify up to 3 replacement properties within 45 calendar days of selling the relinquished property. Miss this deadline and the entire exchange fails — no extensions.',
    tag: 'Critical Deadline',
  },
  {
    title: '180-Day Closing Deadline',
    desc: 'The replacement property must be acquired within 180 days of selling the original property (or your tax return due date, whichever is earlier). Use a Qualified Intermediary (QI) to hold funds.',
    tag: 'Critical Deadline',
  },
  {
    title: 'Delaware Statutory Trust (DST)',
    desc: 'Can\'t find a replacement property? A DST allows you to exchange into a fractional interest in institutional-quality real estate (apartments, warehouses, medical offices) with zero management responsibilities.',
    tag: 'Passive 1031',
  },
  {
    title: 'Reverse 1031 Exchange',
    desc: 'Buy the replacement property BEFORE selling the old one. More complex and expensive ($10K-$20K extra fees) but eliminates the scramble to find a property within 45 days.',
    tag: 'Advanced',
  },
  {
    title: 'Boot & Partial Exchanges',
    desc: '"Boot" is any non-like-kind property received (cash, debt relief). Boot IS taxable. To fully defer, the replacement must be equal or greater in value AND debt. Trading down triggers tax on the difference.',
    tag: 'Tax Rule',
  },
  {
    title: 'Cost Segregation Bonus',
    desc: 'After the 1031 exchange, perform a cost segregation study on the new property. Reclassify 20-40% of the building value to 5/7/15-year property classes for accelerated depreciation — massive year-one tax savings.',
    tag: 'Tax Strategy',
  },
  {
    title: 'Step-Up at Death',
    desc: 'The ultimate 1031 endgame: keep exchanging throughout your lifetime, then heirs receive a full step-up in basis at death. All deferred capital gains are permanently eliminated. Tax-free.',
    tag: 'Estate Play',
  },
  {
    title: 'Drop & Swap for Partnerships',
    desc: 'If you own property in a partnership, you can\'t 1031 exchange the partnership interest. Instead, "drop" the property to partners as tenants-in-common, THEN each partner does their own 1031 exchange.',
    tag: 'Partnership',
  },
];

function render1031Exchange() {
  const propertyValue = parseFloat(document.getElementById('exchangePropertyValue')?.value) || 1_000_000;
  const costBasis = parseFloat(document.getElementById('exchangeCostBasis')?.value) || 300_000;
  const targetValue = parseFloat(document.getElementById('exchangeTargetValue')?.value) || 1_200_000;
  const capRate = (parseFloat(document.getElementById('exchangeCapRate')?.value) || 6) / 100;
  const holdPeriod = parseInt(document.getElementById('exchangeHoldPeriod')?.value) || 20;
  const appreciation = (parseFloat(document.getElementById('exchangeAppreciation')?.value) || 3) / 100;
  const depMethod = document.getElementById('exchangeDepreciation')?.value || 'straight';
  const ltv = (parseFloat(document.getElementById('exchangeLeverage')?.value) || 60) / 100;
  const mortgageRate = (parseFloat(document.getElementById('exchangeMortgageRate')?.value) || 6.5) / 100;

  const gain = Math.max(0, propertyValue - costBasis);
  const { capGainsRate } = getInputs();
  const taxIfSold = Math.round(gain * capGainsRate);
  const afterTaxProceeds = propertyValue - taxIfSold;

  // 1031 Exchange scenario — into replacement property
  const loanAmount = targetValue * ltv;
  const equityIn = targetValue - loanAmount;
  const annualDebtService = loanAmount * mortgageRate; // simplified interest-only
  const buildingValue = targetValue * 0.80; // 80% building, 20% land

  // Depreciation calculation
  let annualDepreciation;
  let firstYearBonus = 0;
  if (depMethod === 'costseg') {
    // Cost seg: 20% to 5yr, 10% to 7yr, 10% to 15yr, 40% straight-line
    const fiveYr = buildingValue * 0.20 / 5;
    const sevenYr = buildingValue * 0.10 / 7;
    const fifteenYr = buildingValue * 0.10 / 15;
    const remaining = buildingValue * 0.40 / 27.5;
    annualDepreciation = Math.round(fiveYr + sevenYr + fifteenYr + remaining);
    firstYearBonus = Math.round(buildingValue * 0.30 * 0.60); // 60% bonus depreciation on accelerated portion
  } else {
    annualDepreciation = Math.round(buildingValue / 27.5);
  }

  const { taxBracket } = getInputs();
  const annualTaxSavings = Math.round(annualDepreciation * taxBracket);
  const firstYearTaxSavings = annualTaxSavings + Math.round(firstYearBonus * taxBracket);

  // Project both scenarios over time
  const years = Array.from({ length: holdPeriod + 1 }, (_, i) => i);

  // 1031 Exchange path
  const exchange1031Data = years.map(yr => {
    const propVal = targetValue * Math.pow(1 + appreciation, yr);
    const remainingDebt = loanAmount; // simplified interest-only
    const equity = propVal - remainingDebt;
    const cumRental = yr > 0 ? Array.from({ length: yr }, (__, y) => {
      const netIncome = targetValue * Math.pow(1 + appreciation, y) * capRate - annualDebtService;
      return Math.max(0, netIncome);
    }).reduce((a, b) => a + b, 0) : 0;
    const cumDepTax = yr === 0 ? 0 : firstYearTaxSavings + annualTaxSavings * Math.max(0, yr - 1);
    return {
      year: yr,
      equity: Math.round(equity),
      netIncome: Math.round(yr > 0 ? targetValue * Math.pow(1 + appreciation, yr) * capRate - annualDebtService : 0),
      cumRental: Math.round(cumRental),
      cumDepTax: Math.round(cumDepTax),
      totalWealth: Math.round(equity + cumRental + cumDepTax),
    };
  });

  // Sell & reinvest path (invest after-tax proceeds at market returns)
  const { annualReturn } = getInputs();
  const sellData = years.map(yr => {
    const invested = afterTaxProceeds * Math.pow(1 + annualReturn, yr);
    const dividends = yr > 0 ? Array.from({ length: yr }, (__, y) =>
      afterTaxProceeds * Math.pow(1 + annualReturn, y) * 0.02
    ).reduce((a, b) => a + b, 0) : 0;
    return {
      year: yr,
      totalWealth: Math.round(invested + dividends),
    };
  });

  // Hold as-is (do nothing)
  const holdData = years.map(yr => ({
    year: yr,
    totalWealth: Math.round(propertyValue * Math.pow(1 + appreciation, yr)),
  }));

  // Result cards
  const resultsContainer = document.getElementById('exchange1031-results');
  if (resultsContainer) {
    const totalRentalIncome = exchange1031Data[holdPeriod].cumRental;
    const totalDepBenefit = exchange1031Data[holdPeriod].cumDepTax;
    const exchangeEndWealth = exchange1031Data[holdPeriod].totalWealth;
    const sellEndWealth = sellData[holdPeriod].totalWealth;

    const cards = [
      { label: 'Tax Deferred via 1031', value: fmtFull(taxIfSold), note: `${(capGainsRate * 100).toFixed(1)}% on ${fmtFull(gain)} gain`, color: '#10b981' },
      { label: `1031 Equity at Year ${holdPeriod}`, value: fmt(exchange1031Data[holdPeriod].equity), note: `${fmtFull(targetValue)} @ ${(appreciation * 100).toFixed(1)}%/yr`, color: '#6366f1' },
      { label: 'Total Rental Income', value: fmt(totalRentalIncome), note: `${(capRate * 100).toFixed(1)}% cap rate, ${holdPeriod} years`, color: '#f59e0b' },
      { label: 'Depreciation Tax Savings', value: fmt(totalDepBenefit), note: depMethod === 'costseg' ? 'Cost segregation (accelerated)' : 'Straight-line 27.5yr', color: '#8b5cf6' },
      { label: '1031 Total Wealth', value: fmt(exchangeEndWealth), note: 'Equity + rental income + tax savings', color: '#10b981' },
      { label: '1031 Advantage vs Selling', value: (exchangeEndWealth > sellEndWealth ? '+' : '') + fmt(exchangeEndWealth - sellEndWealth), note: `Compared to sell & reinvest at ${(annualReturn * 100).toFixed(0)}%`, color: exchangeEndWealth > sellEndWealth ? '#10b981' : '#ef4444' },
    ];

    resultsContainer.innerHTML = cards.map((c, i) => `
      <div class="edu-result-card animate-in stagger-${i + 1}">
        <div class="edu-result-label">${c.label}</div>
        <div class="edu-result-value" style="color: ${c.color}">${c.value}</div>
        <div class="edu-result-note">${c.note}</div>
      </div>
    `).join('');
  }

  // Wealth comparison chart
  const exCtx = document.getElementById('exchange1031Chart');
  if (exCtx) {
    if (exchange1031Chart) exchange1031Chart.destroy();
    exchange1031Chart = new Chart(exCtx, {
      type: 'line',
      data: {
        labels: years.map(yr => 'Yr ' + yr),
        datasets: [
          { label: '1031 Exchange (Total Wealth)', data: exchange1031Data.map(d => d.totalWealth), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, borderWidth: 2.5, tension: 0.3, pointRadius: 0 },
          { label: 'Sell & Reinvest (Stock Market)', data: sellData.map(d => d.totalWealth), borderColor: '#ef4444', fill: false, borderWidth: 2, tension: 0.3, pointRadius: 0 },
          { label: 'Hold Current Property', data: holdData.map(d => d.totalWealth), borderColor: '#64748b', fill: false, borderWidth: 1.5, tension: 0.3, borderDash: [5, 3], pointRadius: 0 },
          { label: '1031 Equity Only', data: exchange1031Data.map(d => d.equity), borderColor: '#6366f1', fill: false, borderWidth: 2, tension: 0.3, borderDash: [3, 3], pointRadius: 0 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 10 } },
          y: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => '$' + (v / 1_000_000).toFixed(1) + 'M' } },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, padding: 10 } },
          tooltip: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, callbacks: { label: ctx => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` } },
        },
      },
    });
  }

  // Cumulative cash flow chart
  const incCtx = document.getElementById('exchange1031IncomeChart');
  if (incCtx) {
    if (exchange1031IncomeChart) exchange1031IncomeChart.destroy();
    exchange1031IncomeChart = new Chart(incCtx, {
      type: 'bar',
      data: {
        labels: years.map(yr => 'Yr ' + yr),
        datasets: [
          { label: 'Cumulative Rental Income', data: exchange1031Data.map(d => d.cumRental), backgroundColor: 'rgba(245,158,11,0.5)', borderColor: '#f59e0b', borderWidth: 1, borderRadius: 3 },
          { label: 'Cumulative Tax Savings', data: exchange1031Data.map(d => d.cumDepTax), backgroundColor: 'rgba(139,92,246,0.5)', borderColor: '#8b5cf6', borderWidth: 1, borderRadius: 3 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 10 } },
          y: { stacked: true, grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => '$' + (v / 1000).toFixed(0) + 'K' } },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, padding: 10 } },
          tooltip: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, callbacks: { label: ctx => `${ctx.dataset.label}: ${fmtFull(ctx.parsed.y)}` } },
        },
      },
    });
  }

  // Tips
  const tipsContainer = document.getElementById('exchange1031-tips');
  if (tipsContainer) {
    tipsContainer.innerHTML = exchange1031Tips.map(tip => `
      <div class="edu-tip-card">
        <div class="edu-tip-header">
          <span class="edu-tip-title">${tip.title}</span>
          <span class="edu-tip-tag">${tip.tag}</span>
        </div>
        <p class="edu-tip-desc">${tip.desc}</p>
      </div>
    `).join('');
  }
}

// ============ AQR / SYSTEMATIC STRATEGY TAB ============
const aqrTips = [
  {
    title: 'Risk Parity Explained',
    desc: 'Instead of allocating 60/40 by capital, Risk Parity allocates by risk contribution. Bonds get levered up so each asset class contributes equal volatility. Result: better Sharpe ratios and smaller drawdowns in most environments.',
    tag: 'Core Concept',
  },
  {
    title: 'Managed Futures as Crisis Alpha',
    desc: 'Trend-following strategies have historically delivered positive returns during equity market crashes (2008, 2020, 2022). They\'re the only major strategy with negative correlation to equities during crises — true portfolio insurance.',
    tag: 'Crisis Alpha',
  },
  {
    title: 'Factor Premiums (Value, Momentum, Quality)',
    desc: 'Academic research shows persistent premiums for Value (~3%), Momentum (~7%), and Quality (~4%) across asset classes and geographies over 100+ years. AQR\'s multi-factor approach harvests all three simultaneously.',
    tag: 'Research',
  },
  {
    title: 'Rebalancing Premium',
    desc: 'Systematic rebalancing (quarterly or monthly) forces "buy low, sell high" discipline. Studies show rebalancing adds 0.5-1.0% annually vs. buy-and-hold. This is free alpha from discipline alone.',
    tag: 'Execution',
  },
  {
    title: 'Leverage & Risk Management',
    desc: 'Risk Parity typically uses 1.5-2x leverage on bonds to equalize risk. This is modest leverage on the safest asset class. The key risk is a simultaneous stocks + bonds drawdown (rare but happened in 2022).',
    tag: 'Leverage',
  },
  {
    title: 'Tax Efficiency of Systematic Strategies',
    desc: 'Factor strategies can be implemented tax-efficiently: long-only versions avoid short-term gains, and tax-loss harvesting is built into the rebalancing process. Managed futures in offshore structures avoid tax complications.',
    tag: 'Tax',
  },
  {
    title: 'Carry: The Hidden Factor',
    desc: 'Carry strategies earn returns from yield differentials: high-yield bonds, steep yield curves, currencies with high interest rates. AQR research shows carry is a distinct, diversifying source of return across all asset classes.',
    tag: 'Advanced',
  },
  {
    title: 'Who Should Use Systematic Strategies?',
    desc: 'Best for investors with $500K+ portfolios, 10+ year horizons, and comfort with complexity. These strategies underperform in straight bull markets but excel in providing consistent risk-adjusted returns across all environments.',
    tag: 'Suitability',
  },
];

// Strategy profiles based on AQR published research
const AQR_STRATEGIES = {
  traditional: {
    name: 'Traditional 60/40',
    color: '#64748b',
    icon: '📊',
    baseReturn: 0.07,
    baseVol: 0.10,
    sharpe: 0.45,
    maxDrawdown: -0.35,
    spCorrelation: 0.85,
    factors: { value: 3, momentum: 2, quality: 3, carry: 4, defensive: 5, trend: 1 },
  },
  riskParity: {
    name: 'Risk Parity',
    color: '#6366f1',
    icon: '⚖️',
    baseReturn: 0.075,
    baseVol: 0.08,
    sharpe: 0.65,
    maxDrawdown: -0.20,
    spCorrelation: 0.55,
    factors: { value: 4, momentum: 3, quality: 5, carry: 7, defensive: 9, trend: 3 },
  },
  managedFutures: {
    name: 'Managed Futures',
    color: '#f59e0b',
    icon: '📈',
    baseReturn: 0.06,
    baseVol: 0.12,
    sharpe: 0.50,
    maxDrawdown: -0.15,
    spCorrelation: -0.10,
    factors: { value: 2, momentum: 8, quality: 2, carry: 5, defensive: 4, trend: 10 },
  },
  multiFactor: {
    name: 'Multi-Factor',
    color: '#10b981',
    icon: '🧬',
    baseReturn: 0.09,
    baseVol: 0.14,
    sharpe: 0.55,
    maxDrawdown: -0.30,
    spCorrelation: 0.70,
    factors: { value: 9, momentum: 8, quality: 8, carry: 6, defensive: 5, trend: 4 },
  },
};

function renderAQR() {
  const portfolioSize = parseFloat(document.getElementById('aqrPortfolioSize')?.value) || 1_000_000;
  const horizon = parseInt(document.getElementById('aqrHorizon')?.value) || 20;
  const riskTolerance = document.getElementById('aqrRiskTolerance')?.value || 'moderate';
  const leverage = parseFloat(document.getElementById('aqrLeverage')?.value) || 1.0;
  const inflation = (parseFloat(document.getElementById('aqrInflation')?.value) || 2.5) / 100;

  // Risk tolerance adjustments
  const riskMult = riskTolerance === 'conservative' ? 0.7 : riskTolerance === 'aggressive' ? 1.3 : 1.0;
  const volMult = riskTolerance === 'conservative' ? 0.6 : riskTolerance === 'aggressive' ? 1.4 : 1.0;

  const years = Array.from({ length: horizon + 1 }, (_, i) => i);

  // Build projection data for each strategy
  const projections = {};
  Object.entries(AQR_STRATEGIES).forEach(([key, strat]) => {
    const adjReturn = strat.baseReturn * leverage * riskMult - (leverage > 1 ? (leverage - 1) * 0.04 : 0); // borrowing cost
    const adjVol = strat.baseVol * leverage * volMult;
    projections[key] = {
      ...strat,
      adjReturn,
      adjVol,
      adjSharpe: adjReturn / adjVol,
      data: years.map(yr => Math.round(portfolioSize * Math.pow(1 + adjReturn, yr))),
      realData: years.map(yr => Math.round(portfolioSize * Math.pow(1 + adjReturn - inflation, yr))),
    };
  });

  // Result cards — best strategy analysis
  const resultsContainer = document.getElementById('aqr-results');
  if (resultsContainer) {
    const bestReturn = Object.entries(projections).sort((a, b) => b[1].adjReturn - a[1].adjReturn)[0];
    const bestSharpe = Object.entries(projections).sort((a, b) => b[1].adjSharpe - a[1].adjSharpe)[0];

    const cards = [
      { label: 'Best Expected Return', value: (bestReturn[1].adjReturn * 100).toFixed(1) + '%', note: `${bestReturn[1].name} → ${fmt(bestReturn[1].data[horizon])} at year ${horizon}`, color: bestReturn[1].color },
      { label: 'Best Risk-Adjusted (Sharpe)', value: bestSharpe[1].adjSharpe.toFixed(2), note: `${bestSharpe[1].name} — highest return per unit of risk`, color: bestSharpe[1].color },
      { label: 'Lowest Max Drawdown', value: (projections.managedFutures.maxDrawdown * 100).toFixed(0) + '%', note: 'Managed Futures — crisis alpha protection', color: '#f59e0b' },
      { label: 'Lowest S&P Correlation', value: projections.managedFutures.spCorrelation.toFixed(2), note: 'Managed Futures — true diversifier', color: '#f59e0b' },
    ];

    resultsContainer.innerHTML = cards.map((c, i) => `
      <div class="edu-result-card animate-in stagger-${i + 1}">
        <div class="edu-result-label">${c.label}</div>
        <div class="edu-result-value" style="color: ${c.color}">${c.value}</div>
        <div class="edu-result-note">${c.note}</div>
      </div>
    `).join('');
  }

  // Growth comparison chart
  const compCtx = document.getElementById('aqrComparisonChart');
  if (compCtx) {
    if (aqrComparisonChart) aqrComparisonChart.destroy();
    const datasets = Object.entries(projections).map(([key, p], i) => ({
      label: p.name,
      data: p.data,
      borderColor: p.color,
      backgroundColor: i === 0 ? 'transparent' : (key === 'riskParity' ? 'rgba(99,102,241,0.08)' : 'transparent'),
      fill: key === 'riskParity',
      borderWidth: key === 'riskParity' ? 2.5 : 2,
      tension: 0.3,
      pointRadius: 0,
      borderDash: key === 'managedFutures' ? [5, 3] : [],
    }));

    aqrComparisonChart = new Chart(compCtx, {
      type: 'line',
      data: { labels: years.map(yr => 'Yr ' + yr), datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 10 } },
          y: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => '$' + (v / 1_000_000).toFixed(1) + 'M' } },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, padding: 10 } },
          tooltip: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, callbacks: { label: ctx => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` } },
        },
      },
    });
  }

  // Factor radar chart
  const factCtx = document.getElementById('aqrFactorChart');
  if (factCtx) {
    if (aqrFactorChart) aqrFactorChart.destroy();
    const factorLabels = ['Value', 'Momentum', 'Quality', 'Carry', 'Defensive', 'Trend'];

    aqrFactorChart = new Chart(factCtx, {
      type: 'radar',
      data: {
        labels: factorLabels,
        datasets: Object.entries(AQR_STRATEGIES).map(([key, strat]) => ({
          label: strat.name,
          data: factorLabels.map(f => strat.factors[f.toLowerCase()]),
          borderColor: strat.color,
          backgroundColor: strat.color + '15',
          borderWidth: 2,
          pointBackgroundColor: strat.color,
          pointRadius: 3,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true, max: 10,
            ticks: { display: false },
            grid: { color: '#1e293b' },
            angleLines: { color: '#1e293b' },
            pointLabels: { color: '#94a3b8', font: { size: 11, family: 'Inter' } },
          },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, padding: 12, usePointStyle: true } },
        },
      },
    });
  }

  // Metrics table
  const table = document.getElementById('aqr-metrics-table');
  if (table) {
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    thead.innerHTML = `<tr>
      <th>Metric</th>
      ${Object.values(projections).map(p => `<th style="color:${p.color}">${p.name}</th>`).join('')}
    </tr>`;

    const metrics = [
      { name: 'Expected Return', fn: p => (p.adjReturn * 100).toFixed(1) + '%' },
      { name: 'Volatility (σ)', fn: p => (p.adjVol * 100).toFixed(1) + '%' },
      { name: 'Sharpe Ratio', fn: p => p.adjSharpe.toFixed(2) },
      { name: 'Max Drawdown', fn: p => (p.maxDrawdown * 100).toFixed(0) + '%' },
      { name: 'S&P 500 Correlation', fn: p => p.spCorrelation.toFixed(2) },
      { name: `Value at Year ${horizon}`, fn: p => fmt(p.data[horizon]) },
      { name: `Real Value (Yr ${horizon})`, fn: p => fmt(p.realData[horizon]) },
    ];

    tbody.innerHTML = metrics.map(m => `
      <tr>
        <td>${m.name}</td>
        ${Object.values(projections).map(p => `<td style="color:${p.color}">${m.fn(p)}</td>`).join('')}
      </tr>
    `).join('');
  }

  // Tips
  const tipsContainer = document.getElementById('aqr-tips');
  if (tipsContainer) {
    tipsContainer.innerHTML = aqrTips.map(tip => `
      <div class="edu-tip-card">
        <div class="edu-tip-header">
          <span class="edu-tip-title">${tip.title}</span>
          <span class="edu-tip-tag">${tip.tag}</span>
        </div>
        <p class="edu-tip-desc">${tip.desc}</p>
      </div>
    `).join('');
  }
}

// ============ INSURANCE OPTIONS TAB ============
const insuranceTips = [
  {
    title: 'Private Placement Life Insurance (PPLI)',
    desc: 'Wrap alternative investments (hedge funds, PE, real estate) inside a life insurance policy. All growth is tax-deferred; death benefit is income-tax free. Requires $1M+ premium. Best for ultra-HNW investors seeking tax-free compounding on alternatives.',
    tag: 'Ultra-HNW',
  },
  {
    title: 'Whole Life as Bond Alternative',
    desc: 'Top-tier mutual companies (Northwestern, MassMutual, Guardian) pay 5-6% total crediting rates with guarantees. In a rising rate environment, whole life cash value acts like a tax-advantaged bond with no duration risk and zero correlation to equities.',
    tag: 'Conservative',
  },
  {
    title: 'IUL Cap & Floor Mechanics',
    desc: 'Indexed Universal Life credits interest linked to the S&P 500 with a 0% floor (no losses) and ~10% cap (limited upside). Over time, the asymmetry produces 6-7% average returns with zero downside risk. Watch for high policy costs in later years.',
    tag: 'Growth',
  },
  {
    title: 'ILIT for Estate Tax Elimination',
    desc: 'An Irrevocable Life Insurance Trust (ILIT) owns the policy outside your estate. A $5M death benefit in an ILIT saves $2M+ in estate taxes. Fund with annual gift exclusions ($18K/person). Existing policies can be transferred (3-year lookback applies).',
    tag: 'Estate',
  },
  {
    title: 'Premium Financing',
    desc: 'Borrow from a bank to pay insurance premiums, using the policy\'s cash value as collateral. Effective when loan rates < policy crediting rates. Allows massive death benefits with minimal out-of-pocket cost. Requires sophisticated structuring.',
    tag: 'Advanced',
  },
  {
    title: '1035 Exchange for Existing Policies',
    desc: 'Like a 1031 for real estate, a 1035 exchange lets you swap an old life insurance or annuity policy for a new one without triggering taxes. Useful for upgrading to a better-performing policy or converting annuities to life insurance.',
    tag: 'Tax Strategy',
  },
  {
    title: 'Tax-Free Retirement Income',
    desc: 'After building cash value for 15-20 years, you can take tax-free policy loans against the cash value — essentially creating a tax-free retirement income stream. Unlike Roth IRAs, there are no contribution limits or income phase-outs.',
    tag: 'Retirement',
  },
  {
    title: 'Split-Dollar Arrangements',
    desc: 'An employer or family member shares the cost of a life insurance policy. Economic benefit split-dollar arrangements let you transfer wealth to the next generation at a fraction of gift tax cost. Commonly used in family business succession.',
    tag: 'Business',
  },
];

function renderInsurance() {
  const premium = parseFloat(document.getElementById('insurancePremium')?.value) || 50_000;
  const premiumYears = parseInt(document.getElementById('insurancePremiumYears')?.value) || 20;
  const currentAge = parseInt(document.getElementById('insuranceAge')?.value) || 45;
  const deathBenefit = parseFloat(document.getElementById('insuranceCoverage')?.value) || 5_000_000;
  const taxBracket = parseFloat(document.getElementById('insuranceTaxBracket')?.value) || 0.37;
  const altReturn = (parseFloat(document.getElementById('insuranceAltReturn')?.value) || 7) / 100;

  const totalPremiums = premium * premiumYears;
  const projectionYears = 90 - currentAge; // project to age 90
  const years = Array.from({ length: projectionYears + 1 }, (_, i) => i);

  // Insurance product models
  const products = {
    ppli: {
      name: 'PPLI',
      color: '#6366f1',
      icon: '💎',
      creditRate: 0.085, // hedge fund/alt returns inside policy
      costRate: 0.005,   // low insurance costs
      cashValues: [],
      deathBenefits: [],
    },
    wholeLife: {
      name: 'Whole Life',
      color: '#10b981',
      icon: '🏛️',
      creditRate: 0.055, // dividends + guaranteed rate
      costRate: 0.015,   // higher insurance costs
      cashValues: [],
      deathBenefits: [],
    },
    iul: {
      name: 'IUL',
      color: '#f59e0b',
      icon: '📊',
      creditRate: 0.065, // index-linked with cap
      costRate: 0.02,    // COI increases with age
      cashValues: [],
      deathBenefits: [],
    },
  };

  // Project cash values for each product
  Object.values(products).forEach(prod => {
    let cv = 0;
    for (let yr = 0; yr <= projectionYears; yr++) {
      if (yr > 0) {
        const premThisYear = yr <= premiumYears ? premium : 0;
        const netCredit = prod.creditRate - prod.costRate;
        // COI increases with age for IUL
        const ageFactor = prod === products.iul ? Math.max(1, 1 + (currentAge + yr - 60) * 0.002) : 1;
        const costAdjust = prod.costRate * (ageFactor - 1);
        cv = (cv + premThisYear) * (1 + netCredit - costAdjust);
      }
      prod.cashValues.push(Math.max(0, Math.round(cv)));
      // Death benefit is max of face amount or cash value * corridor factor
      const corridorFactor = (currentAge + yr) < 60 ? 2.0 : (currentAge + yr) < 70 ? 1.5 : 1.2;
      prod.deathBenefits.push(Math.max(deathBenefit, Math.round(cv * corridorFactor)));
    }
  });

  // Taxable account comparison (invest same premiums, pay taxes on gains)
  const taxableValues = [];
  let taxableCV = 0;
  for (let yr = 0; yr <= projectionYears; yr++) {
    if (yr > 0) {
      const premThisYear = yr <= premiumYears ? premium : 0;
      const afterTaxReturn = altReturn * (1 - taxBracket * 0.5); // blend of cap gains and ordinary
      taxableCV = (taxableCV + premThisYear) * (1 + afterTaxReturn);
    }
    taxableValues.push(Math.round(taxableCV));
  }

  // Result cards
  const resultsContainer = document.getElementById('insurance-results');
  if (resultsContainer) {
    const retireYr = Math.max(0, 65 - currentAge);
    const ppliAtRetire = products.ppli.cashValues[retireYr] || 0;
    const wlAtRetire = products.wholeLife.cashValues[retireYr] || 0;
    const iulAtRetire = products.iul.cashValues[retireYr] || 0;
    const taxableAtRetire = taxableValues[retireYr] || 0;

    // Tax-free income via loans (approximately 4-5% of cash value)
    const ppliIncome = Math.round(ppliAtRetire * 0.045);
    const wlIncome = Math.round(wlAtRetire * 0.04);
    const iulIncome = Math.round(iulAtRetire * 0.04);

    const cards = [
      { label: 'Total Premiums Paid', value: fmtFull(totalPremiums), note: `${fmtFull(premium)}/yr × ${premiumYears} years`, color: '#94a3b8' },
      { label: 'PPLI Cash Value at 65', value: fmt(ppliAtRetire), note: `${((ppliAtRetire / totalPremiums - 1) * 100).toFixed(0)}% gain on premiums`, color: '#6366f1' },
      { label: 'Whole Life Cash Value at 65', value: fmt(wlAtRetire), note: `Guaranteed + dividends`, color: '#10b981' },
      { label: 'IUL Cash Value at 65', value: fmt(iulAtRetire), note: `Index-linked with 0% floor`, color: '#f59e0b' },
      { label: 'Tax-Free Income (PPLI)', value: fmtFull(ppliIncome) + '/yr', note: 'Via policy loans — no tax due', color: '#6366f1' },
      { label: 'Taxable Account at 65', value: fmt(taxableAtRetire), note: `After ${(taxBracket * 100).toFixed(0)}% taxes on gains`, color: '#ef4444' },
    ];

    resultsContainer.innerHTML = cards.map((c, i) => `
      <div class="edu-result-card animate-in stagger-${i + 1}">
        <div class="edu-result-label">${c.label}</div>
        <div class="edu-result-value" style="color: ${c.color}">${c.value}</div>
        <div class="edu-result-note">${c.note}</div>
      </div>
    `).join('');
  }

  // Cash value chart
  const cvCtx = document.getElementById('insuranceCashValueChart');
  if (cvCtx) {
    if (insuranceCashValueChart) insuranceCashValueChart.destroy();
    insuranceCashValueChart = new Chart(cvCtx, {
      type: 'line',
      data: {
        labels: years.map(yr => 'Age ' + (currentAge + yr)),
        datasets: [
          { label: 'PPLI', data: products.ppli.cashValues, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)', fill: true, borderWidth: 2.5, tension: 0.3, pointRadius: 0 },
          { label: 'Whole Life', data: products.wholeLife.cashValues, borderColor: '#10b981', fill: false, borderWidth: 2, tension: 0.3, pointRadius: 0 },
          { label: 'IUL', data: products.iul.cashValues, borderColor: '#f59e0b', fill: false, borderWidth: 2, tension: 0.3, pointRadius: 0 },
          { label: 'Taxable Account', data: taxableValues, borderColor: '#ef4444', fill: false, borderWidth: 2, tension: 0.3, borderDash: [5, 3], pointRadius: 0 },
          { label: 'Total Premiums', data: years.map(yr => premium * Math.min(yr, premiumYears)), borderColor: '#475569', fill: false, borderWidth: 1, tension: 0, borderDash: [3, 3], pointRadius: 0 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 12 } },
          y: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => '$' + (v / 1_000_000).toFixed(1) + 'M' } },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, padding: 10 } },
          tooltip: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, callbacks: { label: ctx => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` } },
        },
      },
    });
  }

  // Death benefit comparison chart
  const dbCtx = document.getElementById('insuranceComparisonChart');
  if (dbCtx) {
    if (insuranceComparisonChart) insuranceComparisonChart.destroy();
    const age75Yr = Math.min(75 - currentAge, projectionYears);
    const strategies = [
      { name: 'PPLI', db: products.ppli.deathBenefits[age75Yr], cv: products.ppli.cashValues[age75Yr], color: '#6366f1' },
      { name: 'Whole Life', db: products.wholeLife.deathBenefits[age75Yr], cv: products.wholeLife.cashValues[age75Yr], color: '#10b981' },
      { name: 'IUL', db: products.iul.deathBenefits[age75Yr], cv: products.iul.cashValues[age75Yr], color: '#f59e0b' },
      { name: 'Taxable (No Insurance)', db: 0, cv: taxableValues[age75Yr], color: '#ef4444' },
    ];

    insuranceComparisonChart = new Chart(dbCtx, {
      type: 'bar',
      data: {
        labels: strategies.map(s => s.name),
        datasets: [
          {
            label: 'Death Benefit (Tax-Free)',
            data: strategies.map(s => s.db),
            backgroundColor: strategies.map(s => s.color + '70'),
            borderColor: strategies.map(s => s.color),
            borderWidth: 2,
            borderRadius: 6,
          },
          {
            label: 'Cash Value',
            data: strategies.map(s => s.cv),
            backgroundColor: strategies.map(s => s.color + '30'),
            borderColor: strategies.map(s => s.color),
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
          y: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => '$' + (v / 1_000_000).toFixed(1) + 'M' } },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, padding: 12 } },
          tooltip: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, callbacks: { label: ctx => `${ctx.dataset.label}: ${fmtFull(ctx.parsed.y)}` } },
        },
      },
    });
  }

  // Tax-free income projection chart
  const incCtx = document.getElementById('insuranceIncomeChart');
  if (incCtx) {
    if (insuranceIncomeChart) insuranceIncomeChart.destroy();
    const incomeStartAge = 65;
    const incomeStartYr = Math.max(0, incomeStartAge - currentAge);
    const incomeYears = 90 - incomeStartAge;
    const incomeAges = Array.from({ length: incomeYears + 1 }, (_, i) => incomeStartAge + i);

    // Income from policy loans (4-5% of remaining cash value)
    const buildIncomeData = (prod, rate) => {
      let cv = prod.cashValues[incomeStartYr];
      return incomeAges.map((_, i) => {
        const income = Math.round(cv * rate);
        cv = cv * (1 + prod.creditRate - prod.costRate) - income;
        return Math.max(0, income);
      });
    };

    insuranceIncomeChart = new Chart(incCtx, {
      type: 'line',
      data: {
        labels: incomeAges.map(a => 'Age ' + a),
        datasets: [
          { label: 'PPLI (Tax-Free)', data: buildIncomeData(products.ppli, 0.045), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, borderWidth: 2.5, tension: 0.3, pointRadius: 0 },
          { label: 'Whole Life (Tax-Free)', data: buildIncomeData(products.wholeLife, 0.04), borderColor: '#10b981', fill: false, borderWidth: 2, tension: 0.3, pointRadius: 0 },
          { label: 'IUL (Tax-Free)', data: buildIncomeData(products.iul, 0.04), borderColor: '#f59e0b', fill: false, borderWidth: 2, tension: 0.3, pointRadius: 0 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 10 } },
          y: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => '$' + (v / 1000).toFixed(0) + 'K' } },
        },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, padding: 10 } },
          tooltip: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, callbacks: { label: ctx => `${ctx.dataset.label}: ${fmtFull(ctx.parsed.y)}/yr` } },
        },
      },
    });
  }

  // Tips
  const tipsContainer = document.getElementById('insurance-tips');
  if (tipsContainer) {
    tipsContainer.innerHTML = insuranceTips.map(tip => `
      <div class="edu-tip-card">
        <div class="edu-tip-header">
          <span class="edu-tip-title">${tip.title}</span>
          <span class="edu-tip-tag">${tip.tag}</span>
        </div>
        <p class="edu-tip-desc">${tip.desc}</p>
      </div>
    `).join('');
  }
}

// ============ SCENARIO SNAPSHOTS ============
let savedSnapshots = JSON.parse(localStorage.getItem('wealthPlannerSnapshots') || '[]');

function saveSnapshot() {
  const inputs = getInputs();
  const eduInputs = getEduInputs();
  const strategies = buildStrategies(inputs.stockValue, inputs.costBasis, inputs.capGainsRate);
  const gain = inputs.stockValue - inputs.costBasis;
  const totalTax = Math.round(gain * inputs.capGainsRate);

  const snapshot = {
    id: Date.now(),
    name: `Scenario ${savedSnapshots.length + 1}`,
    date: new Date().toLocaleString(),
    inputs: {
      stockValue: inputs.stockValue,
      costBasis: inputs.costBasis,
      annualReturn: inputs.annualReturn * 100,
      timeHorizon: inputs.timeHorizon,
      taxBracket: inputs.taxBracket,
      stateRate: inputs.stateRate * 100,
    },
    results: {
      unrealizedGain: gain,
      totalTax: totalTax,
      afterTax: inputs.stockValue - totalTax,
      exchangeFund20yr: Math.round(inputs.stockValue * Math.pow(1 + inputs.annualReturn * 0.935, inputs.timeHorizon)),
      sellReinvest20yr: Math.round(strategies.sell.afterTax * Math.pow(1 + inputs.annualReturn, inputs.timeHorizon)),
    },
  };

  savedSnapshots.push(snapshot);
  localStorage.setItem('wealthPlannerSnapshots', JSON.stringify(savedSnapshots));
  renderSnapshotList();
  document.getElementById('snapshot-panel').classList.remove('hidden');

  // Flash button
  const btn = document.getElementById('saveSnapshotBtn');
  btn.textContent = '✅ Saved!';
  setTimeout(() => { btn.textContent = '📸 Save Scenario'; }, 1500);
}

function toggleSnapshots() {
  const panel = document.getElementById('snapshot-panel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) renderSnapshotList();
}

function renderSnapshotList() {
  const container = document.getElementById('snapshot-list');
  if (!container) return;

  if (savedSnapshots.length === 0) {
    container.innerHTML = '<p class="snapshot-empty">No saved scenarios yet. Adjust parameters and click "Save Scenario".</p>';
    return;
  }

  container.innerHTML = savedSnapshots.map(s => `
    <div class="snapshot-card">
      <div class="snapshot-card-title">${s.name}</div>
      <div class="snapshot-card-meta">${s.date}</div>
      <div class="snapshot-card-stats">
        <div class="snapshot-stat">
          <div class="snapshot-stat-label">Stock Value</div>
          <div class="snapshot-stat-value" style="color:#6366f1">${fmt(s.inputs.stockValue)}</div>
        </div>
        <div class="snapshot-stat">
          <div class="snapshot-stat-label">Cost Basis</div>
          <div class="snapshot-stat-value" style="color:#f59e0b">${fmt(s.inputs.costBasis)}</div>
        </div>
        <div class="snapshot-stat">
          <div class="snapshot-stat-label">Tax if Sold</div>
          <div class="snapshot-stat-value" style="color:#ef4444">${fmt(s.results.totalTax)}</div>
        </div>
        <div class="snapshot-stat">
          <div class="snapshot-stat-label">Exchange ${s.inputs.timeHorizon}yr</div>
          <div class="snapshot-stat-value" style="color:#10b981">${fmt(s.results.exchangeFund20yr)}</div>
        </div>
      </div>
      <div class="snapshot-actions">
        <button class="snapshot-action-btn" onclick="loadSnapshot(${s.id})">Load</button>
        <button class="snapshot-action-btn delete" onclick="deleteSnapshot(${s.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function loadSnapshot(id) {
  const s = savedSnapshots.find(s => s.id === id);
  if (!s) return;

  document.getElementById('stockValue').value = s.inputs.stockValue;
  document.getElementById('costBasis').value = s.inputs.costBasis;
  document.getElementById('annualReturn').value = s.inputs.annualReturn;
  document.getElementById('timeHorizon').value = s.inputs.timeHorizon;
  document.getElementById('stateRate').value = s.inputs.stateRate;

  updateLiveSummary();
  const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
  if (activeTab) rebuildCurrentTab(activeTab);
}

function deleteSnapshot(id) {
  savedSnapshots = savedSnapshots.filter(s => s.id !== id);
  localStorage.setItem('wealthPlannerSnapshots', JSON.stringify(savedSnapshots));
  renderSnapshotList();
}

// ============ PDF EXPORT ============
async function exportPDF() {
  if (typeof html2pdf === 'undefined') {
    alert('PDF generator library is still loading. Please try again in a moment.');
    return;
  }

  const btn = document.getElementById('exportBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Generating PDF...';
  btn.disabled = true;

  // Gather Global Data
  const { stockValue, costBasis, annualReturn, timeHorizon, capGainsRate } = getInputs();
  const gain = stockValue - costBasis;
  const totalTax = Math.round(gain * capGainsRate);
  const afterTax = stockValue - totalTax;

  const sellEnd = Math.round(afterTax * Math.pow(1 + annualReturn, timeHorizon));
  const exchangeEnd = Math.round(stockValue * Math.pow(1 + annualReturn * 0.935, timeHorizon));
  const crtEnd = Math.round(stockValue * Math.pow(1 + annualReturn * 0.94, timeHorizon));

  const estateAtDeath = stockValue * Math.pow(1 + annualReturn, timeHorizon);
  const exemption2026 = 7_000_000;
  const taxableEstate = Math.max(0, estateAtDeath - exemption2026);
  const estateTaxes   = Math.round(taxableEstate * 0.40);
  const netHeirs      = estateAtDeath - estateTaxes;

  const safeWithdrawal = Math.round(stockValue * 0.04);

  // Helper to extract a chart to a static high-res Base64 img tag synchronously
  function extractChartImg(config, width = 1200, height = 600, maxWidth = '800px') {
    let imgHtml = '';
    try {
      const tempDiv = document.createElement('div');
      tempDiv.style.width = width + 'px';
      tempDiv.style.height = height + 'px';
      tempDiv.style.position = 'fixed';
      tempDiv.style.top = '-4000px'; 
      tempDiv.style.left = '0';
      tempDiv.style.display = 'block'; 
      document.body.appendChild(tempDiv);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      tempDiv.appendChild(tempCanvas);

      // Force no animation for instantaneous capture
      if (!config.options) config.options = {};
      config.options.animation = false;
      config.options.responsive = false;

      new Chart(tempCanvas, config);
      imgHtml = `<img src="${tempCanvas.toDataURL('image/png', 1.0)}" style="width: 100%; max-width: ${maxWidth}; display: block; margin: 20px auto; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.05)); border: 1px solid #e2e8f0; border-radius: 8px; background: white;" />`;
      
      document.body.removeChild(tempDiv);
    } catch(e) { console.error('Chart snapshot failed:', e); }
    return imgHtml;
  }

  // 1. Radar Chart Extraction
  const radarImgHtml = extractChartImg({
    type: 'radar',
    data: {
      labels: radarMetrics.map(m => m.subject),
      datasets: [
        { label: 'Exchange Fund', data: radarMetrics.map(m => m.exchange), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.12)', borderWidth: 5, pointRadius: 6 },
        { label: 'Charitable Trust', data: radarMetrics.map(m => m.crt), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 5, pointRadius: 6 },
        { label: 'Sell & Reinvest', data: radarMetrics.map(m => m.sell), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.06)', borderWidth: 5, pointRadius: 6 },
        { label: 'Opp Zone', data: radarMetrics.map(m => m.ozone), borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 5, pointRadius: 6 },
      ]
    },
    options: { 
      layout: { padding: 40 },
      plugins: { legend: { position: 'top', labels: { font: { size: 28, family: "'Helvetica Neue', sans-serif" }, padding: 30, usePointStyle: true, pointStyle: 'rectRounded' } } },
      scales: { r: { ticks: { display: false }, pointLabels: { font: { size: 24, weight: 'bold', family: "'Helvetica Neue', sans-serif" }, color: '#334155' }, grid: { color: '#e2e8f0', lineWidth: 2 }, angleLines: { color: '#cbd5e1', lineWidth: 2 } } }
    }
  }, 1200, 1200, '450px');

  // Regenerate localized projection arrays for deep dive charts
  const projYears = Array.from({length: timeHorizon}, (_, i) => i + 1);
  const yearsWithZero = Array.from({length: timeHorizon + 1}, (_, i) => i);
  const sellData = projYears.map(yr => Math.round(afterTax * Math.pow(1 + annualReturn, yr)));
  const exchangeData = projYears.map(yr => Math.round(stockValue * Math.pow(1 + annualReturn * 0.935, yr)));
  const crtData = projYears.map(yr => Math.round(stockValue * Math.pow(1 + annualReturn * 0.94, yr)));
  
  // 2. Projection Chart Extraction
  const projImgHtml = extractChartImg({
    type: 'line',
    data: {
      labels: projYears.map(yr => 'Yr ' + yr),
      datasets: [
        { label: 'Standard Liquidation (Sell)', data: sellData, borderColor: '#ef4444', borderWidth: 4, pointRadius: 0, fill: false },
        { label: 'Exchange Fund (721)', data: exchangeData, borderColor: '#6366f1', borderWidth: 4, pointRadius: 0, fill: false },
        { label: 'Charitable Trust (CRT)', data: crtData, borderColor: '#10b981', borderWidth: 4, pointRadius: 0, fill: false }
      ]
    },
    options: {
      layout: { padding: 30 },
      scales: { 
        x: { grid: { color: '#e2e8f0' }, ticks: { font: { size: 18, family: "'Helvetica Neue', sans-serif" }, color: '#334155' } },
        y: { grid: { color: '#e2e8f0' }, ticks: { font: { size: 18, family: "'Helvetica Neue', sans-serif" }, color: '#334155', callback: v => '$' + (v / 1_000_000).toFixed(1) + 'M' } }
      },
      plugins: { legend: { position: 'top', labels: { font: { size: 24, family: "'Helvetica Neue', sans-serif" }, usePointStyle: true, padding: 30 } } }
    }
  });

  // 3. Tax Drag Chart Extraction
  const dragData = projYears.map((yr, i) => exchangeData[i] - sellData[i]);
  const taxDragImgHtml = extractChartImg({
    type: 'bar',
    data: {
      labels: projYears.map(yr => 'Yr ' + yr),
      datasets: [{ label: 'Tax Drag Cost (Lost Wealth)', data: dragData, backgroundColor: 'rgba(239, 68, 68, 0.6)', borderColor: '#ef4444', borderWidth: 2 }]
    },
    options: {
      layout: { padding: 30 },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 18, family: "'Helvetica Neue', sans-serif" }, color: '#334155' } },
        y: { grid: { color: '#e2e8f0' }, ticks: { font: { size: 18, family: "'Helvetica Neue', sans-serif" }, color: '#334155', callback: v => '$' + (v / 1_000).toFixed(0) + 'K' } }
      },
      plugins: { legend: { position: 'top', labels: { font: { size: 24, family: "'Helvetica Neue', sans-serif" }, usePointStyle: true, padding: 30 } } }
    }
  });

  // 4. Income Chart Extraction
  const incCrt = yearsWithZero.map(yr => Math.round(crtData[Math.max(0, yr-1)] * 0.06));
  const incEx = yearsWithZero.map(yr => Math.round(exchangeData[Math.max(0, yr-1)] * 0.015));
  const incSell = yearsWithZero.map(yr => Math.round(sellData[Math.max(0, yr-1)] * 0.02));
  const incomeImgHtml = extractChartImg({
    type: 'line',
    data: {
      labels: yearsWithZero.map(yr => 'Yr ' + yr),
      datasets: [
        { label: 'CRT Income (6%)', data: incCrt, borderColor: '#10b981', borderWidth: 4, pointRadius: 0, fill: false },
        { label: 'Exchange Dividends (1.5%)', data: incEx, borderColor: '#6366f1', borderWidth: 4, pointRadius: 0, fill: false },
        { label: 'Sell Dividends (2%)', data: incSell, borderColor: '#ef4444', borderWidth: 4, pointRadius: 0, fill: false }
      ]
    },
    options: {
      layout: { padding: 30 },
      scales: {
        x: { grid: { color: '#e2e8f0' }, ticks: { font: { size: 18, family: "'Helvetica Neue', sans-serif" }, color: '#334155' } },
        y: { grid: { color: '#e2e8f0' }, ticks: { font: { size: 18, family: "'Helvetica Neue', sans-serif" }, color: '#334155', callback: v => '$' + (v / 1_000).toFixed(0) + 'K' } }
      },
      plugins: { legend: { position: 'top', labels: { font: { size: 24, family: "'Helvetica Neue', sans-serif" }, usePointStyle: true, padding: 30 } } }
    }
  });

  // 5. Breakeven Trajectory Chart
  const bkEx = yearsWithZero.map((yr, i) => (yr===0?stockValue:exchangeData[i-1]) - (yr===0?afterTax:sellData[i-1]));
  const bkCrt = yearsWithZero.map((yr, i) => (yr===0?stockValue:crtData[i-1]) - (yr===0?afterTax:sellData[i-1]));
  const breakevenImgHtml = extractChartImg({
    type: 'line',
    data: {
      labels: yearsWithZero.map(yr => 'Yr ' + yr),
      datasets: [
        { label: 'Exchange vs Sell', data: bkEx, borderColor: '#6366f1', borderWidth: 4, pointRadius: 0, fill: 'origin', backgroundColor: 'rgba(99,102,241,0.1)' },
        { label: 'CRT vs Sell', data: bkCrt, borderColor: '#10b981', borderWidth: 4, pointRadius: 0, fill: false },
        { label: 'Breakeven Baseline', data: yearsWithZero.map(()=>0), borderColor: '#475569', borderWidth: 2, borderDash: [5,5], pointRadius: 0, fill: false }
      ]
    },
    options: {
      layout: { padding: 30 },
      scales: {
        x: { grid: { color: '#e2e8f0' }, ticks: { font: { size: 18, family: "'Helvetica Neue', sans-serif" }, color: '#334155' } },
        y: { grid: { color: '#e2e8f0' }, ticks: { font: { size: 18, family: "'Helvetica Neue', sans-serif" }, color: '#334155', callback: v => (v>=0?'+':'') + '$' + (v / 1_000).toFixed(0) + 'K' } }
      },
      plugins: { legend: { position: 'top', labels: { font: { size: 24, family: "'Helvetica Neue', sans-serif" }, usePointStyle: true, padding: 30 } } }
    }
  });

  // Render Table Logic Row Builder for Deep Dive
  let ledgerRows = '';
  // Show Yr 1, then roughly evenly spaced subsets to Yr 10, then terminal year. (Max 10 rows for clean fit)
  const step = Math.max(1, Math.floor(timeHorizon / 8));
  for(let i = 0; i < timeHorizon; i += step) {
     ledgerRows += `
       <tr>
         <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">Year ${projYears[i]}</td>
         <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #ef4444;">-${fmtFull(dragData[i])}</td>
         <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${fmtFull(sellData[i])}</td>
         <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: 600; color: #0B2046;">${fmtFull(exchangeData[i])}</td>
         <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; color: #10b981;">${fmtFull(crtData[i])}</td>
       </tr>
     `;
  }

  const pageHeader = `
    <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #0B2046; padding-bottom: 12px; margin-bottom: 25px;">
      <span style="font-weight: 700; color: #0B2046; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">Advanced Wealth Analytics</span>
      <span style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Strictly Private & Confidential</span>
    </div>
  `;

  // Absolute Math Layout: A4 format ratio at 900px width is exactly 1273px height.
  // Each page block is strictly bound to this exact pixel resolution. No CSS breaks needed.
  const pageWrap = "width: 900px; height: 1273px; padding: 45px 50px; box-sizing: border-box; background: white; overflow: hidden;";

  const htmlContent = `
    <div id="pdf-root" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; background: #e2e8f0;">
      
      <!-- PAGE 1: EXECUTIVE SNAPSHOT -->
      <div style="${pageWrap}">
        ${pageHeader}
        <div style="text-align: left; margin-bottom: 25px;">
          <h1 style="font-size: 38px; font-weight: 300; color: #0B2046; margin: 0 0 5px 0; letter-spacing: -0.5px;">Executive Scenario Summary</h1>
          <p style="font-size: 16px; color: #64748b; margin: 0;">Quantitative Projection Matrix & Structural Allocations</p>
        </div>

        <div style="display: flex; gap: 30px; margin-bottom: 25px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 20px 0;">
          <div style="flex: 1; border-right: 1px solid #e2e8f0; padding-right: 20px;">
            <p style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">Starting Capital</p>
            <p style="font-size: 26px; font-weight: 600; margin: 0; color: #0B2046;">${fmtFull(stockValue)}</p>
          </div>
          <div style="flex: 1; border-right: 1px solid #e2e8f0; padding-right: 20px;">
            <p style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">Tax Liability Exposure</p>
            <p style="font-size: 26px; font-weight: 600; margin: 0; color: #b91c1c;">${fmtFull(totalTax)} <span style="font-size: 14px; font-weight: 400; color: #64748b;">@ ${(capGainsRate*100).toFixed(1)}%</span></p>
          </div>
          <div style="flex: 1;">
            <p style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">Projection Horizon</p>
            <p style="font-size: 26px; font-weight: 600; margin: 0; color: #15803d;">${timeHorizon} Years</p>
          </div>
        </div>

        <h2 style="font-size: 20px; font-weight: 500; text-align: center; color: #0B2046; margin-bottom: -15px;">Multidimensional Strategy Profile</h2>
        ${radarImgHtml}
        
        <div style="background: #f8fafc; border-left: 4px solid #0B2046; padding: 25px 35px; margin-top: 10px;">
          <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #0B2046; font-weight: 600;">Advisor Core Action Plan</h3>
          <p style="margin: 0; font-size: 15px; color: #334155;">Selling ${fmtFull(stockValue)} today instantly destroys ${fmtFull(totalTax)} of compounding momentum. Implementing a hybrid tax-deferral wrapper achieves maximum risk-adjusted limits shown in the radar chart above. Immediate execution of an Exchange Fund mitigates concentration risk securely without triggering taxable friction. Follow-through includes restructuring estate allocations ahead of the 2026 cliff.</p>
        </div>
      </div>

      <!-- PAGE 2: ROI DEEP DIVE -->
      <div style="${pageWrap}">
        ${pageHeader}
        <h1 style="font-size: 32px; font-weight: 300; color: #0B2046; margin: 0 0 25px 0;">Return On Investment (ROI) Deep Dive</h1>
        
        <p style="font-size: 16px; color: #334155; margin-bottom: 40px;">Compounding capital tax-free exponentially outperforms paying taxes immediately, even accounting for the management fees native to sophisticated wrappers. By deploying ${fmtFull(stockValue)} natively without realizing the initial ${fmtFull(totalTax)} liability, the absolute net yield at Year ${timeHorizon} diverges dramatically.</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 50px; font-size: 15px;">
          <thead>
            <tr>
              <th style="padding: 16px 12px; border-bottom: 2px solid #0f172a; color: #0f172a; text-align: left; font-weight: 600;">Execution Strategy</th>
              <th style="padding: 16px 12px; border-bottom: 2px solid #0f172a; color: #0f172a; text-align: right; font-weight: 600;">Tax Frictional Cost</th>
              <th style="padding: 16px 12px; border-bottom: 2px solid #0f172a; color: #0f172a; text-align: right; font-weight: 600;">Capital Preserved</th>
              <th style="padding: 16px 12px; border-bottom: 2px solid #0f172a; color: #0f172a; text-align: right; font-weight: 600;">Valuation (Yr ${timeHorizon})</th>
              <th style="padding: 16px 12px; border-bottom: 2px solid #0f172a; color: #0f172a; text-align: right; font-weight: 600;">Advantage vs Baseline</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">Standard Liquidation</td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; color: #ef4444; font-family: monospace; text-align: right;">-${fmtFull(totalTax)}</td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; text-align: right;">${fmtFull(afterTax)}</td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; text-align: right; font-weight: 600;">${fmtFull(sellEnd)}</td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; color: #94a3b8; text-align: right;">Baseline</td>
            </tr>
            <tr style="background-color: #fafaf9;">
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; color: #0B2046; font-weight: 600;">Exchange Fund (721)</td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; color: #10b981; font-family: monospace; text-align: right;">$0 Deferred</td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; text-align: right;">${fmtFull(stockValue)}</td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-family: monospace; text-align: right; color: #0B2046;">${fmtFull(exchangeEnd)}</td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; color: #10b981; font-weight: 600; text-align: right;">+${fmtFull(exchangeEnd - sellEnd)}</td>
            </tr>
            <tr>
              <td style="padding: 18px 12px; border-bottom: 1px solid #0f172a; color: #0B2046; font-weight: 600;">Charitable Trust (CRT)</td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #0f172a; color: #10b981; font-family: monospace; text-align: right;">$0 Diverted</td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #0f172a; font-family: monospace; text-align: right;">${fmtFull(stockValue)}</td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #0f172a; font-weight: 600; font-family: monospace; text-align: right; color: #0B2046;">${fmtFull(crtEnd)}</td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #0f172a; color: #10b981; font-weight: 600; text-align: right;">+${fmtFull(crtEnd - sellEnd)}</td>
            </tr>
          </tbody>
        </table>

        <h3 style="font-size: 20px; color: #0B2046; font-weight: 600; margin-bottom: 15px;">Institutional Correlation Management</h3>
        <p style="font-size: 16px; color: #334155;">Integrating institutional 'Risk Parity' and 'Managed Futures' mechanically isolates beta drops. When applying historical 2008 or Dot-Com stress scenarios in the Monte Carlo engine, trend-following portfolios significantly reduced the maximum 30% drawdown commonly experienced by classic 60/40 splits, enhancing geometrically compounding longevity.</p>
      </div>

      <!-- PAGE 3: TAX STRUCTURING -->
      <div style="${pageWrap}">
        ${pageHeader}
        <h1 style="font-size: 32px; font-weight: 300; color: #0B2046; margin: 0 0 35px 0;">Advanced Tax Structuring</h1>
        
        <h3 style="font-size: 20px; color: #0B2046; font-weight: 600; margin-bottom: 15px;">Real Estate Offset Dynamics (Section 1031)</h3>
        <p style="font-size: 16px; color: #334155; margin-bottom: 35px;">Utilizing a 1031 Exchange not only defers capital gains on appreciating physical assets but allows step-up basis upon transfer. Reinvesting into higher tier syndicated DSTs provides stabilized yields completely shielded by accelerated depreciation write-offs via cost segregation studies. This essentially generates "phantom income" that is legally tax-free.</p>

        <h3 style="font-size: 20px; color: #0B2046; font-weight: 600; margin-bottom: 15px;">Private Placement Life Insurance (PPLI)</h3>
        <p style="font-size: 16px; color: #334155; margin-bottom: 35px;">For the top 1% tax bracket, locating alternative investments (Credit, Hedge Funds, PE) inside a PPLI wrapper eliminates massive yearly tax drags on K-1 ordinary income. A structured policy effectively permits tax-free withdrawals under the guise of policy loans throughout the entire lifetime.</p>

        <h3 style="font-size: 20px; color: #0B2046; font-weight: 600; margin-bottom: 15px;">Generational Estate Flow Vulnerability</h3>
        <p style="font-size: 16px; color: #334155; margin-bottom: 25px;">At the end of Year ${timeHorizon}, gross projected estate wealth crosses <strong>${fmtFull(estateAtDeath)}</strong>. Assuming standard baseline inaction and the 2026 TCJA sunset dropping the exemption to ${fmtFull(exemption2026)}:</p>
        
        <div style="background: #fafaf9; border: 1px solid #e2e8f0; padding: 25px 35px; border-radius: 4px; border-left: 4px solid #b91c1c; font-size: 16px;">
           <div style="display: flex; justify-content: space-between; margin-bottom: 10px;"><span>Total Estate Value:</span> <strong>${fmtFull(estateAtDeath)}</strong></div>
           <div style="display: flex; justify-content: space-between; margin-bottom: 10px;"><span>Unshielded Taxable Estate:</span> <strong>${fmtFull(taxableEstate)}</strong></div>
           <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0; color: #b91c1c;"><span>Direct Confiscation to IRS @ 40%:</span> <strong>${fmtFull(estateTaxes)}</strong></div>
        </div>
        <p style="font-size: 16px; color: #334155; margin-top: 25px;">We strictly advise funding irrevocable structures (SLATs, IDGTs) immediately to freeze asset valuation and completely eradicate this ${fmtFull(estateTaxes)} tax cliff.</p>
      </div>

      <!-- PAGE 4: RETIREMENT -->
      <div style="${pageWrap}">
        ${pageHeader}
        <h1 style="font-size: 32px; font-weight: 300; color: #0B2046; margin: 0 0 35px 0;">Retirement Sequence Mechanics</h1>
        
        <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 30px; margin-bottom: 40px;">
          <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #0B2046;">Baseline Distribution Feasibility</h3>
          <p style="margin: 0; font-size: 16px; color: #334155;">Based on starting capital of ${fmtFull(stockValue)}:<br><br>
          • The standard <strong>4% Rule</strong> permits a starting gross distribution of <strong>${fmtFull(safeWithdrawal)}/year</strong>.<br>
          • A dynamically conservative <strong>3.5% distribution</strong> yields a highly probable failure-proof rate of <strong>${fmtFull(Math.round(stockValue * 0.035))}/year</strong>, heavily minimizing sequence-of-returns failure even in protracted bear markets.</p>
        </div>

        <h3 style="font-size: 20px; color: #0B2046; font-weight: 600; margin-bottom: 15px;">Navigating Sequence of Return Risk</h3>
        <p style="font-size: 16px; color: #334155; margin-bottom: 35px;">Retirement timing significantly amplifies mathematical vulnerability. Suffering a major structural market correction (such as the 2008 Financial Crisis) directly at the onset of retirement actively destroys the compounding baseline. Utilizing "Bond Tents" (increasing fixed-income allocations precisely 5 years prior and 5 years post-retirement) and shifting towards Non-Correlated assets mechanically insulates the portfolio required for living expenses.</p>
        
        <h3 style="font-size: 20px; color: #0B2046; font-weight: 600; margin-bottom: 15px;">Healthcare Bridges</h3>
        <p style="font-size: 16px; color: #334155; margin-bottom: 30px;">Early retirees transitioning prior to Medicare age (65) are exposed to extreme pre-premium cliffs. Leveraging MAGI-optimization, primarily funding distributions through Roth principal or post-tax accounts, legally retains qualification for massive ACA subsidies, averting $15,000+ in annual overheads across the gap horizon.</p>
      </div>

      <!-- PAGE 5: STRATEGY PLAYBOOK -->
      <div style="${pageWrap}">
        ${pageHeader}
        <h1 style="font-size: 32px; font-weight: 300; color: #0B2046; margin: 0 0 35px 0;">Strategy Playbook Matrix</h1>
        <p style="font-size: 16px; color: #334155; margin-bottom: 25px;">A comprehensive review of available monetization and deferral structures, mapping out primary structural advantages against liquidity and tax frictional costs.</p>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr>
              <th style="padding: 16px 12px; background: #0B2046; color: white; text-align: left; font-weight: 600; width: 25%;">Strategy</th>
              <th style="padding: 16px 12px; background: #0B2046; color: white; text-align: left; font-weight: 600; width: 40%;">Primary Advantages</th>
              <th style="padding: 16px 12px; background: #0B2046; color: white; text-align: left; font-weight: 600; width: 35%;">Key Constraints & Watch-Outs</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0B2046; vertical-align: top;">Direct Liquidation</td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
                <ul style="margin: 0; padding-left: 20px; color: #334155;">
                  <li>Immediate, unrestricted access to cash</li>
                  <li>Zero complexity; no third-party managers</li>
                  <li>Absolute control over reinvestment capital</li>
                </ul>
              </td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
                <ul style="margin: 0; padding-left: 20px; color: #b91c1c;">
                  <li>Triggers immediate maximum capital gains tax</li>
                  <li>Permanently erodes compounding baseline</li>
                </ul>
              </td>
            </tr>
            <tr style="background: #fafaf9;">
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0B2046; vertical-align: top;">Exchange Fund (721)</td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
                <ul style="margin: 0; padding-left: 20px; color: #334155;">
                  <li>Defers 100% of capital gains taxes</li>
                  <li>Instantly achieves institutional diversification</li>
                  <li>Preserves the full gross principal for compounding</li>
                </ul>
              </td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
                <ul style="margin: 0; padding-left: 20px; color: #b91c1c;">
                  <li>Strict 7-year illiquidity lock-up</li>
                  <li>Costly management fees (~1.5% AUM)</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0B2046; vertical-align: top;">Charitable Remainder Trust</td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
                <ul style="margin: 0; padding-left: 20px; color: #334155;">
                  <li>Liquidates highly appreciated stock entirely tax-free</li>
                  <li>Generates immediate charitable tax deduction</li>
                  <li>Provides lifelong fixed or variable income streams</li>
                </ul>
              </td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
                <ul style="margin: 0; padding-left: 20px; color: #b91c1c;">
                  <li>Irrevocable transfer: heirs do not inherit principal</li>
                  <li>Subject to strict IRS payout formulations</li>
                </ul>
              </td>
            </tr>
            <tr style="background: #fafaf9;">
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0B2046; vertical-align: top;">1031 DST Real Estate</td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
                <ul style="margin: 0; padding-left: 20px; color: #334155;">
                  <li>Swaps active management for passive, fractional real estate</li>
                  <li>Infinite tax deferral chain until death (step-up basis)</li>
                  <li>Yields monthly stabilized distributions</li>
                </ul>
              </td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
                <ul style="margin: 0; padding-left: 20px; color: #b91c1c;">
                  <li>Extremely illiquid (5-10 year hold periods typically)</li>
                  <li>Limited heavily to accredited investors only</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0B2046; vertical-align: top;">PPLI / SALI</td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
                <ul style="margin: 0; padding-left: 20px; color: #334155;">
                  <li>Eliminates tax drag on highly tax-inefficient assets (Hedge Funds)</li>
                  <li>Tax-free withdrawals via policy asset loans</li>
                  <li>Completely bypasses estate taxes if held in an ILIT</li>
                </ul>
              </td>
              <td style="padding: 18px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
                <ul style="margin: 0; padding-left: 20px; color: #b91c1c;">
                  <li>High upfront structuring costs and mortality friction</li>
                  <li>Requires massive capital ($5M+) to be efficient</li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGE 6: ROI DEEP DIVE VISUALS -->
      <div style="${pageWrap}">
        ${pageHeader}
        <h1 style="font-size: 32px; font-weight: 300; color: #0B2046; margin: 0 0 15px 0;">ROI Structural Trajectories</h1>
        <p style="font-size: 16px; color: #334155; margin-bottom: 10px;">Geometrical compounding mapping isolating the divergence between tax friction and deferred acceleration.</p>
        
        ${projImgHtml}
        
        ${taxDragImgHtml}

        <h3 style="font-size: 18px; color: #0B2046; font-weight: 600; margin: 10px 0 10px 0;">Year-by-Year Valuation Ledger</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr>
              <th style="padding: 8px 12px; border-bottom: 2px solid #0f172a; color: #0f172a; text-align: left; font-weight: 600;">Year</th>
              <th style="padding: 8px 12px; border-bottom: 2px solid #0f172a; color: #ef4444; text-align: left; font-weight: 600;">Tax Drag Frictional Cost</th>
              <th style="padding: 8px 12px; border-bottom: 2px solid #0f172a; color: #0f172a; text-align: left; font-weight: 600;">Liquidated Baseline</th>
              <th style="padding: 8px 12px; border-bottom: 2px solid #0f172a; color: #0B2046; text-align: left; font-weight: 600;">Deferred Exchange (721)</th>
              <th style="padding: 8px 12px; border-bottom: 2px solid #0f172a; color: #10b981; text-align: left; font-weight: 600;">Charitable Trust (CRT)</th>
            </tr>
          </thead>
          <tbody>
            ${ledgerRows}
          </tbody>
        </table>
      </div>
      
      <!-- PAGE 7: INCOME & BREAKEVEN -->
      <div style="${pageWrap}">
        ${pageHeader}
        <h1 style="font-size: 32px; font-weight: 300; color: #0B2046; margin: 0 0 15px 0;">Income Dynamics & Breakeven Analytics</h1>
        <p style="font-size: 16px; color: #334155; margin-bottom: 20px;">Evaluating cash flow velocity across deferral structures and identifying exact breakeven crossover horizons relative to liquidation.</p>

        <h3 style="font-size: 20px; color: #0B2046; font-weight: 600; margin: 0 0 10px 0; text-align: center;">Distribution Yield Projections</h3>
        ${incomeImgHtml}

        <h3 style="font-size: 20px; color: #0B2046; font-weight: 600; margin: 20px 0 10px 0; text-align: center;">Crossover Arbitrage Matrix</h3>
        ${breakevenImgHtml}
      </div>

    </div>
  `;

  // Absolute Math Configuration
  const opt = {
    margin:       0, // Zero PDF margins. Native pixel padding in the div controls everything cleanly.
    filename:     'Private_Wealth_Executive_Summary.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'px', format: [900, 1273], orientation: 'portrait' } 
    // Format explicitly mirrors CSS dimensions, stopping any auto-slicing logic.
  };

  try {
    await html2pdf().set(opt).from(htmlContent).save();
  } catch (err) {
    console.error('PDF generation failed:', err);
    alert('Failed to generate PDF.');
  }

  // Cleanup
  btn.innerHTML = originalText;
  btn.disabled = false;
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initInputListeners();
  updateLiveSummary();
  renderStrategies();
  renderRadarChart();
});
