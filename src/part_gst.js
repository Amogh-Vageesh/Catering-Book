/* ================= GST: split, calculator, digital bills ================= */
const GST_STATES={'01':'Jammu & Kashmir','02':'Himachal Pradesh','03':'Punjab','04':'Chandigarh','05':'Uttarakhand','06':'Haryana','07':'Delhi','08':'Rajasthan','09':'Uttar Pradesh','10':'Bihar','11':'Sikkim','12':'Arunachal Pradesh','13':'Nagaland','14':'Manipur','15':'Mizoram','16':'Tripura','17':'Meghalaya','18':'Assam','19':'West Bengal','20':'Jharkhand','21':'Odisha','22':'Chhattisgarh','23':'Madhya Pradesh','24':'Gujarat','26':'Dadra & Nagar Haveli and Daman & Diu','27':'Maharashtra','29':'Karnataka','30':'Goa','31':'Lakshadweep','32':'Kerala','33':'Tamil Nadu','34':'Puducherry','35':'Andaman & Nicobar','36':'Telangana','37':'Andhra Pradesh','38':'Ladakh'};
const SVC_RATES=[[5,'5% · Outdoor / hall catering (no ITC)'],[18,'18% · Hotel or specified premises (with ITC)'],[0,'0% · Exempt']];
const GOODS_RATES=[0,5,18,40];
const gMode=e=>e.gstMode||(+e.gst>0?'extra':'none');
const st2=g=>{g=String(g||'').slice(0,2);return /^\d\d$/.test(g)&&GST_STATES[g]?g:''};
const bizState=()=>st2(S.gstin)||S.stateCode||'29';
const custStateOf=e=>e.pos||st2((cust(e.customerId)||{}).gstin)||bizState();
const inr2=n=>'₹'+(+n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const pct=r=>(+r||0)+'%';

/* One place that works out every order's GST. ov = {mode, gst, pos} to preview changes. */
function gstBreak(e,ov){
  if(!ov&&GBC.has(e))return GBC.get(e);
  const o=ov?Object.assign({},e,ov):e;const mode=gMode(o),sr=mode==='none'?0:(+o.gst||0),incl=mode==='incl';
  const L=[],P=+o.plates||0,R=+o.rate||0;
  if(P&&R)L.push({d:'Catering service',code:'996334',q:P,unit:'plates',u:R,amt:P*R,r:sr,svc:1});
  if(+o.extra)L.push({d:'Extras',code:'996334',q:1,u:+o.extra,amt:+o.extra,r:sr,svc:1});
  (o.goods||[]).forEach(g=>{const q=+g.q||0,u=+g.r||0;if(g.n&&q&&u)L.push({d:g.n,code:g.h||'',q,unit:g.unit||'',u,amt:q*u,r:mode==='none'?0:(+g.g||0)})});
  if(+o.discount){const base=L.filter(l=>l.svc);L.push({d:'Discount',code:'',q:1,u:-o.discount,amt:-o.discount,r:base.length?sr:(L[0]?L[0].r:0),svc:1,disc:1})}
  L.forEach(l=>{l.tv=incl?l.amt*100/(100+l.r):l.amt;l.tax=l.tv*l.r/100;l.uv=l.q?l.tv/l.q:l.tv});
  const gross=sum(L,l=>l.amt),tax=Math.round(sum(L,l=>l.tax)),taxable=incl?Math.round(gross)-tax:Math.round(gross);
  const sl={};L.forEach(l=>{const s=sl[l.r]||(sl[l.r]={r:l.r,tv:0,tax:0});s.tv+=l.tv;s.tax+=l.tax});
  const pos=custStateOf(o),inter=pos!==bizState();
  const out={L,mode,incl,sr,gross,taxable,tax,total:taxable+tax,slabs:Object.values(sl).filter(s=>s.tv).sort((a,b)=>a.r-b.r),pos,inter,
    igst:inter?tax:0,cgst:inter?0:tax/2,sgst:inter?0:tax/2,
    svc:sum(L.filter(l=>l.svc),l=>l.tv),goods:sum(L.filter(l=>!l.svc),l=>l.tv),svcTax:sum(L.filter(l=>l.svc),l=>l.tax),goodsTax:sum(L.filter(l=>!l.svc),l=>l.tax)};
  if(!ov)GBC.set(e,out);return out}
function gstLine(b){if(!b.tax)return T('No GST')+' · '+T('Total')+' '+inr(b.total);
  return `${T('Taxable')} ${inr(b.taxable)} + GST ${inr(b.tax)} (${b.inter?'IGST':'CGST '+inr2(b.cgst)+' + SGST '+inr2(b.sgst)}) = <b>${inr(b.total)}</b>`}

/* ---- order form: GST block + items sold at the event ---- */
function gstBlock(e){const m=gMode(e);
  return `<h2 style="margin-top:18px">GST</h2><div class="seg" id="gm">${[['none','No GST'],['extra','GST extra'],['incl','GST included']].map(([k,l])=>`<button type="button" data-m="${k}" class="${m===k?'on':''}">${T(l)}</button>`).join('')}</div><input type="hidden" name="gstMode" value="${m}">
  <div id="gsr" style="display:${m==='none'?'none':''}"><label>${T('GST on catering service')}</label><select name="gst">${SVC_RATES.map(([v,l])=>`<option value="${v}" ${(m==='none'?5:+e.gst)===v?'selected':''}>${T(l)}</option>`).join('')}</select>
  <div class="mut" style="margin-top:4px">${T('SAC 996334 · rate per plate is')} <b id="gmw">${T(m==='incl'?'including GST':'before GST')}</b></div></div>
  <details class="goods" ${(e.goods||[]).length?'open':''}><summary>${ico('box',18)} ${T('Items sold at the event')} <span class="mut">(${T('optional')})</span></summary>
  <div class="mut" style="margin:4px 0 6px">${T('Sweets boxes, return gifts, water bottles, rentals… each can have its own GST rate.')}</div>
  <div id="goods">${(e.goods||[]).map(goodsRow).join('')}</div><button type="button" class="btn ghost sm" onclick="$('#goods').insertAdjacentHTML('beforeend',goodsRow({g:5}));$('#f').oninput&&$('#f').oninput()">+ ${T('Add item')}</button></details>`}
const goodsRow=g=>`<div class="grow"><input data-k="n" placeholder="${T('Item')}" value="${esc(g.n||'')}"><input data-k="q" type="number" inputmode="decimal" placeholder="${T('Qty')}" value="${esc(g.q||'')}"><input data-k="r" type="number" inputmode="decimal" placeholder="${T('Rate')}" value="${esc(g.r||'')}"><select data-k="g">${GOODS_RATES.map(r=>`<option value="${r}" ${+g.g===r?'selected':''}>${r}%</option>`).join('')}</select><button type="button" class="x" onclick="this.parentNode.remove();$('#f').oninput&&$('#f').oninput()" aria-label="Remove">✕</button></div>`;
function readGoods(){return [...document.querySelectorAll('#goods .grow')].map(r=>{const o={};r.querySelectorAll('[data-k]').forEach(i=>o[i.dataset.k]=i.dataset.k==='n'?i.value.trim():+i.value||0);return o}).filter(g=>g.n&&g.q&&g.r)}
function wireGst(f,onChange){const seg=$('#gm');if(!seg)return;seg.onclick=ev=>{const b=ev.target.closest('button');if(!b)return;seg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));f.gstMode.value=b.dataset.m;$('#gsr').style.display=b.dataset.m==='none'?'none':'';const w=$('#gmw');if(w)w.textContent=T(b.dataset.m==='incl'?'including GST':'before GST');if(b.dataset.m!=='none'&&!+f.gst.value&&f.gst.dataset.touched!=='1')f.gst.value='5';onChange&&onChange()};f.gst.onchange=()=>{f.gst.dataset.touched='1';onChange&&onChange()}}
function formDraft(f,e){const c=S.customers.find(x=>x.name.toLowerCase()===(f.cname?f.cname.value:'').trim().toLowerCase());
  return {plates:+f.plates.value||0,rate:+f.rate.value||0,extra:+f.extra.value||0,discount:+f.discount.value||0,gst:+f.gst.value||0,gstMode:f.gstMode.value,goods:readGoods(),customerId:c?c.id:(e&&e.customerId),pos:e&&e.pos}}

