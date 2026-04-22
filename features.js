/* ========================================
   NEW FEATURES: Roth, RMD, NetWorth,
   BusinessSale, YearEnd, Compare, AI Chat
   ======================================== */

// Chart instances for new modules
let rothChart, rmdChart, netWorthPieChart, netWorthGrowthChart, businessSaleChart;
let lifetimeTaxBarChart = null, lifetimeWaterfallChart = null;
let ltStrategies = { roth:true, ss70:true, ltcg:true, qcd:true, order:true, irmaa:true };
let ltCurrentView = 'both';
let ltLastResults = null;
let aiChatMessages = [];

// IRS Uniform Lifetime Table for RMDs
function getRMDFactor(age) {
  const t = {72:27.4,73:26.5,74:25.5,75:24.6,76:23.7,77:22.9,78:22.0,79:21.1,80:20.2,
             81:19.4,82:18.5,83:17.7,84:16.8,85:16.0,86:15.2,87:14.4,88:13.7,89:12.9,
             90:12.2,91:11.5,92:10.8,93:10.1,94:9.5,95:8.9,96:8.4,97:7.8,98:7.3,99:6.8,100:6.4};
  return t[Math.min(age, 100)] || 6.4;
}

// ============ NET WORTH DASHBOARD ============
function renderNetWorth() {
  const nw = {
    stocks:        parseFloat(document.getElementById('nwStocks')?.value) || 0,
    realEstate:    parseFloat(document.getElementById('nwRealEstate')?.value) || 0,
    retirement:    parseFloat(document.getElementById('nwRetirement')?.value) || 0,
    rothIra:       parseFloat(document.getElementById('nwRothIra')?.value) || 0,
    privateEquity: parseFloat(document.getElementById('nwPrivateEquity')?.value) || 0,
    crypto:        parseFloat(document.getElementById('nwCrypto')?.value) || 0,
    business:      parseFloat(document.getElementById('nwBusiness')?.value) || 0,
    cash:          parseFloat(document.getElementById('nwCash')?.value) || 0,
    liabilities:   parseFloat(document.getElementById('nwLiabilities')?.value) || 0,
  };
  const { annualReturn, timeHorizon } = getInputs();

  const totalAssets = nw.stocks + nw.realEstate + nw.retirement + nw.rothIra +
                      nw.privateEquity + nw.crypto + nw.business + nw.cash;
  const netWorth    = totalAssets - nw.liabilities;
  const taxable     = nw.stocks + nw.realEstate + nw.privateEquity + nw.crypto + nw.business;
  const liquid      = nw.stocks * 0.9 + nw.cash + nw.crypto * 0.7;
  const semiLiq     = nw.retirement + nw.rothIra + nw.realEstate * 0.2;
  const illiquid    = nw.privateEquity + nw.business + nw.realEstate * 0.8;
  const liqTotal    = Math.max(liquid + semiLiq + illiquid, 1);

  const resEl = document.getElementById('nw-summary');
  if (resEl) resEl.innerHTML = `
    <div class="edu-result-card" style="border-color:#6366f1">
      <div class="result-label">Total Net Worth</div>
      <div class="result-value" style="color:#6366f1">${fmt(netWorth)}</div>
      <div class="result-sub">${fmt(totalAssets)} assets − ${fmt(nw.liabilities)} liabilities</div>
    </div>
    <div class="edu-result-card" style="border-color:#ef4444">
      <div class="result-label">Taxable Assets</div>
      <div class="result-value" style="color:#ef4444">${fmt(taxable)}</div>
      <div class="result-sub">${totalAssets ? ((taxable/totalAssets)*100).toFixed(0) : 0}% of assets — exposed to cap gains</div>
    </div>
    <div class="edu-result-card" style="border-color:#f59e0b">
      <div class="result-label">Tax-Deferred (401k/IRA)</div>
      <div class="result-value" style="color:#f59e0b">${fmt(nw.retirement)}</div>
      <div class="result-sub">Ordinary income tax due on withdrawal</div>
    </div>
    <div class="edu-result-card" style="border-color:#10b981">
      <div class="result-label">Tax-Free (Roth IRA)</div>
      <div class="result-value" style="color:#10b981">${fmt(nw.rothIra)}</div>
      <div class="result-sub">Zero tax on qualified withdrawals</div>
    </div>
  `;

  // Allocation donut chart
  const pieCtx = document.getElementById('netWorthPieChart');
  if (pieCtx) {
    if (netWorthPieChart) netWorthPieChart.destroy();
    const labels = ['Stocks','Real Estate','401k/IRA','Roth IRA','Private Equity','Crypto','Business','Cash'];
    const values = [nw.stocks,nw.realEstate,nw.retirement,nw.rothIra,nw.privateEquity,nw.crypto,nw.business,nw.cash];
    const colors = ['#6366f1','#10b981','#f59e0b','#14b8a6','#8b5cf6','#f43f5e','#0ea5e9','#64748b'];
    netWorthPieChart = new Chart(pieCtx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors.map(c=>c+'bb'), borderColor: colors, borderWidth: 1.5 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '58%',
        plugins: {
          legend: { position: 'right', labels: { color:'#94a3b8', font:{size:11}, padding:10, usePointStyle:true } },
          tooltip: { backgroundColor:'#0f172a', borderColor:'#334155', borderWidth:1,
            callbacks: { label: ctx => `${ctx.label}: ${fmt(ctx.parsed)} (${totalAssets ? ((ctx.parsed/totalAssets)*100).toFixed(1) : 0}%)` } },
        },
      },
    });
  }

  // Net worth growth projection chart
  const growCtx = document.getElementById('netWorthGrowthChart');
  if (growCtx) {
    if (netWorthGrowthChart) netWorthGrowthChart.destroy();
    const r = annualReturn;
    const years = Array.from({length: timeHorizon + 1}, (_, i) => i);
    const stocksD = years.map(y => nw.stocks * Math.pow(1+r, y));
    const rothD   = years.map(y => nw.rothIra * Math.pow(1+r, y));
    const retD    = years.map(y => nw.retirement * Math.pow(1+r*0.85, y));
    const reD     = years.map(y => nw.realEstate * Math.pow(1.04, y));
    const otherD  = years.map(y => (nw.privateEquity+nw.crypto+nw.business+nw.cash) * Math.pow(1+r*0.7, y));
    const totalD  = years.map(y => stocksD[y]+rothD[y]+retD[y]+reD[y]+otherD[y]-nw.liabilities);
    netWorthGrowthChart = new Chart(growCtx, {
      type: 'line',
      data: {
        labels: years.map(y => 'Yr '+y),
        datasets: [
          { label:'Total Net Worth', data:totalD, borderColor:'#6366f1', backgroundColor:'rgba(99,102,241,0.08)', fill:true, borderWidth:2.5, tension:0.3, pointRadius:0 },
          { label:'Tax-Free (Roth)', data:rothD,  borderColor:'#10b981', fill:false, borderWidth:2, tension:0.3, pointRadius:0 },
          { label:'Stocks',          data:stocksD, borderColor:'#f59e0b', fill:false, borderWidth:1.5, borderDash:[4,3], tension:0.3, pointRadius:0 },
        ],
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        interaction:{ mode:'index', intersect:false },
        scales: {
          x:{ grid:{color:'#1e293b'}, ticks:{color:'#475569',font:{size:10}} },
          y:{ grid:{color:'#1e293b'}, ticks:{color:'#475569',font:{size:10}, callback:v=>fmt(v)} },
        },
        plugins: {
          legend:{ labels:{color:'#94a3b8',font:{size:11},padding:12,usePointStyle:true} },
          tooltip:{ backgroundColor:'#0f172a', borderColor:'#334155', borderWidth:1, callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.parsed.y)}`} },
        },
      },
    });
  }

  // Liquidity profile bar
  const liqEl = document.getElementById('nw-liquidity');
  if (liqEl) {
    liqEl.innerHTML = `
      <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:10px">Liquidity Profile</div>
      <div class="nw-liq-bar">
        <div class="nw-liq-seg" style="width:${(liquid/liqTotal*100).toFixed(1)}%;background:#10b981" title="Liquid: ${fmt(liquid)}"></div>
        <div class="nw-liq-seg" style="width:${(semiLiq/liqTotal*100).toFixed(1)}%;background:#f59e0b" title="Semi-Liquid: ${fmt(semiLiq)}"></div>
        <div class="nw-liq-seg" style="width:${(illiquid/liqTotal*100).toFixed(1)}%;background:#ef4444" title="Illiquid: ${fmt(illiquid)}"></div>
      </div>
      <div class="nw-liq-legend">
        <span><span style="color:#10b981">■</span> Liquid ${(liquid/liqTotal*100).toFixed(0)}% &nbsp;${fmt(liquid)}</span>
        <span><span style="color:#f59e0b">■</span> Semi-Liquid ${(semiLiq/liqTotal*100).toFixed(0)}% &nbsp;${fmt(semiLiq)}</span>
        <span><span style="color:#ef4444">■</span> Illiquid ${(illiquid/liqTotal*100).toFixed(0)}% &nbsp;${fmt(illiquid)}</span>
      </div>
    `;
  }
}

// ============ ROTH CONVERSION LADDER ============
function renderRothConversion() {
  const iraBalance      = parseFloat(document.getElementById('rothIraBalance')?.value) || 500000;
  const currentAge      = parseInt(document.getElementById('rothCurrentAge')?.value) || 50;
  const conversionYears = parseInt(document.getElementById('rothConversionYears')?.value) || 15;
  const annualConvert   = parseFloat(document.getElementById('rothAnnualConversion')?.value) || 50000;
  const r               = (parseFloat(document.getElementById('rothReturnRate')?.value) || 7) / 100;
  const tb              = parseFloat(document.getElementById('rothTaxBracket')?.value) || 0.24;
  const projYears = Math.max(conversionYears + 20, 30);

  let tradBal = iraBalance, rothBal = 0, noConvBal = iraBalance;
  const data = [];
  for (let y = 0; y <= projYears; y++) {
    const age = currentAge + y;
    const converting = y > 0 && y <= conversionYears;
    if (y > 0) {
      if (converting) {
        const amt = Math.min(annualConvert, tradBal);
        tradBal = (tradBal - amt) * (1 + r);
        rothBal = (rothBal + amt * (1 - tb)) * (1 + r);
      } else {
        tradBal *= (1 + r);
        rothBal *= (1 + r);
      }
      noConvBal *= (1 + r);
    }
    data.push({ age, y, trad:Math.round(tradBal), roth:Math.round(rothBal),
      combined:Math.round(tradBal+rothBal), noConv:Math.round(noConvBal), converting });
  }

  const last     = data[data.length - 1];
  const totalTax = Math.min(conversionYears * annualConvert, iraBalance) * tb;
  const benefit  = last.combined - last.noConv;

  const resEl = document.getElementById('roth-results');
  if (resEl) resEl.innerHTML = `
    <div class="edu-result-card" style="border-color:#10b981">
      <div class="result-label">Roth Balance (age ${currentAge + projYears})</div>
      <div class="result-value" style="color:#10b981">${fmt(last.roth)}</div>
      <div class="result-sub">100% tax-free forever, no RMDs</div>
    </div>
    <div class="edu-result-card" style="border-color:#6366f1">
      <div class="result-label">Combined Wealth</div>
      <div class="result-value" style="color:#6366f1">${fmt(last.combined)}</div>
      <div class="result-sub">Roth + remaining Traditional IRA</div>
    </div>
    <div class="edu-result-card" style="border-color:#ef4444">
      <div class="result-label">Total Conversion Tax Cost</div>
      <div class="result-value" style="color:#ef4444">${fmt(totalTax)}</div>
      <div class="result-sub">${conversionYears} yrs × ${fmt(annualConvert)} × ${(tb*100).toFixed(0)}%</div>
    </div>
    <div class="edu-result-card" style="border-color:${benefit>=0?'#10b981':'#ef4444'}">
      <div class="result-label">Long-Term Net Benefit</div>
      <div class="result-value" style="color:${benefit>=0?'#10b981':'#ef4444'}">${benefit>=0?'+':''}${fmt(benefit)}</div>
      <div class="result-sub">vs. no conversion strategy</div>
    </div>
  `;

  const ctx = document.getElementById('rothChart');
  if (ctx) {
    if (rothChart) rothChart.destroy();
    rothChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => `Age ${d.age}`),
        datasets: [
          { label:'No Conversion', data:data.map(d=>d.noConv), borderColor:'#ef4444', fill:false, borderWidth:2, tension:0.3, pointRadius:0 },
          { label:'Roth + Traditional (converted)', data:data.map(d=>d.combined), borderColor:'#6366f1', backgroundColor:'rgba(99,102,241,0.08)', fill:true, borderWidth:2.5, tension:0.3, pointRadius:0 },
          { label:'Roth Balance', data:data.map(d=>d.roth), borderColor:'#10b981', fill:false, borderWidth:2, borderDash:[5,3], tension:0.3, pointRadius:0 },
        ],
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        interaction:{ mode:'index', intersect:false },
        scales: {
          x:{ grid:{color:'#1e293b'}, ticks:{color:'#475569',font:{size:10},maxTicksLimit:10} },
          y:{ grid:{color:'#1e293b'}, ticks:{color:'#475569',font:{size:10},callback:v=>fmt(v)} },
        },
        plugins: {
          legend:{ labels:{color:'#94a3b8',font:{size:11},padding:12,usePointStyle:true} },
          tooltip:{ backgroundColor:'#0f172a', borderColor:'#334155', borderWidth:1, callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.parsed.y)}`} },
        },
      },
    });
  }

  const thead = document.querySelector('#roth-year-table thead');
  const tbody = document.querySelector('#roth-year-table tbody');
  if (thead && tbody) {
    thead.innerHTML = '<tr><th>Age</th><th>Phase</th><th>Traditional IRA</th><th>Roth IRA</th><th>Combined</th><th>Annual Tax Cost</th></tr>';
    tbody.innerHTML = data.filter((_,i) => i%3===0 || data[i].age>=68).map(d => `
      <tr>
        <td>${d.age}</td>
        <td style="color:${d.converting?'#f59e0b':'#475569'}">${d.converting?'⟶ Converting': d.y<=conversionYears?'Pre-convert':'Growth'}</td>
        <td style="font-family:monospace;color:#f59e0b">${fmt(d.trad)}</td>
        <td style="font-family:monospace;color:#10b981">${fmt(d.roth)}</td>
        <td style="font-family:monospace;color:#6366f1;font-weight:700">${fmt(d.combined)}</td>
        <td style="font-family:monospace;color:${d.converting?'#ef4444':'#475569'}">${d.converting?'-'+fmt(Math.min(annualConvert,d.trad+annualConvert)*tb):'—'}</td>
      </tr>
    `).join('');
  }
}

