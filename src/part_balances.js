/* ================= BALANCES: advances & dues (vendors and workers) ================= */
// Match what is owed (bills / work) against payments, oldest first. Whatever payment is left over is an advance.
function fifo(debits,credits){const D=debits.map(x=>({...x,left:+x.a||0})).sort((a,b)=>a.d.localeCompare(b.d)),C=credits.map(x=>({...x,left:+x.a||0})).sort((a,b)=>a.d.localeCompare(b.d));
  let i=0;for(const c of C){while(c.left>0.5&&i<D.length){const t=Math.min(c.left,D[i].left);D[i].left-=t;c.left-=t;if(D[i].left<=0.5)i++}}
  return{open:D.filter(x=>x.left>0.5),adv:C.filter(c=>c.left>0.5)}}
// What happened since the account was last fully settled: work/bills owed, advances & part-payments given, net to pay
function settle(debits,credits){const E=[...debits.map(x=>({...x,k:'d'})),...credits.map(x=>({...x,k:'c'}))].sort((a,b)=>a.d.localeCompare(b.d)||(a.k==='c'?-1:1));
  let bal=0,last=-1,carried=0,carriedOn='';E.forEach((e,i)=>{bal+=e.k==='d'?+e.a:-e.a;if(e.k==='c'&&bal<=0.5){last=i;carried=bal;carriedOn=e.d}});
  const W=E.slice(last+1);const open=W.filter(e=>e.k==='d').map(e=>({...e,left:+e.a})),adv=W.filter(e=>e.k==='c').map(e=>({...e,left:+e.a}));
  if(carried<-0.5)adv.unshift({d:carriedOn,left:-carried,lab:T('Advance carried forward')});
  const due=sum(open,x=>x.left),advance=sum(adv,x=>x.left);return{open,adv,due,advance,net:due-advance}}
const isCredit=x=>x.mode==='Pay later (credit)';
let VC=null;const bust=()=>{VC=null};
function vendBal(id){VC=VC||{};if(VC[id])return VC[id];
  const bills=S.expenses.filter(x=>x.vendorId===id&&isCredit(x)&&!x.paidOn).map(x=>({d:x.date,a:+x.amount||0,x}));
  const pays=S.vpays.filter(p=>p.vendorId===id).map(p=>({d:p.date,a:+p.amount||0,p}));
  const r=fifo(bills,pays);r.due=sum(r.open,b=>b.left);r.advance=sum(r.adv,c=>c.left);r.bal=r.due-r.advance;r.openIds=new Set(r.open.map(b=>b.x.id));return VC[id]=r}
const payable=x=>isCredit(x)&&!x.paidOn&&(x.vendorId?vendBal(x.vendorId).openIds.has(x.id):true);
const vendorsDue=()=>sum(S.vendors,v=>Math.max(0,vendBal(v.id).bal))+sum(S.expenses.filter(x=>!x.vendorId&&payable(x)),x=>x.amount);
function workerBal(id){const w=wkr(id);
  const earn=[...wShifts(id).filter(s=>+s.amount>0&&s.date<=today()).map(s=>({d:s.date,a:+s.amount,lab:(s.eventId?evName(byId('events',s.eventId)||{}):(s.place||T('General')))+(isGrp(w)?' · '+heads(s)+' '+T('people'):'')+' · '+s.days+' '+T(+s.days===1?'day':'days')})),...salaryRows(w).map(r=>({d:r.d,a:r.a,lab:T('Salary')+' · '+r.lab}))];
  const pays=S.expenses.filter(x=>x.workerId===id).map(x=>({d:x.date,a:+x.amount||0,lab:T(x.note||'Paid')+' · '+T(x.mode)}));
  const r=fifo(earn,pays);r.due=sum(r.open,b=>b.left);r.advance=sum(r.adv,c=>c.left);r.net=r.due-r.advance;return r}