/* ---- numbers in words (Indian system) ---- */
function words(n){n=Math.round(n);if(!n)return 'Zero';const a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'],b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const two=x=>x<20?a[x]:b[Math.floor(x/10)]+(x%10?' '+a[x%10]:''),three=x=>(x>=100?a[Math.floor(x/100)]+' Hundred'+(x%100?' ':''):'')+(x%100?two(x%100):'');
  const p=[];const cr=Math.floor(n/1e7);n%=1e7;const l=Math.floor(n/1e5);n%=1e5;const th=Math.floor(n/1e3);n%=1e3;
  if(cr)p.push((cr>999?words(cr):three(cr))+' Crore');if(l)p.push(two(l)+' Lakh');if(th)p.push(two(th)+' Thousand');if(n)p.push(three(n));return p.join(' ')}
const rupeesWords=n=>'Rupees '+words(n)+' Only';

/* ---- bills ---- */
function nextBillNo(date){const pre=(S.invPrefix||'INV').trim()||'INV',fy=fyLabel(fyStart(date||today())),k=pre+'/'+fy+'/';
  let mx=0;S.events.forEach(e=>(e.bills||[]).forEach(b=>{if(String(b.no).startsWith(k)){const n=parseInt(String(b.no).slice(k.length));if(n>mx)mx=n}}));
  return k+String(mx+1).padStart(3,'0')}