// ============ RMD PLANNER ============
function renderRMD() {
  const iraBalance = parseFloat(document.getElementById('rmdIraBalance')?.value) || 1000000;
  const currentAge = parseInt(document.getElementById('rmdCurrentAge')?.value) || 65;
  const r          = (parseFloat(document.getElementById('rmdReturnRate')?.value) || 5) / 100;
  const tb         = parseFloat(document.getElementById('rmdTaxBracket')?.value) || 0.32;

  let balance = iraBalance;
  const projData = [];
  for (let age = currentAge; age <= 95; age++) {
    if (age > currentAge) balance *= (1 + r);
    let rmd = 0;
    if (age >= 73) { rmd = balance / getRMDFactor(age); balance -= rmd; }
    const qcd = age >= 70 ? Math.min(105000, rmd) : 0;
    projData.push({ age, balance:Math.round(Math.max(0,balance)), rmd:Math.round(rmd),
      taxCost:Math.round(rmd*tb), qcd:Math.round(qcd), net:Math.round(rmd*(1-tb)) });
  }

  const rmdRows   = projData.filter(d => d.rmd > 0);
  const totalTax  = rmdRows.reduce((s,d) => s+d.taxCost, 0);
  const peakRmd   = Math.max(...rmdRows.map(d=>d.rmd), 0);
  const peakAge   = rmdRows.find(d => d.rmd===peakRmd)?.age;
  const qcdSaving = rmdRows.reduce((s,d) => s+d.qcd*tb, 0);

  const resEl = document.getElementById('rmd-results');
  if (resEl) resEl.innerHTML = `
    <div class="edu-result-card" style="border-color:#f59e0b">
      <div class="result-label">First RMD at Age 73</div>
      <div class="result-value" style="color:#f59e0b">${fmt(rmdRows[0]?.rmd||0)}/yr</div>
      <div class="result-sub">Forced withdrawal starts</div>
    </div>
    <div class="edu-result-card" style="border-color:#ef4444">
      <div class="result-label">Lifetime Tax on RMDs</div>
      <div class="result-value" style="color:#ef4444">${fmt(totalTax)}</div>
      <div class="result-sub">${(tb*100).toFixed(0)}% bracket on total distributions</div>
    </div>
    <div class="edu-result-card" style="border-color:#8b5cf6">
      <div class="result-label">Peak RMD (age ${peakAge||95})</div>
      <div class="result-value" style="color:#8b5cf6">${fmt(peakRmd)}</div>
      <div class="result-sub">Largest single-year forced withdrawal</div>
    </div>
    <div class="edu-result-card" style="border-color:#10b981">
      <div class="result-label">QCD Tax Savings Opportunity</div>
      <div class="result-value" style="color:#10b981">${fmt(qcdSaving)}</div>
      <div class="result-sub">Up to $105K/yr donated tax-free (age 70½+)</div>
    </div>
  `;

  const ctx = document.getElementById('rmdChart');
  if (ctx) {
    if (rmdChart) rmdChart.destroy();
    const disp = projData.filter(d => d.age>=70 && d.age<=92);
    rmdChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: disp.map(d=>''+d.age),
        datasets: [
          { label:'Annual RMD', data:disp.map(d=>d.rmd), backgroundColor:disp.map(d=>d.age>=73?'rgba(245,158,11,0.75)':'rgba(99,102,241,0.3)'), borderColor:disp.map(d=>d.age>=73?'#f59e0b':'#6366f1'), borderWidth:1.5 },
          { label:'Tax on RMD', data:disp.map(d=>d.taxCost), backgroundColor:'rgba(239,68,68,0.5)', borderColor:'#ef4444', borderWidth:1 },
        ],
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        interaction:{ mode:'index', intersect:false },
        scales: {
          x:{ grid:{color:'#1e293b'}, ticks:{color:'#475569',font:{size:10}} },
          y:{ grid:{color:'#1e293b'}, ticks:{color:'#475569',font:{size:10},callback:v=>fmt(v)} },
        },
        plugins: {
          legend:{ labels:{color:'#94a3b8',font:{size:11},padding:12,usePointStyle:true} },
          tooltip:{ backgroundColor:'#0f172a', borderColor:'#334155', borderWidth:1, callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.parsed.y)}`} },
        },
      },
    });
  }

  const thead = document.querySelector('#rmd-table thead');
  const tbody = document.querySelector('#rmd-table tbody');
  if (thead && tbody) {
    thead.innerHTML = '<tr><th>Age</th><th>IRA Balance</th><th>RMD Amount</th><th>Tax Cost</th><th>Net After Tax</th><th>QCD Opportunity</th></tr>';
    tbody.innerHTML = projData.filter(d=>d.age>=70&&d.age<=90).map(d=>`
      <tr${d.age>=73?' style="background:rgba(245,158,11,0.05)"':''}>
        <td>${d.age}${d.age>=73?' ⚠️':''}</td>
        <td style="font-family:monospace;color:#f59e0b">${fmt(d.balance)}</td>
        <td style="font-family:monospace;color:${d.rmd>0?'#ef4444':'#475569'}">${d.rmd>0?fmt(d.rmd):'—'}</td>
        <td style="font-family:monospace;color:#ef4444">${d.taxCost>0?'-'+fmt(d.taxCost):'—'}</td>
        <td style="font-family:monospace;color:#10b981">${d.net>0?fmt(d.net):'—'}</td>
        <td style="font-family:monospace;color:#14b8a6">${d.qcd>0?fmt(d.qcd):'—'}</td>
      </tr>
    `).join('');
  }
}

// ============ BUSINESS SALE PLANNER ============
function renderBusinessSale() {
  const bizValue     = parseFloat(document.getElementById('bizValue')?.value) || 5000000;
  const bizBasis     = parseFloat(document.getElementById('bizBasis')?.value) || 500000;
  const entityType   = document.getElementById('bizEntityType')?.value || 'scorp';
  const installments = parseInt(document.getElementById('bizInstallments')?.value) || 1;
  const installRate  = (parseFloat(document.getElementById('bizInstallRate')?.value) || 5) / 100;
  const qsbs         = document.getElementById('bizQsbs')?.value === 'yes';
  const tb           = parseFloat(document.getElementById('bizTaxBracket')?.value) || 0.37;
  const { stateRate } = getInputs();

  const gain    = Math.max(0, bizValue - bizBasis);
  const capRate = BASE_CAP_GAINS_RATE + stateRate;

  // Stock sale (LTCG)
  const capGainsTax   = gain * capRate;
  const stockProceeds = bizValue - capGainsTax;

  // Asset sale — ordinary income (goodwill portion)
  const ordinaryTax   = gain * (tb + stateRate);
  const assetProceeds = bizValue - ordinaryTax;

  // C-Corp double tax (corporate + dividend at shareholder level)
  const corpTax    = gain * 0.21;
  const divTax     = Math.max(0, bizValue - corpTax - bizBasis) * BASE_CAP_GAINS_RATE;
  const ccorpNet   = bizValue - corpTax - divTax;

  // QSBS Section 1202 (up to $10M or 10x basis, federal only)
  const qsbsExcl   = qsbs ? Math.min(gain, Math.max(10_000_000, bizBasis * 10)) : 0;
  const qsbsTax    = (gain - qsbsExcl) * capRate;
  const qsbsNet    = bizValue - qsbsTax;

  // Installment sale
  const gainPerYr   = gain / Math.max(installments, 1);
  const totalInstTax = gainPerYr * capRate * installments;
  const pvInstTax   = installments > 1
    ? Array.from({length:installments}, (_,i) => gainPerYr * capRate / Math.pow(1+installRate, i+1)).reduce((a,b)=>a+b,0)
    : totalInstTax;
  const installNet  = bizValue - totalInstTax;

  const assetNet    = entityType === 'ccorp' ? ccorpNet : assetProceeds;
  const assetTaxAmt = entityType === 'ccorp' ? (corpTax + divTax) : ordinaryTax;

  const resEl = document.getElementById('biz-results');
  if (resEl) resEl.innerHTML = `
    <div class="edu-result-card" style="border-color:#6366f1">
      <div class="result-label">Stock Sale (LTCG)</div>
      <div class="result-value" style="color:#6366f1">${fmt(stockProceeds)}</div>
      <div class="result-sub">Tax: ${fmt(capGainsTax)} at ${(capRate*100).toFixed(1)}%</div>
    </div>
    <div class="edu-result-card" style="border-color:#f59e0b">
      <div class="result-label">Asset Sale (${entityType==='ccorp'?'C-Corp':'Ordinary'})</div>
      <div class="result-value" style="color:#f59e0b">${fmt(assetNet)}</div>
      <div class="result-sub">${entityType==='ccorp'?'Double tax: corp + dividend':'Tax: '+fmt(assetTaxAmt)}</div>
    </div>
    ${qsbs?`<div class="edu-result-card" style="border-color:#10b981">
      <div class="result-label">QSBS Sec 1202 Exclusion</div>
      <div class="result-value" style="color:#10b981">${fmt(qsbsNet)}</div>
      <div class="result-sub">Excluded: ${fmt(qsbsExcl)} (federal only)</div>
    </div>`:''}
    <div class="edu-result-card" style="border-color:#8b5cf6">
      <div class="result-label">Installment Sale (${installments} yr)</div>
      <div class="result-value" style="color:#8b5cf6">${fmt(installNet)}</div>
      <div class="result-sub">PV of tax: ${fmt(pvInstTax)} — deferred benefit</div>
    </div>
  `;

  const ctx = document.getElementById('bizSaleChart');
  if (ctx) {
    if (businessSaleChart) businessSaleChart.destroy();
    const lbls = ['Stock Sale\n(LTCG)', 'Asset Sale\n('+(entityType==='ccorp'?'C-Corp':'Ordinary')+')', 'Installment\n('+installments+' yr)'];
    const nets  = [stockProceeds, assetNet, installNet];
    const taxes = [capGainsTax, assetTaxAmt, totalInstTax];
    if (qsbs) { lbls.push('QSBS\n(Sec 1202)'); nets.push(qsbsNet); taxes.push(qsbsTax); }
    const bgC = ['rgba(99,102,241,0.75)','rgba(245,158,11,0.75)','rgba(139,92,246,0.75)','rgba(16,185,129,0.75)'];
    const bdC = ['#6366f1','#f59e0b','#8b5cf6','#10b981'];
    businessSaleChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: lbls,
        datasets: [
          { label:'Net After-Tax Proceeds', data:nets, backgroundColor:bgC.slice(0,lbls.length), borderColor:bdC.slice(0,lbls.length), borderWidth:1.5, borderRadius:4 },
          { label:'Total Tax Paid', data:taxes, backgroundColor:'rgba(239,68,68,0.5)', borderColor:'#ef4444', borderWidth:1, borderRadius:4 },
        ],
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        interaction:{ mode:'index', intersect:false },
        scales: {
          x:{ grid:{color:'#1e293b'}, ticks:{color:'#475569',font:{size:10}} },
          y:{ grid:{color:'#1e293b'}, ticks:{color:'#475569',font:{size:10},callback:v=>fmt(v)} },
        },
        plugins: {
          legend:{ labels:{color:'#94a3b8',font:{size:11},padding:12,usePointStyle:true} },
          tooltip:{ backgroundColor:'#0f172a', borderColor:'#334155', borderWidth:1, callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.parsed.y)}`} },
        },
      },
    });
  }

  // Installment table
  const iw = document.getElementById('install-table-wrap');
  const ith = document.querySelector('#install-table thead');
  const itb = document.querySelector('#install-table tbody');
  if (iw && ith && itb) {
    iw.style.display = installments > 1 ? 'block' : 'none';
    if (installments > 1) {
      ith.innerHTML = '<tr><th>Year</th><th>Principal</th><th>Interest Income</th><th>Tax on Gain</th><th>Net Cash</th><th>Cumulative</th></tr>';
      let cum = 0;
      itb.innerHTML = Array.from({length:Math.min(installments,20)}, (_,i) => {
        const principal = bizValue / installments;
        const interest  = (bizValue - principal * i) * installRate;
        const taxGain   = gainPerYr * capRate;
        const net       = principal + interest - taxGain;
        cum += net;
        return `<tr>
          <td>Year ${i+1}</td>
          <td style="font-family:monospace">${fmt(principal)}</td>
          <td style="font-family:monospace;color:#10b981">+${fmt(interest)}</td>
          <td style="font-family:monospace;color:#ef4444">-${fmt(taxGain)}</td>
          <td style="font-family:monospace;color:#6366f1;font-weight:700">${fmt(net)}</td>
          <td style="font-family:monospace;color:#94a3b8">${fmt(cum)}</td>
        </tr>`;
      }).join('');
    }
  }
}