function balBlock(r,owedLabel){return `<div class="card" style="padding:8px 14px">
  <div class="row" style="padding:4px 0"><b class="sp">${owedLabel}</b><b class="out">${inr(r.due)}</b></div>
  ${r.open.slice(-8).map(b=>`<div class="row mut" style="padding:2px 0 2px 10px;font-size:13px"><span class="sp">${fd(b.d)} · ${esc(b.lab||(b.x&&catName(b.x.cat))||'')}</span><span>${inr(b.left)}</span></div>`).join('')}${r.open.length>8?`<div class="mut" style="padding-left:10px;font-size:12px">+ ${r.open.length-8} ${T('more')}</div>`:''}
  <div class="row" style="padding:8px 0 4px;border-top:1px solid var(--line);margin-top:6px"><b class="sp">${T('Advance / part payments given')}</b><b class="warn">− ${inr(r.advance)}</b></div>
  ${r.adv.map(c=>`<div class="row mut" style="padding:2px 0 2px 10px;font-size:13px"><span class="sp">${fd(c.d)} · ${esc(c.lab||'')}</span><span>${inr(c.left)}</span></div>`).join('')||`<div class="mut" style="padding-left:10px;font-size:13px">${T('None')}</div>`}
  <div class="row" style="padding:8px 0 2px;border-top:1px solid var(--line);margin-top:6px"><b class="sp">${(r.due-r.advance)>=0?T('Balance to pay'):T('Advance still with them')}</b><b class="${(r.due-r.advance)>0?'out':'warn'}" style="font-size:18px">${inr(Math.abs(r.due-r.advance))}</b></div></div>`}

/* ---- worker pay sheet ---- */
function workerSettle(id){const w=wkr(id);
  const earn=[...wShifts(id).filter(s=>+s.amount>0&&s.date<=today()).map(s=>({d:s.date,a:+s.amount,lab:(s.eventId?evName(byId('events',s.eventId)||{}):(s.place||T('General')))+(isGrp(w)?' · '+heads(s)+' '+T('people'):'')+' · '+s.days+' '+T(+s.days===1?'day':'days')})),...salaryRows(w).map(r=>({d:r.d,a:r.a,lab:T('Salary')+' · '+r.lab}))];
  return settle(earn,S.expenses.filter(x=>x.workerId===id).map(x=>({d:x.date,a:+x.amount||0,lab:T(x.note||'Paid')+' · '+T(x.mode)})))}
function workerPay(id,advance){const w=wkr(id),r=workerSettle(id);const net=Math.max(0,r.net);
  sheet(`<h3>₹ ${esc(w.name)}</h3>${advance?'':balBlock(r,T('Work not yet paid'))}<form id="f">
  <div class="seg" id="pk">${[['wages',T('Pay wages')],['advance',T('Give advance')]].map(([k,l])=>`<button type="button" class="${(advance?'advance':'wages')===k?'on':''}" data-k="${k}">${l}</button>`).join('')}</div>
  <label>${T('Amount (₹)')} *</label><input name="amount" type="number" inputmode="numeric" required value="${advance?'':net||''}">
  <div class="g2"><div><label>${T('Date')}</label><input name="date" type="date" value="${today()}"></div><div><label>${T('Mode')}</label><select name="mode">${MODES.map(m=>`<option value="${m}" ${m===(isSal(w)?'Bank transfer':'Cash')?'selected':''}>${T(m)}</option>`).join('')}</select></div></div>
  <label>${T('Note')}</label><input name="note2" placeholder="${T('optional')}">
  <button class="btn w" style="margin-top:14px">${T('Save')}</button></form>`);
  const f=$('#f');let kind=advance?'advance':'wages';
  $('#pk').onclick=e=>{const b=e.target.closest('button');if(!b)return;kind=b.dataset.k;$('#pk').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));f.amount.value=kind==='wages'?(net||''):''};
  f.onsubmit=e=>{e.preventDefault();const o=Object.fromEntries(new FormData(f));
    S.expenses.push(stamp({id:uid(),date:o.date,amount:+o.amount,cat:wPayCat(w),workerId:id,eventId:'',mode:o.mode,note:kind==='advance'?'Advance':(isSal(w)?'Salary':'Wages'),memo:o.note2}));save();close();render();workerView(id)}}