const bizInfo=()=>({name:S.biz,gstin:S.gstin||'',pan:S.pan||'',addr:S.addr||'',phone:S.phone||'',email:S.email||'',state:bizState(),upi:S.upi||'',bankName:S.bankName||'',bankAcc:S.bankAcc||'',bankIfsc:S.bankIfsc||'',terms:S.terms||''});
function billForm(eid){const e=byId('events',eid);if(!e)return;const m0=gMode(e),withG=m0!=='none';
  sheet(`<h3>${T('Create bill')} — ${esc(evName(e))}</h3><form id="f">
  <div class="seg" id="bk"><button type="button" data-k="tax" class="${withG?'on':''}">🧾 ${T('With GST')}</button><button type="button" data-k="bill" class="${withG?'':'on'}">${T('Without GST')}</button></div>
  <div id="bwarn"></div>
  <div id="bg" style="display:${withG?'':'none'}">
   <div class="seg" id="bm" style="margin-top:10px"><button type="button" data-m="extra" class="${m0!=='incl'?'on':''}">${T('GST extra')}</button><button type="button" data-m="incl" class="${m0==='incl'?'on':''}">${T('GST included')}</button></div>
   <div class="g2"><div><label>${T('GST on catering service')}</label><select name="gst">${SVC_RATES.map(([v,l])=>`<option value="${v}" ${(+e.gst||5)===v?'selected':''}>${T(l)}</option>`).join('')}</select></div>
   <div><label>${T('Place of supply')}</label><select name="pos">${Object.entries(GST_STATES).map(([k,v])=>`<option value="${k}" ${custStateOf(e)===k?'selected':''}>${k} · ${esc(v)}</option>`).join('')}</select></div></div></div>
  <div class="g2"><div><label>${T('Bill no.')}</label><input name="no" value="${esc(nextBillNo())}"></div><div><label>${T('Bill date')}</label><input name="date" type="date" value="${today()}"></div></div>
  <div class="card" id="bprev" style="margin-top:12px"></div>
  <div class="mut" style="margin-top:6px">${T('Saving also updates this order’s GST so the order value, dues and tax reports match the bill.')}</div>
  <button class="btn w" style="margin-top:12px">${ico('invoice',18)} ${T('Create bill')}</button></form>`);
  const f=$('#f');let kind=withG?'tax':'bill',mode=m0==='none'?'extra':m0;
  const ov=()=>kind==='bill'?{gstMode:'none',pos:f.pos.value}:{gstMode:mode,gst:+f.gst.value,pos:f.pos.value};
  const upd=()=>{if(!$('#bprev'))return;const b=gstBreak(e,ov());
    $('#bprev').innerHTML=`${b.L.map(l=>`<div class="row" style="padding:3px 0"><span class="sp">${esc(T(l.d))}${l.q>1?` <span class="mut">${l.q} × ${inr2(l.u)}</span>`:''}</span><span class="mut">${l.r?pct(l.r):''}</span><b style="min-width:90px;text-align:right">${inr2(l.tv)}</b></div>`).join('')||`<div class="empty">${T('Add plates and rate to the order first')}</div>`}
     ${b.tax?`<div class="row" style="border-top:1px dashed var(--line);margin-top:6px;padding-top:6px"><span class="sp">${T('Taxable value')}</span><b>${inr2(b.taxable)}</b></div>${b.inter?`<div class="row"><span class="sp">IGST</span><b>${inr2(b.igst)}</b></div>`:`<div class="row"><span class="sp">CGST</span><b>${inr2(b.cgst)}</b></div><div class="row"><span class="sp">SGST</span><b>${inr2(b.sgst)}</b></div>`}`:''}
     <div class="row" style="border-top:1px solid var(--line);margin-top:6px;padding-top:6px;font-size:17px"><span class="sp"><b>${T('Bill total')}</b></span><b>${inr(b.total)}</b></div>
     <div class="row mut"><span class="sp">${T('Received')}</span>${inr(paid(e))}</div><div class="row"><span class="sp">${T('Balance due')}</span><b class="${b.total-paid(e)>0?'out':''}">${inr(Math.max(0,b.total-paid(e)))}</b></div>`;
    $('#bwarn').innerHTML=kind==='bill'&&S.gstin?`<div class="alert r" style="margin-top:10px">⚠️ ${T('You are GST registered — taxable sales need a tax invoice with GST. Use “Without GST” only for exempt items, or check with your CA.')}</div>`
      :kind==='tax'&&!S.gstin?`<div class="alert" style="margin-top:10px">ℹ️ ${T('Add your GSTIN in Settings → Business & bill details to issue a tax invoice.')}</div>`:''};
  $('#bk').onclick=ev=>{const b=ev.target.closest('button');if(!b)return;kind=b.dataset.k;$('#bk').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));$('#bg').style.display=kind==='tax'?'':'none';upd()};
  $('#bm').onclick=ev=>{const b=ev.target.closest('button');if(!b)return;mode=b.dataset.m;$('#bm').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));upd()};
  f.oninput=upd;f.onchange=upd;upd();
  f.onsubmit=ev=>{ev.preventDefault();const o=ov();e.gstMode=o.gstMode;if(o.gst!==undefined)e.gst=o.gst;if(o.pos===(st2((cust(e.customerId)||{}).gstin)||bizState()))delete e.pos;else e.pos=o.pos;
    GBC.delete(e);const b=gstBreak(e);if(!b.total){toast(T('Add plates and rate to the order first'));return}
    const c=cust(e.customerId)||{},no=f.no.value.trim()||nextBillNo(f.date.value);
    if(S.events.some(x=>(x.bills||[]).some(y=>y.no===no))&&!confirm(T('This bill number is already used. Use it again?')))return;
    const bill=stamp({id:uid(),no,date:f.date.value||today(),kind,biz:bizInfo(),cust:{name:c.name||evName(e),addr:[c.address,c.area,c.city].filter(Boolean).join(', '),phone:c.phone||'',email:c.email||'',gstin:c.gstin||''},
      ev:{date:e.date,type:e.type||'',venue:e.venue||'',plates:+e.plates||0},pos:b.pos,inter:b.inter,incl:b.incl,
      L:b.L.map(l=>({d:l.d,code:l.code,q:l.q,unit:l.unit||'',u:+l.u.toFixed(2),uv:+l.uv.toFixed(2),tv:+l.tv.toFixed(2),r:l.r,tax:+l.tax.toFixed(2),svc:l.svc?1:0})),
      slabs:b.slabs.map(s=>({r:s.r,tv:+s.tv.toFixed(2),tax:+s.tax.toFixed(2)})),taxable:b.taxable,tax:b.tax,cgst:b.cgst,sgst:b.sgst,igst:b.igst,total:b.total,paidAtBill:paid(e)});
    e.bills=[...(e.bills||[]),bill];e.inv=no;save();close();render();billView(eid,bill.id)}}

