/* AETHER v1 — render from window.AETHER_DATA */
(function () {
  "use strict";
  var D = window.AETHER_DATA;
  if (!D) {
    document.body.innerHTML = "<p style='color:#fb7185;padding:2rem'>Missing AETHER_DATA</p>";
    return;
  }

  var AS_OF = D.meta.asOf || "2026-09-02";
  var TZ = D.meta.timezone || "America/New_York";
  var USD = new Intl.NumberFormat("en-US", { style: "currency", currency: D.meta.currency || "USD" });
  function money(n) { return USD.format(Number(n) || 0); }
  function escapeHtml(str) {
    return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  function parseDate(s) { var p = String(s).split("-").map(Number); return new Date(p[0], p[1]-1, p[2]); }
  function addDays(dateStr, n) {
    var dt = parseDate(dateStr); dt.setDate(dt.getDate() + n);
    return dt.getFullYear() + "-" + String(dt.getMonth()+1).padStart(2,"0") + "-" + String(dt.getDate()).padStart(2,"0");
  }
  function daysBetween(a,b){ return Math.round((parseDate(b)-parseDate(a))/86400000); }
  function fmtDateShort(s){ return parseDate(s).toLocaleDateString("en-US",{month:"short",day:"numeric"}); }
  function sumBy(arr,pred){ return arr.filter(pred).reduce(function(s,x){return s+x.amount;},0); }
  function statHtml(s){
    return '<div class="stat"><div class="s-label">'+s.label+'</div><div class="s-value '+s.cls+'">'+s.value+"</div></div>";
  }

  var feeOccurred = sumBy(D.feeEvents, function(e){return e.status==="occurred";});
  var feePrevented = sumBy(D.feeEvents, function(e){return e.status==="prevented";});
  var feeAtRisk = sumBy(D.feeEvents, function(e){return e.status==="at_risk";});
  var checking = D.accounts.checking.balance;
  var savings = D.accounts.savings.balance;
  var dailyBurn = D.burn.dailyBurn;
  var floor = D.meta.safetyFloor;
  var nearHorizon = addDays(AS_OF, 14);
  var nearDebitTotal = D.upcomingDebits.filter(function(d){return d.date<=nearHorizon;})
    .reduce(function(s,d){return s+d.amount;},0);
  var cashBuffer = checking - nearDebitTotal;
  var safeToSpend = Math.max(0, cashBuffer - floor);
  var bufferRunwayDays = dailyBurn > 0 ? cashBuffer / dailyBurn : 0;
  var shieldOn = bufferRunwayDays < 14;
  var monthlySubs = D.subscriptions.reduce(function(s,sub){return s+sub.amount;},0);
  var annualSubs = monthlySubs * 12;
  var killSubs = D.subscriptions.filter(function(s){return s.recommendation==="kill";});
  var killMonthly = killSubs.reduce(function(s,sub){return s+sub.amount;},0);
  var killAnnual = killMonthly * 12;
  var billsSorted = D.bills.slice().sort(function(a,b){return a.dueDate.localeCompare(b.dueDate);});
  var billTotal = billsSorted.reduce(function(s,b){return s+b.amount;},0);

  function findCluster(bills){
    if(!bills.length) return null;
    var best=null;
    for(var i=0;i<bills.length;i++){
      var start=bills[i].dueDate, end=addDays(start,2);
      var group=bills.filter(function(b){return b.dueDate>=start && b.dueDate<=end;});
      var total=group.reduce(function(s,b){return s+b.amount;},0);
      if(!best || total>best.total) best={start:start,end:end,total:total,items:group};
    }
    return best;
  }
  var cluster = findCluster(billsSorted);
  var debtsSorted = D.debts.slice().sort(function(a,b){return b.apr-a.apr;});
  var leftover = D.debtBudget.monthlyLeftoverForDebt;
  var totalMins = debtsSorted.reduce(function(s,d){return s+d.minPayment;},0);
  var avalanchePlan = debtsSorted.map(function(d,i){
    var extra = i===0 ? leftover : 0;
    return Object.assign({}, d, {rank:i+1, extra:extra, recommendedPayment:d.minPayment+extra});
  });
  var liquid = checking + savings;
  var liquidAfterBills = liquid - billTotal;
  var runwayDays = Math.max(0, Math.floor(liquidAfterBills / dailyBurn));
  var runwayStressed = Math.max(0, Math.floor((liquidAfterBills - feeAtRisk) / dailyBurn));
  var checkingRunway = Math.floor(checking / dailyBurn);
  var daysToPaycheck = daysBetween(AS_OF, D.income.nextPaycheckDate);

  var leakMap = {};
  D.feeEvents.forEach(function(e){
    if(e.status==="prevented") return;
    if(!leakMap[e.category]) leakMap[e.category]={category:e.category,label:e.label,amount:0,count:0};
    leakMap[e.category].amount += e.amount; leakMap[e.category].count += 1;
  });
  var topLeaks = Object.keys(leakMap).map(function(k){return leakMap[k];})
    .sort(function(a,b){return b.amount-a.amount;});

  var strip = {
    household: D.meta.household,
    fees_ytd: feeOccurred,
    buffer: Math.round(cashBuffer*100)/100,
    subs_mo: Math.round(monthlySubs*100)/100,
    runway_d: runwayDays
  };

  document.getElementById("metric-strip").innerHTML = [
    {key:"household",label:"household",value:strip.household,cls:"violet"},
    {key:"fees_ytd",label:"fees_ytd",value:money(strip.fees_ytd),cls:"rose"},
    {key:"buffer",label:"buffer",value:money(strip.buffer),cls:"cyan"},
    {key:"subs_mo",label:"subs_mo",value:money(strip.subs_mo),cls:"amber"},
    {key:"runway_d",label:"runway_d",value:strip.runway_d+"d",cls:"emerald"}
  ].map(function(m){
    return '<div class="metric" data-key="'+m.key+'"><div class="label">'+m.label+
      '</div><div class="value '+m.cls+'">'+m.value+"</div></div>";
  }).join("");

  document.getElementById("as-of").textContent = "as of " + AS_OF;
  function tickClock(){
    var str = new Date().toLocaleString("en-US",{timeZone:TZ,weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",hour12:true});
    document.getElementById("clock").textContent = str + " ET";
  }
  tickClock(); setInterval(tickClock, 30000);

  document.getElementById("fee-sub").textContent = money(feePrevented)+" prevented · "+money(feeOccurred)+" occurred · "+money(feeAtRisk)+" at risk";
  document.getElementById("fee-stats").innerHTML = [
    {label:"Prevented",value:money(feePrevented),cls:"emerald"},
    {label:"Occurred (YTD)",value:money(feeOccurred),cls:"rose"},
    {label:"At risk",value:money(feeAtRisk),cls:"amber"},
    {label:"Events",value:String(D.feeEvents.length),cls:"cyan"}
  ].map(statHtml).join("");
  document.getElementById("fee-leaks").innerHTML = topLeaks.map(function(l){
    return '<span class="leak-chip"><span class="badge leak">'+escapeHtml(l.category)+"</span> "+
      escapeHtml(l.label)+" · <strong>"+money(l.amount)+"</strong> ("+l.count+")</span>";
  }).join("") || '<span class="leak-chip">No leaks</span>';
  document.getElementById("fee-list").innerHTML = D.feeEvents.slice().sort(function(a,b){return b.date.localeCompare(a.date);}).map(function(e){
    return '<article class="smart-card"><div class="card-top"><span class="title">'+escapeHtml(e.label)+
      '</span><span class="badge '+e.status+'">'+e.status.replace("_"," ")+'</span></div><div class="amount">'+
      money(e.amount)+'</div><div class="meta-row"><span>'+fmtDateShort(e.date)+
      '</span><span class="badge leak">'+escapeHtml(e.category)+'</span></div><div class="detail">'+
      escapeHtml(e.detail)+"</div></article>";
  }).join("");

  document.getElementById("shield-sub").textContent = "Checking "+money(checking)+" − near-term "+money(nearDebitTotal)+" · shield "+(shieldOn?"ON":"OFF");
  document.getElementById("shield-stats").innerHTML = [
    {label:"Checking",value:money(checking),cls:"cyan"},
    {label:"Near-term debits",value:money(nearDebitTotal),cls:"amber"},
    {label:"Cash buffer",value:money(cashBuffer),cls:cashBuffer>=floor?"emerald":"rose"},
    {label:"Safe to spend",value:money(safeToSpend),cls:"violet"},
    {label:"Buffer runway",value:bufferRunwayDays.toFixed(1)+"d",cls:shieldOn?"rose":"emerald"},
    {label:"Shield",value:shieldOn?"ON (<14d)":"OFF",cls:shieldOn?"rose":"emerald"}
  ].map(statHtml).join("");
  var sim = checking;
  document.getElementById("debit-list").innerHTML = D.upcomingDebits.slice().sort(function(a,b){return a.date.localeCompare(b.date);}).map(function(d){
    var after = sim - d.amount; sim = after; var tight = after < floor;
    return '<article class="smart-card"><div class="card-top"><span class="title">'+escapeHtml(d.name)+
      '</span><span class="badge '+(tight?"at_risk":"prevented")+'">'+(tight?"tight":"ok")+
      '</span></div><div class="amount">'+money(d.amount)+'</div><div class="meta-row"><span>Due <strong>'+
      fmtDateShort(d.date)+"</strong></span><span>After: <strong>"+money(after)+
      '</strong></span></div><div class="detail">'+escapeHtml(d.category)+(tight?" · may press floor "+money(floor):" · within floor")+"</div></article>";
  }).join("");

  document.getElementById("subs-sub").textContent = money(monthlySubs)+" / mo · "+money(annualSubs)+" annualized · kill "+killSubs.length;
  document.getElementById("subs-stats").innerHTML = [
    {label:"Monthly total",value:money(monthlySubs),cls:"cyan"},
    {label:"Annualized",value:money(annualSubs),cls:"violet"},
    {label:"Kill list / mo",value:money(killMonthly),cls:"rose"},
    {label:"Kill annualized",value:money(killAnnual),cls:"amber"}
  ].map(statHtml).join("");
  var killBanner = document.getElementById("kill-banner");
  if(killSubs.length){
    killBanner.hidden=false;
    killBanner.innerHTML="<strong>Kill list:</strong> "+killSubs.map(function(s){return escapeHtml(s.name)+" ("+money(s.amount)+"/mo)";}).join(" · ")+" — reclaim "+money(killAnnual)+"/yr";
  }
  document.getElementById("subs-list").innerHTML = D.subscriptions.slice().sort(function(a,b){
    if(a.recommendation==="kill" && b.recommendation!=="kill") return -1;
    if(b.recommendation==="kill" && a.recommendation!=="kill") return 1;
    return b.amount-a.amount;
  }).map(function(s){
    var annual = s.cadence==="monthly"?s.amount*12:s.amount;
    return '<article class="smart-card"><div class="card-top"><span class="title">'+escapeHtml(s.name)+
      '</span><span class="badge '+s.recommendation+'">'+s.recommendation+'</span></div><div class="amount">'+
      money(s.amount)+'<span style="font-size:0.75rem;color:var(--muted);font-weight:500"> / mo</span></div>'+
      '<div class="meta-row"><span>Annualized <strong>'+money(annual)+"</strong></span><span>Last used <strong>"+
      s.lastUsedDaysAgo+'d</strong> ago</span></div><div class="detail">'+escapeHtml(s.reason)+"</div></article>";
  }).join("");

  document.getElementById("bills-sub").textContent = billsSorted.length+" bills · "+money(billTotal)+" · float 3–5d before due";
  document.getElementById("bills-stats").innerHTML = [
    {label:"Bills",value:String(billsSorted.length),cls:"cyan"},
    {label:"Window total",value:money(billTotal),cls:"violet"},
    {label:"Next cluster",value:cluster?money(cluster.total):"—",cls:"amber"}
  ].map(statHtml).join("");
  var clusterEl = document.getElementById("cluster-banner");
  clusterEl.innerHTML = cluster
    ? "<strong>Next big due cluster</strong> "+fmtDateShort(cluster.start)+"–"+fmtDateShort(cluster.end)+": "+
      cluster.items.map(function(b){return escapeHtml(b.name);}).join(", ")+" · <strong>"+money(cluster.total)+"</strong>"
    : "No bill cluster detected.";
  document.getElementById("bills-list").innerHTML = billsSorted.map(function(b){
    var floatStart=addDays(b.dueDate,-5), floatEnd=addDays(b.dueDate,-3);
    return '<div class="timeline-row"><div class="date-col">'+fmtDateShort(b.dueDate)+
      '</div><div><div class="bill-name">'+escapeHtml(b.name)+' <span class="badge '+b.priority+'">'+b.priority+
      '</span></div><div class="float-win">Float window <strong>'+fmtDateShort(floatStart)+" – "+fmtDateShort(floatEnd)+
      '</strong> (3–5d before due)</div></div><div class="amt">'+money(b.amount)+"</div></div>";
  }).join("");

  var top = avalanchePlan[0];
  document.getElementById("debt-sub").textContent = "Avalanche · leftover "+money(leftover)+" → "+top.name+" after mins "+money(totalMins);
  document.getElementById("debt-stats").innerHTML = [
    {label:"Leftover for debt",value:money(leftover),cls:"amber"},
    {label:"Total mins",value:money(totalMins),cls:"cyan"},
    {label:"Next extra →",value:top.name.split(" ")[0]+" +"+money(leftover),cls:"violet"}
  ].map(statHtml).join("");
  document.getElementById("debt-list").innerHTML = avalanchePlan.map(function(d){
    return '<div class="debt-card'+(d.rank===1?" top":"")+'"><div class="rank-num">'+d.rank+
      '</div><div><div class="debt-name">'+escapeHtml(d.name)+'</div><div class="debt-meta">Balance '+money(d.balance)+
      ' · APR <strong style="color:var(--amber)">'+d.apr.toFixed(2)+"%</strong> · Min "+money(d.minPayment)+
      '</div></div><div class="pay-plan">Recommended<br/><span class="extra">'+money(d.recommendedPayment)+"</span>"+
      (d.extra?'<br/><span style="color:var(--muted);font-size:0.72rem">incl. +'+money(d.extra)+' avalanche</span>':
        '<br/><span style="color:var(--muted);font-size:0.72rem">minimum only</span>')+"</div></div>";
  }).join("");

  document.getElementById("runway-sub").textContent = runwayDays+" days after bills · stress "+runwayStressed+"d if at-risk fees recur · paycheck in "+daysToPaycheck+"d";
  document.getElementById("runway-stats").innerHTML = [
    {label:"Liquid",value:money(liquid),cls:"cyan"},
    {label:"After bills",value:money(liquidAfterBills),cls:"violet"},
    {label:"Daily burn",value:money(Math.round(dailyBurn)),cls:"amber"},
    {label:"Runway",value:runwayDays+"d",cls:"emerald"},
    {label:"Stress runway",value:runwayStressed+"d",cls:"rose"}
  ].map(statHtml).join("");
  document.getElementById("runway-body").innerHTML =
    '<div class="runway-big"><div class="days">'+runwayDays+'</div><div class="unit">days of cash</div>'+
    '<div style="margin-top:0.75rem;font-size:0.8rem;color:var(--muted)">After bills '+money(liquidAfterBills)+
    " ÷ burn "+money(Math.round(dailyBurn))+'/day</div></div><div class="runway-facts">'+
    '<div class="fact">Next paycheck<strong>'+money(D.income.nextPaycheckAmount)+" on "+fmtDateShort(D.income.nextPaycheckDate)+
    " ("+daysToPaycheck+' days)</strong></div><div class="fact">Checking-only runway<strong>'+checkingRunway+
    ' days @ current burn</strong></div><div class="fact">Monthly living burn<strong>'+money(D.burn.monthlyLivingBurn)+
    '</strong></div><div class="fact">Stress if at-risk fees recur<strong>'+money(feeAtRisk)+" → "+runwayStressed+
    ' days</strong></div><div class="fact">Safety floor<strong>'+money(floor)+"</strong></div></div>";

  var panelsRoot = document.getElementById("panels");
  var tabs = document.querySelectorAll(".tab");
  var panelEls = document.querySelectorAll(".panel");
  function showPanel(id){
    tabs.forEach(function(t){ t.classList.toggle("active", t.getAttribute("data-panel")===id); });
    if(id==="all"){ panelsRoot.classList.add("show-all"); panelEls.forEach(function(p){p.hidden=false;}); return; }
    panelsRoot.classList.remove("show-all");
    panelEls.forEach(function(p){ p.hidden = p.getAttribute("data-panel")!==id; });
  }
  tabs.forEach(function(t){ t.addEventListener("click", function(){ showPanel(t.getAttribute("data-panel")); }); });
  showPanel("all");

  window.AETHER_STRIP = strip;
  window.AETHER_COMPUTED = {
    feeOccurred:feeOccurred, feePrevented:feePrevented, feeAtRisk:feeAtRisk,
    nearDebitTotal:nearDebitTotal, cashBuffer:cashBuffer, safeToSpend:safeToSpend,
    bufferRunwayDays:bufferRunwayDays, shieldOn:shieldOn, monthlySubs:monthlySubs,
    killAnnual:killAnnual, billTotal:billTotal, runwayDays:runwayDays,
    runwayStressed:runwayStressed, leftover:leftover, topDebt:top.name
  };
})();