/* ---- vendors with ledger ---- */
function vendRow(v){const b=vendBal(v.id),tot=sum(S.expenses.filter(x=>x.vendorId===v.id),x=>x.amount);
  return `<div class="item" onclick="vendView('${v.id}')">${ava(v.name,'sq')}<div class="sp"><div class="t1">${esc(v.name)}</div><div class="mut">${[v.type&&esc(v.type),v.phone&&esc(v.phone),placeLine(v)].filter(Boolean).join(' · ')}</div></div>${b.bal>0.5?`<span class="pill due">${T('Due')} ${short(b.bal)}</span>`:b.bal<-0.5?`<span class="pill enq">${T('Advance')} ${short(-b.bal)}</span>`:can.money()?`<span class="mut">${short(tot)}</span>`:''}</div>`}
function vendView(id){const v=vend(id);if(!v)return;const b=vendBal(id);const xs=S.expenses.filter(x=>x.vendorId===id);
  const L=[...xs.map(x=>({d:x.date,t:'b',x})),...S.vpays.filter(p=>p.vendorId===id).map(p=>({d:p.date,t:'p',p}))].sort((a,b2)=>a.d.localeCompare(b2.d)||(a.t==='b'?-1:1));
  let bal=0;L.forEach(r=>{if(r.t==='b'&&isCredit(r.x)&&!r.x.paidOn)bal+=+r.x.amount||0;if(r.t==='p')bal-=+r.p.amount||0;r.bal=bal});L.reverse();
  sheet(`<div class="row"><h3 class="sp">${esc(v.name)}</h3>${can.add()?`<button class="btn ghost sm" onclick="vendForm('${id}')">${T('Edit')}</button>`:''}</div>
  <div class="mut">${[v.type,v.phone,placeLine(v),v.gstin&&'GSTIN '+v.gstin,v.upi&&'UPI '+v.upi].filter(Boolean).map(esc).join(' · ')}</div>
  <div class="kpis" style="margin-top:12px">${kpi(T('Total purchases'),inr(sum(xs,x=>x.amount)),'',xs.length+' '+T('bills'))}${kpi(b.bal>=0?T('Due to vendor'):T('Advance with vendor'),inr(Math.abs(b.bal)),b.bal>0?'out':b.bal<0?'warn':'',b.open.length?b.open.length+' '+T('unpaid bills'):'')}</div>
  ${can.add()?`<div class="row" style="gap:8px"><button class="btn sp" onclick="vendPay('${id}')">₹ ${T('Pay')}${b.bal>0?' '+inr(b.bal):''}</button><button class="btn ghost sp" onclick="vendPay('${id}',1)">${T('Give advance')}</button></div>
  <button class="btn ghost w" onclick="expForm(null,null,{vendorId:'${id}',cat:'${esc(v.cat||'Groceries')}'${b.bal<0?",mode:'Pay later (credit)'":''}})">+ ${T('Purchase / bill')}</button>`:''}
  ${(()=>{const o=S.events.filter(e=>(e.vendorIds||[]).includes(id)&&e.status!=='cancelled').sort((a,c)=>c.date.localeCompare(a.date));return o.length?`<h2>${T('Orders')}</h2><div class="card">${o.slice(0,10).map(evRow).join('')}</div>`:''})()}
  <h2>${T('Bills & payments')}</h2><div class="card" style="padding:4px 14px">${L.map(r=>r.t==='b'?`<div class="item" onclick="expForm('${r.x.id}')">${catTile(r.x.cat)}<div class="sp"><div class="t1">${esc(catName(r.x.cat))}${attIcon(r.x)}${(r.x.lines||[]).length?` · ${r.x.lines.length} ${T('items')}`:''}</div><div class="mut">${fd(r.d)} · ${isCredit(r.x)?(payable(r.x)?`<span class="pill due">${T('Unpaid')}</span>`:`<span class="pill done">${T('Settled')}</span>`):T(r.x.mode)}</div></div><div style="text-align:right"><div class="amt out">${inr(r.x.amount)}</div>${isCredit(r.x)?`<span class="mut" style="font-size:11px">${T('Balance')} ${inr(r.bal)}</span>`:''}</div></div>`
    :`<div class="item" onclick="${can.del()?`vendPayEdit('${r.p.id}')`:''}">${tile('income','green')}<div class="sp"><div class="t1">${T(r.p.kind==='advance'?'Advance':'Payment')} · ${T(r.p.mode)}${attIcon(r.p)}</div><div class="mut">${fd(r.d)}${r.p.note?' · '+esc(r.p.note):''}${r.p.by?' · '+esc(r.p.by):''}</div></div><div style="text-align:right"><div class="amt in">−${inr(r.p.amount)}</div><span class="mut" style="font-size:11px">${T('Balance')} ${inr(r.bal)}</span></div></div>`).join('')||`<div class="empty">${T('Nothing here')}</div>`}</div>`)}