function billHTML(e,b){const B=b.biz,C=b.cust,tax=b.kind==='tax',rows=b.L,rec=paid(e),bal=Math.max(0,b.total-rec);
  const cell=(t,cls)=>`<td class="${cls||''}">${t}</td>`;
  return `<div class="bill">
  <div class="bh"><div><div class="bn">${esc(B.name)}</div>${B.addr?`<div>${esc(B.addr).replace(/\n/g,'<br>')}</div>`:''}<div>${[B.phone&&'☎ '+esc(B.phone),B.email&&esc(B.email)].filter(Boolean).join(' · ')}</div>${B.gstin?`<div><b>GSTIN</b> ${esc(B.gstin)}</div>`:''}${B.pan&&!B.gstin?`<div><b>PAN</b> ${esc(B.pan)}</div>`:''}</div>
   <div class="br"><div class="bt">${tax?'TAX INVOICE':'BILL'}</div><div><b>${T('Bill no.')}</b> ${esc(b.no)}</div><div><b>${T('Date')}</b> ${fd(b.date)}</div>${tax?`<div><b>${T('Place of supply')}</b> ${esc(GST_STATES[b.pos]||'')} (${esc(b.pos)})</div>`:''}</div></div>
  <div class="bp"><div><div class="bl">${T('Bill to')}</div><b>${esc(C.name)}</b>${C.addr?`<div>${esc(C.addr)}</div>`:''}${C.phone?`<div>${esc(C.phone)}</div>`:''}${C.gstin?`<div>GSTIN ${esc(C.gstin)}</div>`:''}</div>
   <div><div class="bl">${T('Event')}</div><b>${esc(T(b.ev.type))}</b><div>${fd(b.ev.date)}</div>${b.ev.venue?`<div>${esc(b.ev.venue)}</div>`:''}</div></div>
  <table class="bt2"><thead><tr><th>#</th><th>${T('Description')}</th>${tax?'<th>SAC/HSN</th>':''}<th class="n">${T('Qty')}</th><th class="n">${T('Rate')}</th>${tax?`<th class="n">${T('Taxable')}</th><th class="n">GST</th>`:''}<th class="n">${T('Amount')}</th></tr></thead><tbody>
  ${rows.map((l,i)=>`<tr>${cell(i+1)}${cell(esc(T(l.d)))}${tax?cell(esc(l.code||'')):''}${cell(l.disc?'':l.q+(l.unit?' '+esc(T(l.unit)):''),'n')}${cell(l.disc?'':inr2(tax?l.uv:l.u),'n')}${tax?cell(inr2(l.tv),'n')+cell(pct(l.r),'n'):''}${cell(inr2(tax?l.tv+l.tax:l.tv),'n')}</tr>`).join('')}
  </tbody></table>
  <div class="bs"><div class="bw"><div class="bl">${T('Amount in words')}</div><b>${rupeesWords(b.total)}</b>${tax&&b.incl?`<div class="mut">${T('Rates shown are before GST; the price agreed included GST.')}</div>`:''}</div>
   <table class="btot">${tax?`<tr><td>${T('Taxable value')}</td><td class="n">${inr2(b.taxable)}</td></tr>${b.slabs.filter(s=>s.r).map(s=>b.inter?`<tr><td>IGST @ ${pct(s.r)}</td><td class="n">${inr2(s.tax)}</td></tr>`:`<tr><td>CGST @ ${s.r/2}%</td><td class="n">${inr2(s.tax/2)}</td></tr><tr><td>SGST @ ${s.r/2}%</td><td class="n">${inr2(s.tax/2)}</td></tr>`).join('')}${(()=>{const ro=b.total-b.taxable-sum(b.slabs,s=>s.tax);return Math.abs(ro)>=.01?`<tr><td>${T('Round off')}</td><td class="n">${inr2(ro)}</td></tr>`:''})()}`:''}
   <tr class="g"><td>${T('Total')}</td><td class="n">${inr2(b.total)}</td></tr><tr><td>${T('Received')}</td><td class="n">${inr2(rec)}</td></tr><tr class="${bal?'d':''}"><td>${T('Balance due')}</td><td class="n">${inr2(bal)}</td></tr></table></div>
  ${(e.payments||[]).length?`<div class="bpay"><div class="bl">${T('Payments received')} (${T('as of')} ${fd(today())})</div>${e.payments.slice().sort((x,y)=>x.date.localeCompare(y.date)).map(p=>`<span>${fd(p.date)} · ${esc(T(p.mode))} · ${inr(p.amount)}${+p.tds?' + TDS '+inr(p.tds):''}</span>`).join('')}</div>`:''}
  <div class="bf"><div>${B.upi||B.bankAcc?`<div class="bl">${T('Pay to')}</div>`:''}${B.upi?`<div>UPI: <b>${esc(B.upi)}</b></div>`:''}${B.bankAcc?`<div>${esc(B.bankName)} · A/c ${esc(B.bankAcc)} · IFSC ${esc(B.bankIfsc)}</div>`:''}${B.terms?`<div class="mut" style="margin-top:6px;white-space:pre-wrap">${esc(B.terms)}</div>`:''}</div>
   <div class="sig"><div>${T('For')} ${esc(B.name)}</div><div class="line">${T('Authorised signatory')}</div></div></div>
  <div class="bfoot">${tax?'':(B.gstin?T('Bill without GST')+' · ':'')}${T('Computer-generated bill')}</div></div>`}
function billView(eid,bid){const e=byId('events',eid),b=e&&(e.bills||[]).find(x=>x.id===bid);if(!b)return;
  sheet(`<div class="row" style="gap:6px"><h3 class="sp" style="margin:0">${b.kind==='tax'?T('Tax invoice'):T('Bill')} ${esc(b.no)}</h3><button class="icon-btn" onclick="close();evView('${eid}')" aria-label="Back">✕</button></div>
  <div class="row" style="gap:8px;margin:10px 0"><button class="btn sp" style="margin:0" onclick="billPrint('${eid}','${bid}')">${ico('printer',18)} ${T('Print / PDF')}</button><button class="btn ghost sp" style="margin:0" onclick="billShare('${eid}','${bid}')">${ico('share',18)} ${T('Share')}</button></div>
  <div class="billwrap">${billHTML(e,b)}</div>
  ${can.del()?`<button class="btn red w" onclick="billDel('${eid}','${bid}')">${T('Delete bill')}</button>`:''}`);$('.sheet').classList.add('wide');billFit()}