// ============ YEAR-END ACTION CHECKLIST ============
function renderYearEndChecklist() {
  const { stockValue, costBasis, taxBracket, stateRate } = getInputs();
  const gain = Math.max(0, stockValue - costBasis);
  const hb   = taxBracket >= 0.32;
  const cy   = new Date().getFullYear();
  const d31  = `Dec 31, ${cy}`;

  const all = [
    { p:'critical', cat:'Retirement Savings', a:'Max 401(k) / Solo 401(k) Contribution',
      impact:`~${fmt(Math.round(23500*taxBracket))} federal tax saved`, dl:d31,
      detail:`2025 limit: $23,500 employee ($31,000 if age 50+). At your ${(taxBracket*100).toFixed(0)}% bracket, maxing saves ${fmt(Math.round(23500*taxBracket))} in taxes. Solo 401(k) allows up to $70,000 total (employee + employer).`, show:true },
    { p:'critical', cat:'Tax Harvesting', a:'Harvest Tax Losses to Offset Gains',
      impact:'Offset cap gains dollar-for-dollar', dl:d31,
      detail:`You have ${fmt(gain)} in unrealized gains. Harvest losses in other positions to offset. Mind the 30-day wash-sale rule. Direct indexing can automate daily harvesting against your portfolio.`, show:gain>50000 },
    { p:hb?'critical':'recommended', cat:'Retirement Savings', a:'Max HSA — Triple Tax Savings',
      impact:`${fmt(Math.round(4300*taxBracket))} in annual tax savings`, dl:`April 15, ${cy+1}`,
      detail:`2025 HSA: $4,300 single / $8,550 family (+$1,000 if 55+). Deductible contribution, tax-free growth, tax-free medical withdrawals. Invest HSA in equities — it's a stealth retirement account.`, show:true },
    { p:'critical', cat:'Estate & Gifting', a:'Use Annual Gift Exclusion ($19K/person in 2025)',
      impact:'Transfer wealth tax-free to each heir', dl:d31,
      detail:`Gift $19,000 to each heir (2025 limit). Couples can give $38,000/recipient. These annual gifts reduce your taxable estate immediately and don't use lifetime exemption.`, show:stockValue>=250000 },
    { p:hb?'critical':'recommended', cat:'Charitable Giving', a:'Fund DAF with Appreciated Stock Before Dec 31',
      impact:`${fmt(Math.round(Math.min(stockValue*0.3,200000)*(BASE_CAP_GAINS_RATE+stateRate)))} in avoided cap gains`, dl:d31,
      detail:`Contribute appreciated shares to a Donor-Advised Fund. Full FMV deduction with zero capital gains tax. Recommend grants to charities over future years. 30% of AGI limit for appreciated property.`, show:gain>50000 },
    { p:'recommended', cat:'Retirement Savings', a:'Backdoor Roth IRA Contribution',
      impact:`${fmt(Math.round(7000*taxBracket))} in future tax savings`, dl:`April 15, ${cy+1}`,
      detail:`2025 limit: $7,000 ($8,000 if 50+). Over income limits? Contribute to non-deductible Traditional IRA, then immediately convert to Roth (Backdoor). Legal, widely used, IRS-approved.`, show:true },
    { p:stockValue>=1000000?'critical':'recommended', cat:'Estate Planning', a:'Fund SLAT / GRAT Before 2026 Exemption Sunset',
      impact:`Lock in $13.99M exemption before it drops to ~$7M`, dl:`Dec 31, ${cy}`,
      detail:`Estate exemption halves Jan 1, 2026. If your estate exceeds $7M, fund irrevocable trusts (SLATs, IDGTs) NOW. Every month you delay risks losing $6.99M in shelter per person.`, show:stockValue>=500000 },
    { p:'recommended', cat:'Tax Planning', a:'Pay Q4 Estimated Taxes — Avoid Underpayment Penalty',
      impact:'Avoid 8% IRS penalty on underpayment', dl:`Jan 15, ${cy+1}`,
      detail:`If recognizing gains this year, Q4 estimated payment is due Jan 15. Safe harbor: 100% of prior year tax (110% if AGI > $150K). Current underpayment rate is 8% annualized.`, show:gain>50000 },
    { p:'recommended', cat:'Tax Planning', a:'Roth Conversion — Fill Tax Bracket Before Year-End',
      impact:'Reduce future RMDs, tax-free inheritance', dl:d31,
      detail:`Roth conversions must complete by Dec 31. Calculate the gap between your current income and the top of your bracket — convert only that amount. Ideal in years before age 73 when RMDs begin.`, show:true },
    { p:'optional', cat:'Equity Compensation', a:'Review ISO Exercise for AMT Optimization',
      impact:'Start LTCG clock, optimize $88K AMT exemption', dl:d31,
      detail:`ISOs exercised before Dec 31 start your LTCG clock. 2025 AMT exemption: $88,100 (single) / $137,000 (married). Model how much you can exercise without triggering AMT. Excess generates future AMT credits.`, show:true },
    { p:gain>100000?'recommended':'optional', cat:'Tax Planning', a:'Roll Gains into Qualified Opportunity Zone Fund',
      impact:`Defer ${fmt(gain)} + eliminate 10-yr future gains`, dl:d31,
      detail:`Invest capital gains into a QOZ fund within 180 days of sale. Original gain deferred until Dec 2026. Future appreciation after 10-year hold completely tax-free. Best for gains recognized this tax year.`, show:gain>100000 },
    { p:'optional', cat:'Education', a:'Superfund 529 — 5-Year Gift Tax Election',
      impact:'Up to $95K/child (single) front-loaded tax-free', dl:d31,
      detail:`Elect to front-load 5 years of annual gifts into a 529: $95,000/child single, $190,000/child couple. File Form 709. Jump-starts compounding immediately with one large deposit.`, show:true },
  ].filter(a => a.show);

  const container = document.getElementById('yearend-checklist');
  if (!container) return;

  const order = { critical:0, recommended:1, optional:2 };
  const sorted = [...all].sort((a,b) => order[a.p]-order[b.p]);
  const cats   = [...new Set(sorted.map(a=>a.cat))];
  const pc     = { critical:'#ef4444', recommended:'#f59e0b', optional:'#64748b' };
  const pl     = { critical:'🔴 Critical', recommended:'🟡 Recommended', optional:'⚪ Optional' };

  container.innerHTML = cats.map(cat => {
    const items = sorted.filter(a => a.cat===cat);
    return `<div class="yearend-cat">
      <div class="yearend-cat-title">${cat}</div>
      ${items.map(a=>`
        <div class="yearend-item" style="border-left-color:${pc[a.p]}">
          <div class="yearend-item-top">
            <div class="yearend-item-name">${a.a}</div>
            <div class="yearend-badges">
              <span class="yearend-badge" style="color:${pc[a.p]};background:${pc[a.p]}22">${pl[a.p]}</span>
              <span class="yearend-badge deadline-badge">⏰ ${a.dl}</span>
            </div>
          </div>
          <div class="yearend-impact">💰 ${a.impact}</div>
          <div class="yearend-detail">${a.detail}</div>
        </div>
      `).join('')}
    </div>`;
  }).join('');
}