function vendSettle(id){return settle(S.expenses.filter(x=>x.vendorId===id&&isCredit(x)&&!x.paidOn).map(x=>({d:x.date,a:+x.amount||0,lab:catName(x.cat)+((x.lines||[]).length?' · '+x.lines.length+' '+T('items'):'')+(x.note?' · '+x.note:'')})),
  S.vpays.filter(p=>p.vendorId===id).map(p=>({d:p.date,a:+p.amount||0,lab:T(p.kind==='advance'?'Advance':'Payment')+' · '+T(p.mode)+(p.note?' · '+p.note:'')})))}
function vendPay(id,advance){const v=vend(id),b=vendSettle(id),net=Math.max(0,b.net);
  sheet(`<h3>₹ ${esc(v.name)}</h3>${advance?'':balBlock(b,T('Unpaid bills'))}<form id="f">
  <div class="seg" id="pk">${[['payment',T('Pay bills')],['advance',T('Give advance')]].map(([k,l])=>`<button type="button" class="${(advance?'advance':'payment')===k?'on':''}" data-k="${k}">${l}</button>`).join('')}</div>
  <label>${T('Amount (₹)')} *</label><input name="amount" type="number" inputmode="numeric" required value="${advance?'':net||''}">
  <div class="g2"><div><label>${T('Date')}</label><input name="date" type="date" value="${today()}"></div><div><label>${T('Mode')}</label><select name="mode">${MODES.map(m=>`<option value="${m}">${T(m)}</option>`).join('')}</select></div></div>
  <label>${T('Note')}</label><input name="note" placeholder="${T('optional')}">${attEditor([])}
  <button class="btn w" style="margin-top:14px">${T('Save')}</button></form>`);
  attDraw();const f=$('#f');let kind=advance?'advance':'payment';
  $('#pk').onclick=e=>{const bt=e.target.closest('button');if(!bt)return;kind=bt.dataset.k;$('#pk').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===bt));f.amount.value=kind==='payment'?(net||''):''};
  f.onsubmit=async e=>{e.preventDefault();const o=Object.fromEntries(new FormData(f));const att=await attCommit();
    S.vpays.push(stamp({id:uid(),vendorId:id,date:o.date,amount:+o.amount,mode:o.mode,kind,note:o.note,att}));save();close();render();vendView(id)}}
function vendPayEdit(pid){const p=byId('vpays',pid);if(!p)return;
  sheet(`<h3>${T(p.kind==='advance'?'Advance':'Payment')} · ${inr(p.amount)}</h3><div class="mut">${fd(p.date)} · ${T(p.mode)}${p.note?' · '+esc(p.note):''}</div>${attStrip(p.att)}
  <button class="btn red w" onclick="if(confirm('Delete?')){S.vpays=S.vpays.filter(x=>x.id!=='${pid}');save();close();render();vendView('${p.vendorId}')}">${T('Delete')}</button>`)}