function billFit(){const w=$('.billwrap'),b=w&&w.querySelector('.bill');if(!b)return;b.style.zoom=1;const k=Math.min(1,(w.clientWidth-2)/b.scrollWidth);b.style.zoom=k;w.style.overflowX=k<1?'hidden':'auto'}
window.addEventListener('resize',()=>billFit());
function billPrint(eid,bid){const e=byId('events',eid),b=(e.bills||[]).find(x=>x.id===bid);let p=$('#printbill');if(!p){p=document.createElement('div');p.id='printbill';document.body.appendChild(p)}
  p.innerHTML=billHTML(e,b);document.body.classList.add('pbill');const t=document.title;document.title=(S.biz+' '+b.no).replace(/[\/\\]/g,'-');
  setTimeout(()=>{if(window.AndroidBridge&&AndroidBridge.print){try{AndroidBridge.print()}catch(x){window.print()}}else window.print();setTimeout(()=>{document.title=t},1500)},60)}
window.addEventListener('afterprint',()=>{document.body.classList.remove('pbill')});
async function billShare(eid,bid){const e=byId('events',eid),b=(e.bills||[]).find(x=>x.id===bid),bal=Math.max(0,b.total-paid(e));
  const upi=S.upi&&bal?`\n\nPay by UPI: upi://pay?pa=${encodeURIComponent(S.upi)}&pn=${encodeURIComponent(S.biz)}&am=${bal}&cu=INR&tn=${encodeURIComponent(b.no)}`:'';
  const t=`*${S.biz}*\n${b.kind==='tax'?'Tax invoice':'Bill'} ${b.no} · ${fd(b.date)}\n${b.cust.name} · ${T(b.ev.type)} on ${fd(b.ev.date)}\n\n`+b.L.map(l=>`• ${T(l.d)}${l.q>1?` (${l.q} × ${inr2(b.kind==='tax'?l.uv:l.u)})`:''}: ${inr2(b.kind==='tax'?l.tv:l.tv)}`).join('\n')+
    (b.tax?`\nTaxable value: ${inr2(b.taxable)}\n${b.inter?`IGST: ${inr2(b.igst)}`:`CGST: ${inr2(b.cgst)} · SGST: ${inr2(b.sgst)}`}`:'')+`\n*Total: ${inr(b.total)}*\nReceived: ${inr(paid(e))}\n*Balance due: ${inr(bal)}*`+upi;
  if(window.AndroidBridge&&AndroidBridge.shareText){try{AndroidBridge.shareText(t);return}catch(x){}}
  if(navigator.share){try{await navigator.share({text:t});return}catch(x){}}
  try{await navigator.clipboard.writeText(t);toast(T('Copied — paste in WhatsApp'))}catch(x){window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank')}}
function billDel(eid,bid){if(!confirm(T('Delete this bill? The order and payments stay.')))return;const e=byId('events',eid);e.bills=(e.bills||[]).filter(x=>x.id!==bid);e.inv=(e.bills[e.bills.length-1]||{}).no||'';save();render();evView(eid)}
function billsBlock(e){const L=(e.bills||[]).slice().reverse();
  return `<h2>${T('Bills')}</h2><div class="card" style="padding:4px 14px">${L.length?L.map((b,i)=>`<div class="item" onclick="billView('${e.id}','${b.id}')">${tile('invoice',b.kind==='tax'?'blue':'slate','sm')}<div class="sp"><div class="t1">${esc(b.no)}${i>0?` <span class="pill can">${T('Earlier')}</span>`:''}</div><div class="mut">${fd(b.date)} · ${b.kind==='tax'?T('Tax invoice'):T('Without GST')}${b.tax?' · GST '+inr(b.tax):''}${b.by?' · '+esc(b.by):''}</div></div><div class="amt">${inr(b.total)}</div></div>`).join(''):`<div class="empty">${T('No bill yet')}</div>`}</div>
  ${can.add()&&live(e)?`<button class="btn ${L.length?'ghost':''} w" onclick="billForm('${e.id}')">${ico('invoice',18)} ${L.length?T('Create revised bill'):T('Create bill')}</button>`:''}`}

/* ---- Insights → GST calculator ---- */
const GC_TYPES=[['svc5','Catering service',5,0],['svc18','Catering in hotel / specified premises',18,1],['g5','Items sold',5,1],['g18','Items sold',18,1],['g40','Items sold',40,1],['g0','Items sold (exempt)',0,0]];
let GC={mode:'extra',inter:false,rows:[{k:'svc5',a:''}],itc:'',cost:''};
function insGst(){const ev=S.events.filter(e=>e.status!=='cancelled'&&(+e.plates||(e.goods||[]).length)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,40);
  return `<div class="card"><div class="mut" style="margin-bottom:8px">${T('Type what you charge. See the GST you collect and pay, and what stays with you.')}</div>
  <div class="seg" id="gcm">${[['extra','GST extra'],['incl','GST included']].map(([k,l])=>`<button class="${GC.mode===k?'on':''}" onclick="GC.mode='${k}';render()">${T(l)}</button>`).join('')}</div>
  <div id="gcrows">${GC.rows.map((r,i)=>`<div class="gcrow"><select onchange="GC.rows[${i}].k=this.value;gcCalc()">${GC_TYPES.map(([k,l,rt])=>`<option value="${k}" ${r.k===k?'selected':''}>${T(l)} · ${rt}%</option>`).join('')}</select><input type="number" inputmode="decimal" value="${esc(r.a)}" oninput="GC.rows[${i}].a=this.value;gcCalc()" placeholder="${T('Amount (₹)')}">${GC.rows.length>1?`<button class="icon-btn" onclick="GC.rows.splice(${i},1);render()" aria-label="Remove">✕</button>`:'<span></span>'}</div>`).join('')}</div>
  <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button class="chip" onclick="GC.rows.push({k:'g5',a:''});render()">+ ${T('Add row')}</button>
   <button class="chip ${GC.inter?'on':''}" onclick="GC.inter=!GC.inter;render()">${GC.inter?'✓ ':''}${T('Customer in another state (IGST)')}</button></div>
  ${ev.length?`<label>${T('Or load an order')}</label><select onchange="gcLoad(this.value)"><option value="">—</option>${ev.map(e=>`<option value="${e.id}">${esc(evName(e))} · ${fd(e.date)}</option>`).join('')}</select>`:''}
  <div class="g2"><div><label>${T('Your cost (optional)')}</label><input type="number" inputmode="decimal" value="${esc(GC.cost)}" oninput="GC.cost=this.value;gcCalc()"></div><div><label>${T('GST paid on purchases')}</label><input type="number" inputmode="decimal" value="${esc(GC.itc)}" oninput="GC.itc=this.value;gcCalc()"></div></div></div>
  <div id="gcout">${gcOut()}</div>
  <h2>${T('Which rate applies?')}</h2><div class="card"><div class="mut" style="line-height:1.55">• <b>5%</b> — ${T('outdoor catering at homes, marriage halls, offices, events (SAC 996334). No input tax credit (ITC) on purchases.')}<br>• <b>18%</b> — ${T('catering at hotels or premises where room tariff is above ₹7,500 a day ("specified premises"). ITC allowed.')}<br>• ${T('Items sold separately (sweets boxes, gifts, bottled water, rentals) take their own goods rate: 0%, 5%, 18% or 40%.')}<br>• ${T('Same state → CGST + SGST (half each). Another state → IGST.')}<br><br>${T('Rates as of GST 2.0 (from 22 Sep 2025). Your CA decides the final rate.')}</div></div>`}
function gcCalc(){const o=$('#gcout');if(o)o.innerHTML=gcOut()}
function gcLoad(id){const e=byId('events',id);if(!e)return;const b=gstBreak(e),m=b.mode==='none'?'extra':b.mode;GC.mode=m;GC.inter=b.inter;
  const svcK=b.sr===18?'svc18':'svc5',rows=[];const sv=sum(b.L.filter(l=>l.svc),l=>l.amt);if(sv)rows.push({k:svcK,a:Math.round(sv)});
  b.L.filter(l=>!l.svc).forEach(l=>rows.push({k:'g'+l.r,a:Math.round(l.amt)}));GC.rows=rows.length?rows:[{k:'svc5',a:''}];GC.cost=Math.round(cost(e))||'';render()}
function gcOut(){const incl=GC.mode==='incl';let tv=0,tax=0,itcOk=0;const lines=GC.rows.map(r=>{const t=GC_TYPES.find(x=>x[0]===r.k)||GC_TYPES[0],a=+r.a||0,rt=t[2];const v=incl?a*100/(100+rt):a,g=v*rt/100;tv+=v;tax+=g;if(t[3])itcOk+=g;return{l:t[1],rt,a,v,g}});
  const total=tv+tax,itc=Math.min(+GC.itc||0,itcOk),pay=tax-itc,c=+GC.cost||0;
  if(!total)return `<div class="card empty">${T('Enter an amount to see the GST')}</div>`;
  return `<div class="kpis">${kpi(T('Customer pays'),inr2(total))}${kpi(T('GST to government'),inr2(pay),'out',GC.inter?'IGST':`CGST ${inr2(pay/2)} + SGST ${inr2(pay/2)}`)}${kpi(T('You keep (after GST)'),inr2(tv),'in',T('Taxable value'))}${c?kpi(T('Profit after GST'),inr2(tv-c),tv-c<0?'out':'in',Math.round((tv-c)/tv*100)+'% '+T('margin')):''}</div>
  <div class="card" style="overflow-x:auto"><table><tr><th>${T('What')}</th><th>${T('Amount')}</th><th>${T('Taxable')}</th><th>GST</th></tr>${lines.filter(l=>l.a).map(l=>`<tr><td>${esc(T(l.l))} ${l.rt}%</td><td>${inr2(l.a)}</td><td>${inr2(l.v)}</td><td>${inr2(l.g)}</td></tr>`).join('')}<tr><td><b>${T('Total')}</b></td><td><b>${inr2(incl?sum(lines,l=>l.a):total)}</b></td><td><b>${inr2(tv)}</b></td><td><b>${inr2(tax)}</b></td></tr></table>
  ${+GC.itc?`<div class="mut" style="margin-top:8px">${T('GST paid on purchases')}: ${inr2(+GC.itc)} · ${T('can be set off')}: <b>${inr2(itc)}</b>${itc<+GC.itc?' — '+T('5% catering cannot claim it'):''}</div>`:''}</div>`}

/* ---- Settings: business & bill details ---- */
function bizFields(){const dis=can.admin()?'':'disabled',inp=(k,l,extra)=>`<div><label>${T(l)}</label><input value="${esc(S[k]||'')}" ${dis} ${extra||''} onchange="S['${k}']=this.value.trim();save()"></div>`;
  return `<h2>${T('Business & bill details')}</h2><div class="card"><div class="mut" style="margin-bottom:4px">${T('Printed on every bill.')}</div>
  <label>${T('Address')}</label><textarea rows="2" ${dis} onchange="S.addr=this.value.trim();save()">${esc(S.addr||'')}</textarea>
  <div class="g2">${inp('phone','Phone','type="tel"')}${inp('email','Email','type="email"')}</div>
  <div class="g2"><div><label>${T('State')}</label><select ${dis||(st2(S.gstin)?'disabled':'')} onchange="S.stateCode=this.value;save()">${Object.entries(GST_STATES).map(([k,v])=>`<option value="${k}" ${bizState()===k?'selected':''}>${esc(v)}</option>`).join('')}</select></div>${inp('invPrefix','Bill number prefix','placeholder="INV" maxlength="8" style="text-transform:uppercase"')}</div>
  <div class="mut" style="margin-top:4px">${T('Next bill')}: <b>${esc(nextBillNo())}</b> · ${T('numbering restarts every April')}</div>
  <div class="g2">${inp('upi','UPI ID','placeholder="name@bank"')}${inp('bankName','Bank name')}</div>
  <div class="g2">${inp('bankAcc','Account number','inputmode="numeric"')}${inp('bankIfsc','IFSC','style="text-transform:uppercase" maxlength="11"')}</div>
  <label>${T('Terms on bill')}</label><textarea rows="2" ${dis} placeholder="${T('e.g. 50% advance to confirm, balance on the event day.')}" onchange="S.terms=this.value.trim();save()">${esc(S.terms||'')}</textarea></div>`}

Object.assign(KN,{
'Money':'ಹಣ','People':'ಜನರು','Work':'ಕೆಲಸ','Things':'ವಸ್ತುಗಳು','Add':'ಸೇರಿಸಿ','Payment received':'ಬಂದ ಪಾವತಿ','From a customer, against an order':'ಗ್ರಾಹಕರಿಂದ, ಆರ್ಡರ್‌ಗೆ',
'Create bill':'ಬಿಲ್ ಮಾಡಿ','Digital bill or GST invoice for an order':'ಆರ್ಡರ್‌ಗೆ ಡಿಜಿಟಲ್ ಬಿಲ್ ಅಥವಾ GST ಇನ್‌ವಾಯ್ಸ್','Pay vendor':'ಮಾರಾಟಗಾರರಿಗೆ ಪಾವತಿ','Pay worker':'ಕೆಲಸಗಾರರಿಗೆ ಪಾವತಿ','Deducts any advance':'ಮುಂಗಡ ಕಳೆಯುತ್ತದೆ',
'Customer':'ಗ್ರಾಹಕ','Name, phone, address, GSTIN':'ಹೆಸರು, ಫೋನ್, ವಿಳಾಸ, GSTIN','Worker':'ಕೆಲಸಗಾರ','Contract or salaried':'ಗುತ್ತಿಗೆ ಅಥವಾ ಸಂಬಳ','Group of workers':'ಕೆಲಸಗಾರರ ಗುಂಪು','Team managed by a contractor':'ಗುತ್ತಿಗೆದಾರರ ತಂಡ',
'Vendor':'ಮಾರಾಟಗಾರ','Shop or supplier':'ಅಂಗಡಿ ಅಥವಾ ಪೂರೈಕೆದಾರ','Who worked, one day or a range':'ಯಾರು ಕೆಲಸ ಮಾಡಿದರು, ಒಂದು ದಿನ ಅಥವಾ ಹಲವು','Work task':'ಕೆಲಸ','To-do for the team':'ತಂಡಕ್ಕೆ ಮಾಡಬೇಕಾದದ್ದು',
'Stock item':'ಸ್ಟಾಕ್ ವಸ್ತು','New item in inventory':'ಹೊಸ ಸ್ಟಾಕ್ ವಸ್ತು','Stock in / used':'ಸ್ಟಾಕ್ ಬಂತು / ಬಳಸಿದ್ದು','Purchase or use of stock':'ಖರೀದಿ ಅಥವಾ ಬಳಕೆ','Vehicle':'ವಾಹನ','Own or hired':'ಸ್ವಂತ ಅಥವಾ ಬಾಡಿಗೆ',
'Asset':'ಸ್ವತ್ತು','Vessels, equipment, furniture':'ಪಾತ್ರೆ, ಉಪಕರಣ, ಪೀಠೋಪಕರಣ','Licence / policy':'ಪರವಾನಗಿ / ವಿಮೆ','FSSAI, insurance, trade licence':'FSSAI, ವಿಮೆ, ಟ್ರೇಡ್ ಲೈಸೆನ್ಸ್','View only':'ನೋಡಲು ಮಾತ್ರ','Add an order first':'ಮೊದಲು ಆರ್ಡರ್ ಸೇರಿಸಿ',
'No GST':'GST ಇಲ್ಲ','GST extra':'GST ಹೆಚ್ಚುವರಿ','GST included':'GST ಸೇರಿ','GST on catering service':'ಅಡುಗೆ ಸೇವೆಗೆ GST','SAC 996334 · rate per plate is':'SAC 996334 · ಪ್ಲೇಟ್ ದರ','including GST':'GST ಸೇರಿ','before GST':'GST ಮೊದಲು',
'Items sold at the event':'ಕಾರ್ಯಕ್ರಮದಲ್ಲಿ ಮಾರಿದ ವಸ್ತುಗಳು','optional':'ಐಚ್ಛಿಕ','Add item':'ವಸ್ತು ಸೇರಿಸಿ','Item':'ವಸ್ತು','Qty':'ಪ್ರಮಾಣ','Rate':'ದರ','Taxable':'ತೆರಿಗೆಗೆ ಒಳಪಡುವ','Taxable value':'ತೆರಿಗೆ ಮೌಲ್ಯ','Total':'ಒಟ್ಟು',
'With GST':'GST ಜೊತೆ','Without GST':'GST ಇಲ್ಲದೆ','Place of supply':'ಪೂರೈಕೆ ಸ್ಥಳ','Bill no.':'ಬಿಲ್ ಸಂಖ್ಯೆ','Bill date':'ಬಿಲ್ ದಿನಾಂಕ','Bill total':'ಬಿಲ್ ಒಟ್ಟು','Balance due':'ಬಾಕಿ','Bills':'ಬಿಲ್‌ಗಳು','No bill yet':'ಇನ್ನೂ ಬಿಲ್ ಇಲ್ಲ',
'Create revised bill':'ಪರಿಷ್ಕೃತ ಬಿಲ್ ಮಾಡಿ','Earlier':'ಹಿಂದಿನದು','Tax invoice':'ತೆರಿಗೆ ಇನ್‌ವಾಯ್ಸ್','Bill':'ಬಿಲ್','Print / PDF':'ಮುದ್ರಿಸಿ / PDF','Share':'ಹಂಚಿ','Delete bill':'ಬಿಲ್ ಅಳಿಸಿ','Bill to':'ಬಿಲ್ ಯಾರಿಗೆ','Event':'ಕಾರ್ಯಕ್ರಮ',
'Description':'ವಿವರ','Amount':'ಮೊತ್ತ','Amount in words':'ಮೊತ್ತ ಅಕ್ಷರಗಳಲ್ಲಿ','Round off':'ಪೂರ್ಣಾಂಕ','as of':'ರಂತೆ','Pay to':'ಪಾವತಿಸಿ','For':'ಪರವಾಗಿ','Authorised signatory':'ಅಧಿಕೃತ ಸಹಿ','Computer-generated bill':'ಕಂಪ್ಯೂಟರ್ ರಚಿತ ಬಿಲ್',
'GST calculator':'GST ಲೆಕ್ಕಾಚಾರ','Tax split · what you keep':'ತೆರಿಗೆ ವಿಭಜನೆ · ನಿಮಗೆ ಉಳಿಯುವುದು','What':'ಏನು','Add row':'ಸಾಲು ಸೇರಿಸಿ','Customer in another state (IGST)':'ಬೇರೆ ರಾಜ್ಯದ ಗ್ರಾಹಕ (IGST)','Or load an order':'ಅಥವಾ ಆರ್ಡರ್ ಆರಿಸಿ',
'Your cost (optional)':'ನಿಮ್ಮ ಖರ್ಚು (ಐಚ್ಛಿಕ)','GST paid on purchases':'ಖರೀದಿಗೆ ಕಟ್ಟಿದ GST','Customer pays':'ಗ್ರಾಹಕ ಕಟ್ಟುವುದು','GST to government':'ಸರ್ಕಾರಕ್ಕೆ GST','You keep (after GST)':'ನಿಮಗೆ ಉಳಿಯುವುದು (GST ನಂತರ)','Profit after GST':'GST ನಂತರ ಲಾಭ',
'Which rate applies?':'ಯಾವ ದರ?','Enter an amount to see the GST':'GST ನೋಡಲು ಮೊತ್ತ ನಮೂದಿಸಿ','Catering service':'ಅಡುಗೆ ಸೇವೆ','Extras':'ಹೆಚ್ಚುವರಿ','Discount':'ರಿಯಾಯಿತಿ','plates':'ಪ್ಲೇಟ್',
'Business & bill details':'ವ್ಯಾಪಾರ ಮತ್ತು ಬಿಲ್ ವಿವರ','Printed on every bill.':'ಪ್ರತಿ ಬಿಲ್‌ನಲ್ಲಿ ಮುದ್ರಣ.','State':'ರಾಜ್ಯ','Bill number prefix':'ಬಿಲ್ ಸಂಖ್ಯೆ ಮುನ್ನುಡಿ','Next bill':'ಮುಂದಿನ ಬಿಲ್','numbering restarts every April':'ಪ್ರತಿ ಏಪ್ರಿಲ್ ಹೊಸ ಸಂಖ್ಯೆ',
'UPI ID':'UPI ID','Bank name':'ಬ್ಯಾಂಕ್ ಹೆಸರು','Account number':'ಖಾತೆ ಸಂಖ್ಯೆ','IFSC':'IFSC','Terms on bill':'ಬಿಲ್ ಷರತ್ತುಗಳು','Text size':'ಅಕ್ಷರ ಗಾತ್ರ','Normal':'ಸಾಮಾನ್ಯ','Large':'ದೊಡ್ಡ','Extra large':'ಅತಿ ದೊಡ್ಡ'});
/* order view: GST split card */
function gstSplit(e){const b=gstBreak(e);if(!b.total)return'';const r=(l,v,c)=>`<div class="row" style="padding:3px 0"><span class="sp ${c||''}">${l}</span><b>${v}</b></div>`;
  return `<h2>GST</h2><div class="card">${b.mode==='none'?`<div class="mut">${T('No GST on this order.')} ${S.gstin?T('You are GST registered — set GST in the order or while creating the bill.'):''}</div>`:''}
  ${r(T('Catering service')+(b.mode!=='none'?` <span class="mut">${b.sr}% · SAC 996334</span>`:''),inr2(b.svc))}${b.goods?r(T('Items sold at the event'),inr2(b.goods)):''}
  ${b.tax?`<div style="border-top:1px dashed var(--line);margin:6px 0"></div>${r(T('Taxable value'),inr2(b.taxable))}${b.inter?r('IGST',inr2(b.igst)):r('CGST',inr2(b.cgst))+r('SGST',inr2(b.sgst))}`:''}
  <div style="border-top:1px solid var(--line);margin:6px 0"></div>${r('<b>'+T('Total')+'</b>',inr(b.total))}
  ${b.tax?`<div class="mut" style="margin-top:4px">${T('GST to government')}: <b>${inr(b.tax)}</b> · ${T('You keep (after GST)')}: <b>${inr(b.taxable)}</b>${b.incl?' · '+T('price included GST'):''}</div>`:''}</div>`}