// ============ SCENARIO COMPARISON DASHBOARD ============
function renderScenarioComparison() {
  const snaps = JSON.parse(localStorage.getItem('wealthPlannerSnapshots') || '[]');
  const container = document.getElementById('scenario-compare-content');
  if (!container) return;

  if (snaps.length === 0) {
    container.innerHTML = `
      <div class="glass-panel" style="text-align:center;padding:64px 24px">
        <div style="font-size:56px;margin-bottom:16px">📸</div>
        <h3 style="color:var(--text-primary);margin-bottom:8px;font-size:18px">No Saved Scenarios Yet</h3>
        <p style="color:var(--text-muted);max-width:400px;margin:0 auto">Use the "Save Scenario" button at the top, then return here to compare them side by side.</p>
      </div>`;
    return;
  }

  const data = snaps.map(s => {
    const sv  = s.inputs.stockValue||1000000;
    const cb  = s.inputs.costBasis||0;
    const ar  = (s.inputs.annualReturn||7)/100;
    const th  = s.inputs.timeHorizon||20;
    const sr  = (s.inputs.stateRate||0)/100;
    const cgr = BASE_CAP_GAINS_RATE + sr;
    const g   = Math.max(0, sv-cb);
    const tax = g * cgr;
    return { ...s, _sv:sv, _ar:ar, _th:th, _g:g, _tax:tax,
      _after:sv-tax, _exch:sv*Math.pow(1+ar*0.935,th), _sell:(sv-tax)*Math.pow(1+ar,th) };
  });

  const metrics = [
    { k:'_sv',    lbl:'Stock Value',              color:'#6366f1', best:null },
    { k:'_g',     lbl:'Unrealized Gain',           color:'#f59e0b', best:null },
    { k:'_tax',   lbl:'Tax if Sold Now',           color:'#ef4444', best:'min' },
    { k:'_after', lbl:'After-Tax Proceeds',        color:'#10b981', best:'max' },
    { k:'_exch',  lbl:`Exchange Fund Projection`,  color:'#6366f1', best:'max' },
    { k:'_sell',  lbl:`Sell & Reinvest Projection`,color:'#94a3b8', best:'max' },
  ];

  const getBest  = m => m.best ? (m.best==='max' ? Math.max(...data.map(d=>d[m.k])) : Math.min(...data.map(d=>d[m.k]))) : null;
  const getWorst = m => m.best ? (m.best==='max' ? Math.min(...data.map(d=>d[m.k])) : Math.max(...data.map(d=>d[m.k]))) : null;

  container.innerHTML = `
    <div class="glass-panel" style="margin-bottom:24px">
      <h3 class="chart-title">Scenario Comparison Matrix</h3>
      <p class="chart-subtitle">${data.length} saved scenarios — green = best outcome, red = worst</p>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="min-width:160px">Metric</th>
              ${data.map(d=>`<th style="color:var(--text-primary)">${d.name}<br><span style="font-size:10px;color:var(--text-muted);font-weight:400">${d.date}</span></th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${metrics.map(m => {
              const best=getBest(m), worst=getWorst(m);
              return `<tr>
                <td style="color:${m.color};font-size:12px;font-weight:600">${m.lbl}</td>
                ${data.map(d => {
                  const v = d[m.k];
                  let color = 'var(--text-primary)';
                  if (best!==null && data.length>1) {
                    if (v===best) color='#10b981';
                    else if (v===worst) color='#ef4444';
                  }
                  return `<td style="font-family:monospace;font-weight:700;font-size:13px;color:${color}">${fmt(v)}</td>`;
                }).join('')}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="compare-cards-grid">
      ${data.map(d=>`
        <div class="glass-panel compare-card">
          <div class="compare-card-name">${d.name}</div>
          <div class="compare-card-date">${d.date}</div>
          <div class="compare-card-metric"><span>Position</span><span style="color:#6366f1">${fmt(d._sv)}</span></div>
          <div class="compare-card-metric"><span>Return</span><span style="color:#10b981">${d.inputs.annualReturn||7}%</span></div>
          <div class="compare-card-metric"><span>Horizon</span><span style="color:#f59e0b">${d.inputs.timeHorizon||20} yrs</span></div>
          <div class="compare-card-metric"><span>Tax Bracket</span><span style="color:#94a3b8">${((d.inputs.taxBracket||0.37)*100).toFixed(0)}%</span></div>
          <button class="snapshot-action-btn" onclick="loadSnapshot(${d.id})" style="width:100%;margin-top:12px;padding:8px">↺ Load This Scenario</button>
        </div>
      `).join('')}
    </div>
    <div id="compare-chart-wrap"></div>
  `;

  if (data.length > 1) {
    const wrap = document.getElementById('compare-chart-wrap');
    if (wrap) {
      wrap.innerHTML = `<div class="glass-panel chart-panel" style="margin-top:24px"><h3 class="chart-title">Projected Wealth — Exchange Fund Strategy</h3><div class="chart-container"><canvas id="compareChart"></canvas></div></div>`;
      const ccCtx = document.getElementById('compareChart');
      if (ccCtx) {
        const maxYrs = Math.max(...data.map(d=>d._th));
        const years  = Array.from({length:maxYrs+1},(_,i)=>i);
        const clrs   = ['#6366f1','#10b981','#f59e0b','#8b5cf6','#0ea5e9','#ef4444'];
        new Chart(ccCtx, {
          type:'line',
          data: {
            labels: years.map(y=>'Yr '+y),
            datasets: data.map((d,i) => ({
              label:d.name,
              data:years.map(y=>Math.round(d._sv*Math.pow(1+d._ar*0.935,y))),
              borderColor:clrs[i%clrs.length], fill:false, borderWidth:2, tension:0.3, pointRadius:0,
            })),
          },
          options: {
            responsive:true, maintainAspectRatio:false,
            interaction:{ mode:'index', intersect:false },
            scales: {
              x:{ grid:{color:'#1e293b'}, ticks:{color:'#475569',font:{size:10}} },
              y:{ grid:{color:'#1e293b'}, ticks:{color:'#475569',font:{size:10},callback:v=>fmt(v)} },
            },
            plugins: {
              legend:{ labels:{color:'#94a3b8',font:{size:11},padding:12,usePointStyle:true} },
              tooltip:{ backgroundColor:'#0f172a', borderColor:'#334155', borderWidth:1, callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.parsed.y)}`} },
            },
          },
        });
      }
    }
  }
}

// ============ AI CHAT ADVISOR ============
function renderAIChat() {
  const savedKey = localStorage.getItem('wealthPlannerApiKey') || '';
  const el = document.getElementById('ai-chat-container');
  if (!el) return;

  el.innerHTML = `
    <div class="glass-panel" style="margin-bottom:24px">
      <div class="section-header">
        <h2>🤖 AI Wealth Advisor</h2>
        <p class="section-desc">Ask questions about your specific scenario — powered by Claude AI (claude-sonnet-4-6)</p>
      </div>
      <div class="ai-key-row">
        <div class="input-group" style="flex:1;min-width:0">
          <label for="aiApiKey">Anthropic API Key (stored in your browser only)</label>
          <div class="input-wrapper">
            <input type="password" id="aiApiKey" value="${savedKey}" placeholder="sk-ant-api03-..." style="font-family:'JetBrains Mono',monospace;font-size:12px" />
          </div>
        </div>
        <button class="mc-run-btn" style="margin-top:24px;white-space:nowrap" onclick="saveAIKey(this)">Save Key</button>
      </div>
      <div class="ai-disclaimer">🔒 Stored only in your browser's localStorage. All calls go directly from your browser to Anthropic's API — no intermediate server. Get your key at console.anthropic.com.</div>
    </div>

    <div class="glass-panel ai-chat-panel">
      <div id="ai-messages" class="ai-messages">
        <div class="ai-msg assistant">
          <div class="ai-avatar-box">◆</div>
          <div class="ai-bubble">Hello! I'm your AI wealth advisor, powered by Claude. I can see your current scenario parameters and help you think through strategies — Roth conversions, estate planning, tax harvesting, business sale structuring, or anything else. What would you like to explore?</div>
        </div>
      </div>
      <div class="ai-suggestions">
        <div class="ai-sugg-label">Try asking:</div>
        <div class="ai-sugg-row">
          <button class="ai-sugg-btn" onclick="askSuggested('What is the optimal strategy for my concentrated stock position?')">Best strategy for my position?</button>
          <button class="ai-sugg-btn" onclick="askSuggested('Should I do Roth conversions given my current tax bracket?')">Should I do Roth conversions?</button>
          <button class="ai-sugg-btn" onclick="askSuggested('What are my most impactful year-end tax actions?')">Year-end priorities?</button>
          <button class="ai-sugg-btn" onclick="askSuggested('How do I minimize estate tax before the 2026 exemption sunset?')">Minimize estate tax?</button>
        </div>
      </div>
      <div class="ai-input-row">
        <textarea id="aiInput" class="ai-textarea" placeholder="Ask about your wealth strategy... (Enter to send, Shift+Enter for new line)" rows="3"></textarea>
        <button class="ai-send-btn" id="aiSendBtn" onclick="sendAIMessage()">Send ↵</button>
      </div>
    </div>
  `;

  document.getElementById('aiInput')?.addEventListener('keydown', e => {
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); }
  });

  if (aiChatMessages.length > 0) renderChatMessages();
}

function saveAIKey(btn) {
  const key = document.getElementById('aiApiKey')?.value?.trim();
  if (key) {
    localStorage.setItem('wealthPlannerApiKey', key);
    if (btn) { const orig = btn.textContent; btn.textContent = '✓ Saved'; setTimeout(()=>btn.textContent=orig, 2000); }
  }
}

function askSuggested(q) {
  const input = document.getElementById('aiInput');
  if (input) { input.value = q; sendAIMessage(); }
}

function renderChatMessages() {
  const box = document.getElementById('ai-messages');
  if (!box) return;
  box.querySelectorAll('.ai-msg:not(:first-child)').forEach(m => m.remove());
  aiChatMessages.forEach(m => {
    const div = document.createElement('div');
    div.className = `ai-msg ${m.role}`;
    const content = m.content
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.*?)\*/g,'<em>$1</em>')
      .replace(/\n/g,'<br>');
    div.innerHTML = m.role==='user'
      ? `<div class="ai-bubble user-bubble">${content}</div><div class="ai-avatar-box user-av">You</div>`
      : `<div class="ai-avatar-box">◆</div><div class="ai-bubble">${content}</div>`;
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
}

async function sendAIMessage() {
  const key = document.getElementById('aiApiKey')?.value?.trim() || localStorage.getItem('wealthPlannerApiKey');
  const msg = document.getElementById('aiInput')?.value?.trim();
  if (!key) { alert('Enter your Anthropic API key above first.'); return; }
  if (!msg) return;

  localStorage.setItem('wealthPlannerApiKey', key);

  const { stockValue, costBasis, annualReturn, timeHorizon, taxBracket, stateRate } = getInputs();
  const gain = Math.max(0, stockValue - costBasis);

  const system = `You are a private wealth advisor AI assistant embedded in a browser-based wealth planning tool. The user's current financial scenario:
- Concentrated stock position: ${fmtFull(stockValue)} | Cost basis: ${fmtFull(costBasis)} | Unrealized gain: ${fmtFull(gain)}
- Cap gains rate: ${((BASE_CAP_GAINS_RATE+stateRate)*100).toFixed(1)}% (federal ${(BASE_CAP_GAINS_RATE*100).toFixed(1)}% + state ${(stateRate*100).toFixed(1)}%)
- Marginal income tax bracket: ${(taxBracket*100).toFixed(0)}% | Expected return: ${(annualReturn*100).toFixed(1)}% | Time horizon: ${timeHorizon} years

Available strategies in this tool: Sell & Reinvest, CRT, Exchange Fund (721), DST, Opportunity Zone, Hedged Collar, Roth Conversion Ladder, RMD Planning, Net Worth Dashboard, Business Sale Planner, Year-End Checklist, Scenario Comparison, Estate Planning, Retirement, 1031 Exchange, Equity Comp/QSBS, AQR Strategies, Insurance (PPLI/Whole Life/IUL).

Be concise and practical (under 300 words unless complex math needed). Lead with a direct answer. Use specific dollar amounts from the scenario when relevant. End with one actionable next step. Always note this is educational guidance, not professional legal or tax advice.`;

  aiChatMessages.push({ role:'user', content:msg });
  document.getElementById('aiInput').value = '';
  const btn = document.getElementById('aiSendBtn');
  if (btn) { btn.disabled=true; btn.textContent='⏳'; }
  renderChatMessages();

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true',
      },
      body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:1024, system, messages:aiChatMessages }),
    });
    if (!res.ok) {
      const e = await res.json().catch(()=>({}));
      throw new Error(e.error?.message || `HTTP ${res.status} — check your API key`);
    }
    const d = await res.json();
    aiChatMessages.push({ role:'assistant', content:d.content[0].text });
  } catch (err) {
    aiChatMessages.push({ role:'assistant', content:`⚠️ Error: ${err.message}` });
  }

  if (btn) { btn.disabled=false; btn.textContent='Send ↵'; }
  renderChatMessages();
}

// ============================================================
//  LIFETIME TAX MINIMIZATION DASHBOARD
// ============================================================

function renderLifetimeTax() {
  const c = document.getElementById('lifetime-tax-container');
  if (!c) return;

  c.innerHTML = `
    <div class="glass-panel" style="margin-bottom:20px">
      <div class="section-header">
        <h2>🎯 Lifetime Tax Minimization Dashboard</h2>
        <p class="section-desc">Your north star metric — total taxes paid from retirement to end of life, and exactly how much each strategy lever saves</p>
      </div>
    </div>

    <div class="lt-ns-row">
      <div class="lt-ns-card glass-panel lt-ns-baseline">
        <div class="lt-ns-label">NO OPTIMIZATION</div>
        <div class="lt-ns-value" id="lt-baseline-num">—</div>
        <div class="lt-ns-sub">Baseline lifetime tax</div>
      </div>
      <div class="lt-ns-arrow">▶</div>
      <div class="lt-ns-card glass-panel lt-ns-optimized">
        <div class="lt-ns-label">WITH STRATEGIES</div>
        <div class="lt-ns-value" id="lt-optimized-num">—</div>
        <div class="lt-ns-sub">Selected strategies applied</div>
      </div>
      <div class="lt-ns-arrow">▶</div>
      <div class="lt-ns-card glass-panel lt-ns-saved">
        <div class="lt-ns-label">LIFETIME SAVED</div>
        <div class="lt-ns-value lt-saved-big" id="lt-saved-num">—</div>
        <div class="lt-ns-sub" id="lt-pct-saved">— % tax reduction</div>
      </div>
    </div>

    <div class="glass-panel" style="margin-bottom:20px;padding:20px">
      <div class="lt-inputs-grid">
        <div class="input-group"><label>Retirement Age</label><div class="input-wrapper"><input type="number" id="ltRetAge" value="65" min="50" max="75" /></div></div>
        <div class="input-group"><label>Life Expectancy</label><div class="input-wrapper"><input type="number" id="ltLifeExp" value="90" min="75" max="100" /></div></div>
        <div class="input-group"><label>Filing Status</label><div class="input-wrapper"><select id="ltFiling"><option value="mfj">Married (MFJ)</option><option value="single">Single</option></select></div></div>
        <div class="input-group"><label>Annual Expenses</label><div class="input-wrapper"><span class="input-prefix">$</span><input type="number" id="ltExpenses" value="120000" min="20000" step="5000" /></div></div>
        <div class="input-group"><label>Traditional IRA/401k</label><div class="input-wrapper"><span class="input-prefix">$</span><input type="number" id="ltTradBal" value="1500000" min="0" step="50000" /></div></div>
        <div class="input-group"><label>Roth IRA</label><div class="input-wrapper"><span class="input-prefix">$</span><input type="number" id="ltRothBalInput" value="300000" min="0" step="25000" /></div></div>
        <div class="input-group"><label>Taxable Brokerage</label><div class="input-wrapper"><span class="input-prefix">$</span><input type="number" id="ltTaxableBal" value="500000" min="0" step="50000" /></div></div>
        <div class="input-group"><label>Taxable Gain %</label><div class="input-wrapper"><input type="number" id="ltGainPct" value="60" min="0" max="95" step="5" /><span class="input-suffix">%</span></div></div>
        <div class="input-group"><label>SS Benefit (mo.)</label><div class="input-wrapper"><span class="input-prefix">$</span><input type="number" id="ltSSBenefit" value="3500" min="0" step="100" /></div></div>
        <div class="input-group"><label>Pension (annual)</label><div class="input-wrapper"><span class="input-prefix">$</span><input type="number" id="ltPension" value="0" min="0" step="5000" /></div></div>
        <div class="input-group"><label>Roth Conv./Year</label><div class="input-wrapper"><span class="input-prefix">$</span><input type="number" id="ltRothConv" value="50000" min="0" step="5000" /></div></div>
        <div class="input-group"><label>QCD/Year (age 70+)</label><div class="input-wrapper"><span class="input-prefix">$</span><input type="number" id="ltQCD" value="15000" min="0" step="1000" /></div></div>
      </div>
    </div>

    <div class="lt-strat-grid">
      ${[
        ['roth',  '🔄', 'Roth Conversion',    'Convert trad→Roth in low-tax window before RMDs hit'],
        ['ss70',  '📅', 'Delay SS to Age 70', '8%/yr increase; reduces SS+RMD tax torpedo overlap'],
        ['ltcg',  '📈', 'LTCG Harvesting',    'Sell appreciated assets in 0% bracket, reset basis'],
        ['qcd',   '🎁', 'QCD Giving',          'Route RMDs to charity — never hits taxable income'],
        ['order', '🗂️', 'Optimal Withdrawal', 'Taxable→Traditional→Roth preserves tax-free growth'],
        ['irmaa', '🏥', 'IRMAA Guard',         'Cap income below Medicare surcharge thresholds'],
      ].map(([key,icon,name,desc]) => `
        <div class="lt-strat-card active" id="lts-${key}" onclick="toggleLTStrategy('${key}',this)">
          <div class="lt-strat-top"><span class="lt-strat-icon">${icon}</span><span class="lt-strat-dot on" id="lts-dot-${key}"></span></div>
          <div class="lt-strat-name">${name}</div>
          <div class="lt-strat-desc">${desc}</div>
          <div class="lt-strat-saving" id="lts-saving-${key}">calculating…</div>
        </div>`).join('')}
    </div>

    <div class="lt-charts-row">
      <div class="glass-panel chart-panel" style="flex:2;min-width:0">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <h3 class="chart-title" style="margin:0">Annual Tax Bill — Retirement to End of Life</h3>
          <div style="display:flex;gap:12px">
            ${['baseline','optimized','both'].map(v=>`<label style="font-size:0.72rem;cursor:pointer;display:flex;align-items:center;gap:4px;color:var(--text-secondary)"><input type="radio" name="ltView" value="${v}" ${v==='both'?'checked':''}> ${v[0].toUpperCase()+v.slice(1)}</label>`).join('')}
          </div>
        </div>
        <div class="chart-container" style="height:300px"><canvas id="ltTaxByYearChart"></canvas></div>
      </div>
      <div class="glass-panel chart-panel" style="flex:1;min-width:240px">
        <h3 class="chart-title">Tax Saved Per Strategy</h3>
        <div class="chart-container" style="height:300px"><canvas id="ltWaterfallChart"></canvas></div>
      </div>
    </div>

    <div class="lt-bottom-row">
      <div class="glass-panel" style="flex:1;min-width:0">
        <h3 class="chart-title" style="margin-bottom:14px">Lifetime Tax by Phase</h3>
        <div id="lt-phase-table"></div>
      </div>
      <div id="lt-torpedo-box" class="lt-torpedo-box glass-panel" style="flex:1;min-width:0;display:none"></div>
    </div>
  `;

  ltStrategies = { roth:true, ss70:true, ltcg:true, qcd:true, order:true, irmaa:true };
  ltCurrentView = 'both';

  document.querySelectorAll('input[name="ltView"]').forEach(el => {
    el.addEventListener('change', () => { ltCurrentView = el.value; renderLTCharts(); });
  });

  ['ltRetAge','ltLifeExp','ltFiling','ltExpenses','ltTradBal','ltRothBalInput',
   'ltTaxableBal','ltGainPct','ltSSBenefit','ltPension','ltRothConv','ltQCD']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', debounce(runLTModel, 300));
    });

  runLTModel();
}

function toggleLTStrategy(key, el) {
  ltStrategies[key] = !ltStrategies[key];
  el.classList.toggle('active', ltStrategies[key]);
  const dot = document.getElementById('lts-dot-' + key);
  if (dot) { dot.className = 'lt-strat-dot ' + (ltStrategies[key] ? 'on' : 'off'); }
  runLTModel();
}

function getLTInputs() {
  const n = id => parseFloat(document.getElementById(id)?.value) || 0;
  const s = id => document.getElementById(id)?.value || '';
  return {
    retAge:       parseInt(document.getElementById('ltRetAge')?.value)  || 65,
    lifeExp:      parseInt(document.getElementById('ltLifeExp')?.value) || 90,
    filing:       s('ltFiling') || 'mfj',
    expenses:     n('ltExpenses')    || 120000,
    tradBal:      n('ltTradBal'),
    rothBal:      n('ltRothBalInput'),
    taxableBal:   n('ltTaxableBal'),
    gainPct:      n('ltGainPct') / 100,
    ssBenefit:    n('ltSSBenefit'),
    pension:      n('ltPension'),
    rothConvAmt:  n('ltRothConv'),
    qcdAmt:       n('ltQCD'),
    annualReturn: (parseFloat(document.getElementById('annualReturn')?.value) || 7) / 100,
  };
}

function ltFedTax(ordIncome, filing, yrOff) {
  const inf = Math.pow(1.025, yrOff);
  const std = (filing === 'mfj' ? 29200 : 14600) * inf;
  const inc = Math.max(0, ordIncome - std);
  const br  = filing === 'mfj'
    ? [[0.10,23200],[0.12,94300],[0.22,201050],[0.24,383900],[0.32,487450],[0.35,731200],[0.37,Infinity]]
    : [[0.10,11600],[0.12,47150],[0.22,100525],[0.24,191950],[0.32,243725],[0.35,609350],[0.37,Infinity]];
  let tax = 0, prev = 0;
  for (const [rate, top] of br) {
    const t = top === Infinity ? Infinity : top * inf;
    if (inc <= prev) break;
    tax += (Math.min(inc, t) - prev) * rate;
    prev = t;
  }
  return Math.round(tax);
}

function ltIRMAA(prevMAGI, filing, yrOff) {
  const inf = Math.pow(1.02, yrOff);
  const tiers = filing === 'mfj'
    ? [[206000,0],[258000,1678],[322000,4194],[386000,6709],[750000,9224],[Infinity,10072]]
    : [[103000,0],[129000,839],[161000,2097],[193000,3354],[500000,4612],[Infinity,5036]];
  let s = 0;
  for (const [thresh, amt] of tiers) {
    if (prevMAGI <= thresh * inf) break;
    s = amt;
  }
  return Math.round(s);
}

function ltSSTaxable(ssAnnual, otherIncome, filing) {
  const prov = otherIncome + ssAnnual * 0.5;
  const [t1, t2] = filing === 'mfj' ? [32000, 44000] : [25000, 34000];
  if (prov <= t1) return 0;
  if (prov <= t2) return Math.min(ssAnnual * 0.5, (prov - t1) * 0.5);
  return Math.min(ssAnnual * 0.85, (t2 - t1) * 0.25 + (prov - t2) * 0.85);
}

function ltRunProjection(p, strats) {
  const { retAge, lifeExp, filing, expenses, tradBal, rothBal,
          taxableBal, gainPct, ssBenefit, pension,
          rothConvAmt, qcdAmt, annualReturn } = p;

  const ssClaimAge = strats.ss70 ? 70 : 67;
  const ssAnnual   = ssBenefit * 12 * (strats.ss70 ? 1.24 : 1.0);
  const rmdStart   = 73;

  let trad    = tradBal;
  let roth    = rothBal;
  let taxable = taxableBal;
  let gRatio  = Math.min(0.97, gainPct);
  let prevMAGI = expenses;

  const rows = [];

  for (let age = retAge; age <= lifeExp; age++) {
    const yr    = age - retAge;
    const inRMD = age >= rmdStart;
    const hasSS = age >= ssClaimAge;
    const inConv = !inRMD && strats.roth && trad > 0;

    const ssIncome   = hasSS ? ssAnnual : 0;
    const pensionInc = pension;
    const guaranteed = ssIncome + pensionInc;

    // RMD
    let rmdReq = inRMD && trad > 0 ? trad / getRMDFactor(Math.min(age, 100)) : 0;

    // QCD offsets RMD
    let qcdUsed = 0;
    if (strats.qcd && age >= 70 && rmdReq > 0) {
      qcdUsed = Math.min(qcdAmt, rmdReq, trad);
    }
    const taxableRMD = Math.max(0, rmdReq - qcdUsed);

    // Roth conversion
    let rothConv = inConv ? Math.min(rothConvAmt, trad) : 0;

    // IRMAA guard: back off conversion if it breaches tier 1
    if (strats.irmaa && rothConv > 0) {
      const infF    = Math.pow(1.02, yr);
      const tier1   = (filing === 'mfj' ? 206000 : 103000) * infF;
      const estOrd  = taxableRMD + rothConv + pensionInc + ssAnnual * 0.85;
      if (estOrd > tier1) rothConv = Math.max(0, rothConv - (estOrd - tier1));
    }

    // Withdrawals to cover expenses
    let tradPull  = taxableRMD + rothConv;
    let rothPull  = 0;
    let taxPull   = 0;
    let gainsSold = 0;
    let rem       = Math.max(0, expenses - guaranteed - taxableRMD - rothConv);

    if (strats.order) {
      // Taxable → Trad → Roth
      if (rem > 0 && taxable > 0) {
        taxPull   = Math.min(rem, taxable);
        gainsSold = taxPull * gRatio;
        taxable  -= taxPull;
        rem      -= taxPull;
      }
      if (rem > 0 && trad > tradPull) {
        const x = Math.min(rem, trad - tradPull);
        tradPull += x;  rem -= x;
      }
      if (rem > 0 && roth > 0) rothPull = Math.min(rem, roth);
    } else {
      // Trad → Roth → Taxable
      if (rem > 0 && trad > tradPull) {
        const x = Math.min(rem, trad - tradPull);
        tradPull += x;  rem -= x;
      }
      if (rem > 0 && roth > 0) { rothPull = Math.min(rem, roth); rem -= rothPull; }
      if (rem > 0 && taxable > 0) {
        taxPull   = Math.min(rem, taxable);
        gainsSold = taxPull * gRatio;
        taxable  -= taxPull;
      }
    }

    // LTCG Harvesting — harvest unrealized gains in 0% bracket
    if (strats.ltcg && taxable > 0 && gRatio > 0) {
      const infF   = Math.pow(1.025, yr);
      const std    = (filing === 'mfj' ? 29200 : 14600) * infF;
      const zero   = (filing === 'mfj' ? 94050 : 47025) * infF;
      const ssT    = ltSSTaxable(ssIncome, tradPull + pensionInc, filing);
      const ordEst = Math.max(0, tradPull + pensionInc + ssT - std);
      const room   = Math.max(0, zero - ordEst);
      const harv   = Math.min(room, taxable * gRatio);
      if (harv > 0) gRatio = Math.max(0, (taxable * gRatio - harv) / taxable);
    }

    // Tax computation
    const ssTax    = ltSSTaxable(ssIncome, tradPull + pensionInc, filing);
    const ordInc   = tradPull + pensionInc + ssTax;
    const incomeTax = ltFedTax(ordInc, filing, yr);

    const infF2    = Math.pow(1.025, yr);
    const std2     = (filing === 'mfj' ? 29200 : 14600) * infF2;
    const zero2    = (filing === 'mfj' ? 94050 : 47025) * infF2;
    const ordForCG = Math.max(0, ordInc - std2);
    const gainsTaxed = Math.max(0, gainsSold - Math.max(0, zero2 - ordForCG));
    const cgTax    = Math.round(gainsTaxed * 0.15);

    const irmaaCost = age >= 65 ? ltIRMAA(prevMAGI, filing, yr) : 0;
    prevMAGI = tradPull + pensionInc + ssIncome + gainsSold;

    const totalTax = incomeTax + cgTax + irmaaCost;

    // Update balances
    trad    = Math.max(0, trad - tradPull - qcdUsed) * (1 + annualReturn);
    roth    = Math.max(0, roth - rothPull + rothConv) * (1 + annualReturn);
    const newTaxGains = taxable * annualReturn;
    const taxableGrew = taxable * (1 + annualReturn);
    gRatio = taxable > 0
      ? Math.min(0.97, (taxable * gRatio + newTaxGains) / taxableGrew)
      : gRatio;
    taxable = taxableGrew;

    rows.push({
      age, incomeTax, cgTax, irmaaCost, totalTax,
      tradBal: Math.round(trad), rothBal: Math.round(roth),
    });
  }

  const total    = rows.reduce((s, r) => s + r.totalTax, 0);
  const incTax   = rows.reduce((s, r) => s + r.incomeTax, 0);
  const cgTaxSum = rows.reduce((s, r) => s + r.cgTax, 0);
  const irmaaSum = rows.reduce((s, r) => s + r.irmaaCost, 0);
  return { rows, total, incTax, cgTaxSum, irmaaSum };
}

function runLTModel() {
  const p = getLTInputs();
  const none = { roth:false, ss70:false, ltcg:false, qcd:false, order:false, irmaa:false };
  const baseline  = ltRunProjection(p, none);
  const optimized = ltRunProjection(p, ltStrategies);

  const saved = baseline.total - optimized.total;
  const pct   = baseline.total > 0 ? (saved / baseline.total * 100) : 0;

  const el = id => document.getElementById(id);
  if (el('lt-baseline-num'))  el('lt-baseline-num').textContent  = fmtFull(baseline.total);
  if (el('lt-optimized-num')) el('lt-optimized-num').textContent = fmtFull(optimized.total);
  if (el('lt-saved-num'))     el('lt-saved-num').textContent     = fmtFull(Math.max(0, saved));
  if (el('lt-pct-saved'))     el('lt-pct-saved').textContent     = pct.toFixed(1) + '% tax reduction';

  // Individual strategy savings
  const stratKeys = ['roth','ss70','ltcg','qcd','order','irmaa'];
  const stratSavings = {};
  for (const key of stratKeys) {
    const r = ltRunProjection(p, { ...none, [key]: true });
    stratSavings[key] = baseline.total - r.total;
    const sv = document.getElementById('lts-saving-' + key);
    if (sv) {
      const v = stratSavings[key];
      sv.textContent = v > 500 ? 'saves ' + fmtFull(v) : (v < -500 ? 'costs ' + fmtFull(-v) : 'minimal impact');
      sv.style.color = v > 500 ? '#10b981' : (v < -500 ? '#ef4444' : '#94a3b8');
    }
  }

  ltLastResults = { baseline, optimized, stratSavings, retAge: p.retAge };
  renderLTPhaseTable(baseline, optimized, p.retAge);
  checkLTTorpedo(baseline, p);
  renderLTCharts();
}

function renderLTPhaseTable(baseline, optimized, retAge) {
  const box = document.getElementById('lt-phase-table');
  if (!box) return;
  const bConv = baseline.rows.filter(r => r.age < 73).reduce((s,r)=>s+r.totalTax,0);
  const bRMD  = baseline.rows.filter(r => r.age >= 73).reduce((s,r)=>s+r.totalTax,0);
  const oConv = optimized.rows.filter(r => r.age < 73).reduce((s,r)=>s+r.totalTax,0);
  const oRMD  = optimized.rows.filter(r => r.age >= 73).reduce((s,r)=>s+r.totalTax,0);

  box.innerHTML = `
    <table class="lt-phase-tbl">
      <thead><tr><th>Phase</th><th>Ages</th><th>Baseline</th><th>Optimized</th><th>Saved</th></tr></thead>
      <tbody>
        <tr>
          <td>Conversion Window</td><td>${retAge}–72</td>
          <td>${fmtFull(bConv)}</td>
          <td class="lt-opt-cell">${fmtFull(oConv)}</td>
          <td class="lt-save-cell">${fmtFull(bConv - oConv)}</td>
        </tr>
        <tr>
          <td>RMD Years</td><td>73+</td>
          <td>${fmtFull(bRMD)}</td>
          <td class="lt-opt-cell">${fmtFull(oRMD)}</td>
          <td class="lt-save-cell">${fmtFull(bRMD - oRMD)}</td>
        </tr>
        <tr class="lt-total-row">
          <td><strong>Total Lifetime</strong></td><td>—</td>
          <td><strong>${fmtFull(baseline.total)}</strong></td>
          <td class="lt-opt-cell"><strong>${fmtFull(optimized.total)}</strong></td>
          <td class="lt-save-cell"><strong>${fmtFull(baseline.total - optimized.total)}</strong></td>
        </tr>
      </tbody>
    </table>
    <div style="margin-top:10px;font-size:0.7rem;color:var(--text-muted)">
      Optimized breakdown — Income tax: ${fmtFull(optimized.incTax)} · Cap gains: ${fmtFull(optimized.cgTaxSum)} · IRMAA: ${fmtFull(optimized.irmaaSum)}
    </div>`;
}

function checkLTTorpedo(baseline, p) {
  const box = document.getElementById('lt-torpedo-box');
  if (!box) return;
  const convRows = baseline.rows.filter(r => r.age < 73);
  const rmdRows  = baseline.rows.filter(r => r.age >= 73);
  if (!rmdRows.length || !convRows.length) { box.style.display = 'none'; return; }
  const convAvg = convRows.reduce((s,r)=>s+r.totalTax,0) / convRows.length;
  const rmdAvg  = rmdRows.reduce((s,r)=>s+r.totalTax,0)  / rmdRows.length;
  const peakRow = baseline.rows.reduce((a,b) => b.totalTax > a.totalTax ? b : a);

  if (rmdAvg > convAvg * 1.4) {
    box.style.display = 'block';
    box.innerHTML = `
      <h3 class="chart-title" style="margin-bottom:10px;color:#f59e0b">⚠️ Tax Torpedo Detected</h3>
      <p style="font-size:0.8rem;line-height:1.65;color:var(--text-secondary)">
        RMD-phase taxes average <strong style="color:#ef4444">${fmtFull(Math.round(rmdAvg))}/yr</strong> — 
        ${((rmdAvg/convAvg-1)*100).toFixed(0)}% higher than conversion-window average of 
        <strong>${fmtFull(Math.round(convAvg))}/yr</strong>.
        Peak year: <strong>age ${peakRow.age}</strong> at <strong style="color:#ef4444">${fmtFull(peakRow.totalTax)}</strong>.
      </p>
      <p style="font-size:0.78rem;line-height:1.6;color:var(--text-muted);margin-top:8px">
        RMDs, Social Security taxation (up to 85% included), and IRMAA surcharges collide simultaneously.
        Roth conversions <em>before age 73</em> are the primary antidote — each $1 converted now eliminates
        the future RMD and its cascading tax effects.
      </p>`;
  } else {
    box.style.display = 'none';
  }
}

function renderLTCharts() {
  if (!ltLastResults) return;
  const { baseline, optimized, stratSavings } = ltLastResults;
  const ages = baseline.rows.map(r => r.age);

  // Annual tax chart
  if (lifetimeTaxBarChart) { lifetimeTaxBarChart.destroy(); lifetimeTaxBarChart = null; }
  const ctx1 = document.getElementById('ltTaxByYearChart');
  if (!ctx1) return;

  let datasets, chartType;
  if (ltCurrentView === 'baseline') {
    chartType = 'bar';
    datasets = [
      { label:'Income Tax',    data: baseline.rows.map(r=>r.incomeTax),  backgroundColor:'rgba(239,68,68,0.75)',  stack:'b' },
      { label:'Cap Gains Tax', data: baseline.rows.map(r=>r.cgTax),      backgroundColor:'rgba(245,158,11,0.75)', stack:'b' },
      { label:'IRMAA',         data: baseline.rows.map(r=>r.irmaaCost),  backgroundColor:'rgba(139,92,246,0.75)', stack:'b' },
    ];
  } else if (ltCurrentView === 'optimized') {
    chartType = 'bar';
    datasets = [
      { label:'Income Tax',    data: optimized.rows.map(r=>r.incomeTax), backgroundColor:'rgba(16,185,129,0.75)', stack:'o' },
      { label:'Cap Gains Tax', data: optimized.rows.map(r=>r.cgTax),     backgroundColor:'rgba(99,102,241,0.75)', stack:'o' },
      { label:'IRMAA',         data: optimized.rows.map(r=>r.irmaaCost), backgroundColor:'rgba(59,130,246,0.75)', stack:'o' },
    ];
  } else {
    chartType = 'line';
    datasets = [
      { label:'Baseline',  data: baseline.rows.map(r=>r.totalTax),  borderColor:'#ef4444', backgroundColor:'rgba(239,68,68,0.12)', fill:true, tension:0.3, pointRadius:0, borderWidth:2.5 },
      { label:'Optimized', data: optimized.rows.map(r=>r.totalTax), borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.12)', fill:true, tension:0.3, pointRadius:0, borderWidth:2.5 },
    ];
  }

  lifetimeTaxBarChart = new Chart(ctx1, {
    type: chartType,
    data: { labels: ages, datasets },
    options: {
      responsive:true, maintainAspectRatio:false, animation:false,
      scales: {
        x: { stacked: chartType==='bar', ticks:{ color:'#94a3b8', font:{size:11} }, grid:{ color:'rgba(255,255,255,0.05)' } },
        y: { stacked: chartType==='bar', ticks:{ color:'#94a3b8', font:{size:11}, callback: v=>'$'+(v>=1000?Math.round(v/1000)+'k':v) }, grid:{ color:'rgba(255,255,255,0.05)' } }
      },
      plugins: {
        legend: { labels:{ color:'#cbd5e1', font:{size:11} } },
        tooltip: { callbacks:{ label: ctx=>' '+ctx.dataset.label+': '+fmtFull(ctx.parsed.y) } }
      }
    }
  });

  // Strategy savings bar (horizontal)
  if (lifetimeWaterfallChart) { lifetimeWaterfallChart.destroy(); lifetimeWaterfallChart = null; }
  const ctx2 = document.getElementById('ltWaterfallChart');
  if (!ctx2) return;

  const stratLabels = { roth:'Roth Conv.', ss70:'SS Delay to 70', ltcg:'LTCG Harvesting', qcd:'QCD Giving', order:'Withdrawal Order', irmaa:'IRMAA Guard' };
  const sKeys  = Object.keys(stratSavings).sort((a,b) => stratSavings[b] - stratSavings[a]);
  const sVals  = sKeys.map(k => Math.round(stratSavings[k] / 1000));
  const sColors = sVals.map(v => v >= 0 ? 'rgba(16,185,129,0.8)' : 'rgba(239,68,68,0.7)');

  lifetimeWaterfallChart = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: sKeys.map(k => stratLabels[k]),
      datasets: [{ label:'Tax Saved ($k)', data:sVals, backgroundColor:sColors, borderRadius:5 }]
    },
    options: {
      indexAxis:'y', responsive:true, maintainAspectRatio:false, animation:false,
      scales: {
        x: { ticks:{ color:'#94a3b8', font:{size:11}, callback:v=>'$'+v+'k' }, grid:{ color:'rgba(255,255,255,0.05)' } },
        y: { ticks:{ color:'#cbd5e1', font:{size:11} }, grid:{ color:'rgba(255,255,255,0.03)' } }
      },
      plugins: {
        legend:{ display:false },
        tooltip:{ callbacks:{ label: ctx => {
          const v = ctx.parsed.x;
          return v >= 0 ? ' Saves $'+Math.abs(v)+'k' : ' Costs $'+Math.abs(v)+'k';
        }}}
      }
    }
  });
}
