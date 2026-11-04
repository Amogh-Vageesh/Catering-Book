/* ================= INVENTORY ================= */
const ITEM_CATS=['Grains & pulses','Oil & ghee','Spices & masala','Vegetables','Dairy','Gas & fuel','Disposables','Cleaning','Other'];
const ICI={'Grains & pulses':'🌾','Oil & ghee':'🫗','Spices & masala':'🌶️','Vegetables':'🥬','Dairy':'🥛','Gas & fuel':'🔥','Disposables':'🥡','Cleaning':'🧽','Other':'📦'};
const UNITS=['kg','g','L','ml','pcs','packet','bag','box','tin','dozen','cylinder'];
const normName=s=>String(s||'').toLowerCase().replace(/[^a-z0-9ಀ-೿ ]+/g,' ').replace(/\b(\d+(\.\d+)?)\s?(kg|g|gm|gms|ltr|lt|l|ml)\b/g,'').replace(/\s+/g,' ').trim();
function matchItem(name){const n=normName(name);if(!n)return null;
  let best=null,score=0;S.items.forEach(it=>{[it.name,...String(it.aliases||'').split(',')].map(normName).filter(Boolean).forEach(a=>{
    let sc=a===n?1:(n.includes(a)||a.includes(n))?.85:(()=>{const A=new Set(a.split(' ')),B=n.split(' ');const hit=B.filter(t=>A.has(t)&&t.length>2).length;return hit/Math.max(A.size,B.length)})();
    if(sc>score){score=sc;best=it}})});
  return score>=.6?best:null}
const allLines=()=>S.expenses.flatMap(x=>(x.lines||[]).map(l=>({...l,d:x.date,x})));
function itemLog(id){const it=byId('items',id);const ev=[];if(!it)return ev;
  if(+it.open)ev.push({d:it.openDate||'0000-00-00',t:'open',q:+it.open});
  allLines().filter(l=>l.itemId===id).forEach(l=>ev.push({d:l.d,t:'buy',q:+l.qty||0,rate:+l.rate||(+l.qty?l.amount/l.qty:0),x:l.x}));
  S.stock.filter(m=>m.itemId===id).forEach(m=>ev.push({d:m.date,t:m.type,q:+m.qty||0,m}));
  ev.sort((a,b)=>a.d.localeCompare(b.d)||((a.t==='count')-(b.t==='count')));
  let q=0;ev.forEach(e=>{if(e.t==='count')q=e.q;else if(e.t==='out')q-=e.q;else q+=e.q;e.after=q});return ev}
const onHand=id=>{const l=itemLog(id).filter(e=>e.d<=today());return l.length?l[l.length-1].after:0};
const reserved=id=>sum(S.stock.filter(m=>m.itemId===id&&m.type==='out'&&m.date>today()),m=>m.qty);
const lastRate=id=>{const b=itemLog(id).filter(e=>e.t==='buy'&&e.rate);return b.length?b[b.length-1].rate:0};
const isLow=it=>+it.min&&onHand(it.id)<+it.min;
const fmtQ=(q,u)=>(Math.round(q*100)/100).toLocaleString('en-IN')+' '+(u||'');
let stockCat='',stockLow=false;
function stockV(){const q=dataQ.toLowerCase();
  const L=S.items.filter(it=>(!stockCat||it.cat===stockCat)&&(!stockLow||isLow(it))&&(!q||[it.name,it.aliases,it.cat].join(' ').toLowerCase().includes(q))).sort((a,b)=>(isLow(b)-isLow(a))||a.name.localeCompare(b.name));
  const low=S.items.filter(isLow).length,val=sum(S.items,it=>Math.max(0,onHand(it.id))*lastRate(it.id));
  return `${can.add()?`<div class="row" style="gap:8px;margin-bottom:10px"><button class="btn sp" onclick="scanPick()">📷 ${T('Scan bill')}</button><button class="btn ghost sp" onclick="useForm()">➖ ${T('Use for order')}</button></div>`:''}
  <div class="kpis">${kpi(T('Items'),S.items.length)}${kpi(T('Low stock'),low,low?'out':'')}${can.money()?kpi(T('Stock value'),inr(val),'',T('at last purchase price')):''}</div>
  <div class="chips scroll"><button class="chip ${stockLow?'on':''}" onclick="stockLow=!stockLow;render()">⚠️ ${T('Low stock')}</button><button class="chip ${!stockCat?'on':''}" onclick="stockCat='';render()">${T('All')}</button>${ITEM_CATS.filter(c=>S.items.some(i=>i.cat===c)).map(c=>`<button class="chip ${stockCat===c?'on':''}" onclick="stockCat='${c}';render()">${ICI[c]} ${T(c)}</button>`).join('')}</div>
  <div class="card">${L.length?L.map(itemRow).join(''):`<div class="empty">${S.items.length?T('Nothing here'):T('Add items, or scan a purchase bill to fill stock automatically.')}</div>`}</div>`}
function itemRow(it){const h=onHand(it.id),r=lastRate(it.id);
  return `<div class="item" onclick="itemView('${it.id}')">${itemTile(it.cat)}<div class="sp"><div class="t1">${esc(it.name)}</div><div class="mut">${T(it.cat||'Other')}${r&&can.money()?' · '+inr(r)+'/'+esc(it.unit||''):''}${+it.min?` · ${T('min')} ${fmtQ(it.min,it.unit)}`:''}</div></div><div style="text-align:right"><b class="${isLow(it)?'out':''}">${fmtQ(h,it.unit)}</b>${isLow(it)?`<div><span class="pill due">${T('Low')}</span></div>`:''}</div></div>`}
function sparkline(pts,w=120,h=32){if(pts.length<2)return'';const ys=pts.map(p=>p.y),mn=Math.min(...ys),mx=Math.max(...ys),rg=mx-mn||1;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline fill="none" stroke="var(--acc)" stroke-width="2" points="${pts.map((p,i)=>`${(i/(pts.length-1))*(w-4)+2},${h-3-((p.y-mn)/rg)*(h-6)}`).join(' ')}"/></svg>`}
function itemView(id){const it=byId('items',id);if(!it)return;const log=itemLog(id),h=onHand(id),buys=log.filter(e=>e.t==='buy'&&e.rate);
  const first=buys[0],lastB=buys[buys.length-1],ch=first&&lastB&&first!==lastB?lastB.rate/first.rate-1:0;
  sheet(`<div class="row"><h3 class="sp">${ICI[it.cat]||'📦'} ${esc(it.name)}</h3>${can.add()?`<button class="btn ghost sm" onclick="itemForm('${id}')">${T('Edit')}</button>`:''}</div>
  <div class="kpis">${kpi(T('In stock'),fmtQ(h,it.unit),isLow(it)?'out':'',[+it.min?T('min')+' '+fmtQ(it.min,it.unit):'',reserved(id)?fmtQ(reserved(id),it.unit)+' '+T('set aside for upcoming orders'):''].filter(Boolean).join(' · '))}${can.money()?kpi(T('Last price'),lastB?inr(lastB.rate)+'/'+esc(it.unit||''):'—',ch>0.02?'out':'',buys.length>1?`${ch>=0?'▲':'▼'} ${Math.abs(Math.round(ch*100))}% ${T('since')} ${fd(first.d)}`:''):''}</div>
  ${can.money()&&buys.length>1?`<div class="card row"><span class="mut sp">${T('Price trend')}</span>${sparkline(buys.map(b=>({y:b.rate})),160,36)}</div>`:''}
  ${can.add()?`<div class="row" style="gap:6px"><button class="btn sp sm" onclick="moveForm('${id}','in')">➕ ${T('Stock in')}</button><button class="btn ghost sp sm" onclick="moveForm('${id}','out')">➖ ${T('Use')}</button><button class="btn ghost sp sm" onclick="moveForm('${id}','count')">✓ ${T('Count')}</button></div>`:''}
  <h2>${T('History')}</h2><div class="card" style="padding:4px 14px">${[...log].reverse().map(e=>{const lab={open:T('Opening stock'),buy:T('Purchased'),in:T('Stock in'),out:T('Used'),count:T('Counted')}[e.t];
    const sub=e.t==='buy'?[(vend(e.x.vendorId)||{}).name,can.money()?inr(e.rate)+'/'+(it.unit||''):''].filter(Boolean).map(esc).join(' · '):e.m?[e.m.eventId&&evName(byId('events',e.m.eventId)||{}),e.m.note,e.m.by].filter(Boolean).map(esc).join(' · '):'';
    return `<div class="item" onclick="${e.t==='buy'?`expForm('${e.x.id}')`:e.m&&can.del()?`moveDel('${e.m.id}')`:''}">${tile(e.t==='out'?'expense':e.t==='count'?'check':'income',e.t==='out'?'red':e.t==='count'?'blue':'green')}<div class="sp"><div class="t1">${lab} ${e.t==='count'?'= ':e.t==='out'?'− ':'+ '}${fmtQ(e.q,it.unit)}</div><div class="mut">${fd(e.d)}${sub?' · '+sub:''}</div></div><span class="mut">${fmtQ(e.after,it.unit)}</span></div>`}).join('')||`<div class="empty">${T('Nothing here')}</div>`}</div>`)}
function moveDel(mid){const m=byId('stock',mid);if(m&&confirm(T('Delete')+'?')){S.stock=S.stock.filter(x=>x.id!==mid);save();close();render();itemView(m.itemId)}}
function itemForm(id,preset){const it=id?byId('items',id):Object.assign({cat:'Grains & pulses',unit:'kg',openDate:today()},preset||{});
  sheet(`<h3>${id?T('Edit'):T('Add item')}</h3><form id="f"><label>${T('Name')} *</label><input name="name" required value="${esc(it.name)}" placeholder="Sona masoori rice, Sunflower oil…">
  <div class="g2"><div><label>${T('Category')}</label><select name="cat">${ITEM_CATS.map(c=>`<option value="${c}" ${c===it.cat?'selected':''}>${ICI[c]} ${T(c)}</option>`).join('')}</select></div><div><label>${T('Unit')}</label><select name="unit">${UNITS.map(u=>`<option ${u===it.unit?'selected':''}>${u}</option>`).join('')}</select></div></div>
  <div class="g2"><div><label>${T('Minimum stock')}</label><input name="min" type="number" step="any" value="${esc(it.min)}"></div><div><label>${T('Opening stock')}</label><input name="open" type="number" step="any" value="${esc(it.open)}"></div></div>
  <label>${T('Other names on bills')} <span class="mut">(${T('comma separated')})</span></label><input name="aliases" value="${esc(it.aliases)}" placeholder="SM rice, sona rice">
  <button class="btn w" style="margin-top:14px">${T('Save')}</button>${id&&can.del()?`<button type="button" class="btn red w" onclick="delItem('items','${id}')">${T('Delete')}</button>`:''}</form>`);
  $('#f').onsubmit=e=>{e.preventDefault();const o=Object.fromEntries(new FormData($('#f')));o.min=+o.min||0;o.open=+o.open||0;if(!id)o.openDate=today();if(id)Object.assign(it,o);else S.items.push(stamp({id:uid(),...o}));save();close();render()}}
function moveForm(itemId,type){const it=byId('items',itemId);const evs=S.events.filter(e=>live(e)&&e.date>=addDays(-30)&&e.date<=addDays(30)).sort((a,b)=>a.date.localeCompare(b.date));
  sheet(`<h3>${{in:'➕ '+T('Stock in'),out:'➖ '+T('Use'),count:'✓ '+T('Count')}[type]} · ${esc(it.name)}</h3><form id="f">
  <div class="g2"><div><label>${type==='count'?T('Actual quantity now'):T('Quantity')} (${esc(it.unit)})</label><input name="qty" type="number" step="any" required inputmode="decimal"></div><div><label>${T('Date')}</label><input name="date" type="date" value="${today()}"></div></div>
  ${type==='out'?`<label>${T('For which order?')}</label><select name="eventId"><option value="">${T('General')}</option>${evs.map(e=>`<option value="${e.id}">${esc(evName(e))} · ${fd(e.date)}</option>`).join('')}</select>`:''}
  <label>${T('Note')}</label><input name="note" placeholder="${type==='in'?T('e.g. from home stock, returned'):''}">
  <div class="mut" style="margin-top:6px">${T('In stock now')}: ${fmtQ(onHand(itemId),it.unit)}</div>
  <button class="btn w" style="margin-top:14px">${T('Save')}</button></form>`);
  $('#f').onsubmit=e=>{e.preventDefault();const o=Object.fromEntries(new FormData($('#f')));S.stock.push(stamp({id:uid(),itemId,type,qty:+o.qty,date:o.date,eventId:o.eventId||'',note:o.note}));save();close();render();itemView(itemId)}}
function useForm(){const evs=S.events.filter(e=>live(e)&&e.date>=addDays(-30)&&e.date<=addDays(30)).sort((a,b)=>a.date.localeCompare(b.date));const ev0=evs.find(e=>e.date>=today());
  sheet(`<h3>➖ ${T('Use for order')}</h3><form id="f"><div class="g2"><div><label>${T('For which order?')}</label><select name="eventId"><option value="">${T('General')}</option>${evs.map(e=>`<option value="${e.id}" ${ev0&&ev0.id===e.id?'selected':''}>${esc(evName(e))} · ${fd(e.date)}</option>`).join('')}</select></div><div><label>${T('Date')}</label><input name="date" type="date" value="${today()}"></div></div>
  <input class="search" style="margin-top:10px" placeholder="🔍 ${T('Search')}" oninput="document.querySelectorAll('.urow').forEach(r=>r.style.display=r.dataset.n.includes(this.value.toLowerCase())?'':'none')">
  <div class="card" style="padding:4px 12px">${[...S.items].sort((a,b)=>a.name.localeCompare(b.name)).map(it=>`<div class="row urow" data-n="${esc(it.name.toLowerCase())}" style="padding:6px 0;border-top:1px solid var(--line)"><span class="sp">${esc(it.name)}<div class="mut" style="font-size:12px">${fmtQ(onHand(it.id),it.unit)} ${T('in stock')}</div></span><input data-i="${it.id}" type="number" step="any" inputmode="decimal" placeholder="${esc(it.unit)}" style="width:90px;padding:8px"></div>`).join('')||`<div class="empty">${T('Nothing here')}</div>`}</div>
  <button class="btn w" style="margin-top:14px">${T('Save')}</button></form>`);
  $('#f').eventId.onchange=ev=>{const e=byId('events',ev.target.value);if(e&&e.date<today())$('#f').date.value=e.date};
  $('#f').onsubmit=e=>{e.preventDefault();const f=$('#f');let n=0;f.querySelectorAll('input[data-i]').forEach(i=>{if(+i.value>0){n++;S.stock.push(stamp({id:uid(),itemId:i.dataset.i,type:'out',qty:+i.value,date:f.date.value,eventId:f.eventId.value}))}});
    if(!n){toast(T('Enter at least one quantity'));return}save();close();render();toast(n+' '+T('items')+' ✓')}}

/* ---- bill line items on an expense ---- */
function linesEditor(lines){return `<div id="lnbox" style="${(lines||[]).length?'':'display:none'}"><label>🧾 ${T('Items on this bill')} <span class="mut">— ${T('for stock & price tracking')}</span></label>
  <div class="row mut" style="font-size:11px;gap:4px;padding:0 2px"><span class="sp">${T('Item')}</span><span style="width:58px">${T('Qty')}</span><span style="width:64px">${T('Unit')}</span><span style="width:80px">₹</span><span style="width:22px"></span></div>
  <div id="lns"></div><datalist id="itl">${S.items.map(i=>`<option value="${esc(i.name)}">`).join('')}</datalist>
  <div class="row" style="margin-top:4px"><button type="button" class="btn ghost sm" onclick="lnAdd()">+ ${T('Line')}</button><span class="sp"></span><span class="mut" id="lnsum"></span></div>
  <label style="display:flex;gap:8px;align-items:center;font-size:14px;color:var(--ink)"><input type="checkbox" id="lnstock" style="width:20px" checked> ${T('Add these items to stock')}</label></div>
  <button type="button" class="btn ghost sm" id="lnshow" style="margin-top:8px;${(lines||[]).length?'display:none':''}" onclick="$('#lnbox').style.display='';this.style.display='none';if(!$('#lns').children.length)lnAdd()">🧾 + ${T('Add item lines (qty & price)')}</button>`}
function lnAdd(l){l=l||{};const it=l.itemId&&byId('items',l.itemId);const d=document.createElement('div');d.className='lnrow';d.style.cssText='display:flex;gap:4px;margin-bottom:4px;align-items:center';
  d.innerHTML=`<input class="ln-n sp" list="itl" value="${esc(it?it.name:l.name)}" style="padding:8px;min-width:0"><input class="ln-q" type="number" step="any" inputmode="decimal" value="${esc(l.qty)}" style="width:58px;padding:8px"><select class="ln-u" style="width:64px;padding:8px 2px">${UNITS.map(u=>`<option ${u===(l.unit||(it&&it.unit)||'kg')?'selected':''}>${u}</option>`).join('')}</select><input class="ln-a" type="number" step="any" inputmode="decimal" value="${esc(l.amount)}" style="width:80px;padding:8px"><button type="button" class="btn ghost sm" style="width:22px;padding:4px 0" onclick="this.parentNode.remove();lnSum()">×</button>`;
  d.querySelector('.ln-n').onchange=e=>{const m=matchItem(e.target.value);if(m)d.querySelector('.ln-u').value=m.unit};
  d.oninput=lnSum;$('#lns').appendChild(d);lnSum()}
function lnRead(){return [...document.querySelectorAll('#lns .lnrow')].map(r=>{const name=r.querySelector('.ln-n').value.trim(),qty=+r.querySelector('.ln-q').value||0,unit=r.querySelector('.ln-u').value,amount=+r.querySelector('.ln-a').value||0;
  return{name,qty,unit,amount,rate:qty?Math.round(amount/qty*100)/100:0}}).filter(l=>l.name&&(l.qty||l.amount))}
function lnSum(){const L=lnRead(),t=sum(L,l=>l.amount),el=$('#lnsum');if(!el)return;const f=$('#f'),amt=f&&+f.amount.value;
  el.innerHTML=L.length?`${L.length} ${T('lines')} · ${inr(t)}${amt&&Math.abs(amt-t)>1?` <span class="warn">(${T('bill')} ${inr(amt)})</span>`:''}`:''}
// Link lines to stock items, creating new items when asked
function lnCommit(lines,toStock,cat){return lines.map(l=>{let it=matchItem(l.name);
  if(!it&&toStock&&l.qty){it=stamp({id:uid(),name:l.name,cat:guessItemCat(l.name,cat),unit:l.unit,min:0,open:0,openDate:today()});S.items.push(it)}
  return{...l,itemId:it&&toStock?it.id:(it?it.id:'')}})}
function guessItemCat(n,cat){n=n.toLowerCase();
  if(/rice|dal|daal|atta|rava|sooji|flour|maida|wheat|gram|pulse|toor|moong|urad|chana|poha|sugar|jaggery|bella/.test(n))return'Grains & pulses';
  if(/oil|ghee|butter|vanaspati/.test(n))return'Oil & ghee';if(/chilli|masala|jeera|cumin|mustard|turmeric|haldi|pepper|salt|spice|coriander|clove|cardamom|elaichi|hing/.test(n))return'Spices & masala';
  if(/milk|curd|paneer|cream|cheese|khoa/.test(n))return'Dairy';if(/gas|lpg|cylinder|diesel|petrol|charcoal|firewood/.test(n))return'Gas & fuel';
  if(/plate|cup|glass|tissue|foil|container|cover|spoon|leaf|bag/.test(n))return'Disposables';if(/soap|detergent|phenyl|vim|cleaner|brush/.test(n))return'Cleaning';
  if(cat==='Vegetables'||/onion|tomato|potato|carrot|beans|cabbage|brinjal|chilli green|coconut|ginger|garlic|leaves/.test(n))return'Vegetables';return'Other'}

/* ================= BILL SCANNING (photo or PDF) ================= */
const LIB=()=>window.LIBBASE||'https://cdn.jsdelivr.net/npm/';
function loadScript(src){return new Promise((res,rej)=>{if(document.querySelector(`script[src="${src}"]`))return res();const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error(T('Needs internet the first time to load the bill reader')));document.head.appendChild(s)})}
let OCRW=null;
async function ocrWorker(progress){if(OCRW)return OCRW;await loadScript(LIB()+'tesseract.js@5.1.1/dist/tesseract.min.js');
  OCRW=await Tesseract.createWorker('eng',1,{workerPath:LIB()+'tesseract.js@5.1.1/dist/worker.min.js',corePath:LIB()+'tesseract.js-core@5.1.1',langPath:LIB()+'@tesseract.js-data/eng@1.0.0/4.0.0_best_int',logger:m=>progress&&progress(m)});return OCRW}
async function ocrImage(src,progress){const w=await ocrWorker(progress);const r=await w.recognize(src);return r.data.text}
async function pdfRead(file,progress){const lib=await import(LIB()+'pdfjs-dist@4.10.38/build/pdf.min.mjs');lib.GlobalWorkerOptions.workerSrc=LIB()+'pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
  const pdf=await lib.getDocument({data:await file.arrayBuffer()}).promise;let text='';const imgs=[];
  for(let p=1;p<=Math.min(pdf.numPages,3);p++){const pg=await pdf.getPage(p);const tc=await pg.getTextContent();const rows={};
    tc.items.forEach(it=>{if(!it.str.trim())return;const y=Math.round(it.transform[5]/4);(rows[y]=rows[y]||[]).push({x:it.transform[4],s:it.str})});
    const t=Object.keys(rows).sort((a,b)=>b-a).map(y=>rows[y].sort((a,b)=>a.x-b.x).map(i=>i.s).join(' ')).join('\n');
    if(t.replace(/\s/g,'').length>40)text+=t+'\n';else{const vp=pg.getViewport({scale:2});const c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;await pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;imgs.push(c.toDataURL('image/jpeg',.8))}}
  for(const im of imgs)text+=await ocrImage(im,progress)+'\n';return{text,img:imgs[0]||''}}
const NUM=/(?<![\w.])\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|(?<![\w.])\d+(?:\.\d+)?/g;
const toNum=s=>+String(s).replace(/,/g,'');
function parseDate(t){let m=t.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
  if(m){let[_,d,mo,y]=m;y=+y<100?2000+ +y:+y;if(+mo>12&&+d<=12)[d,mo]=[mo,d];if(+mo>=1&&+mo<=12&&+d>=1&&+d<=31)return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`}
  m=t.match(/\b(\d{1,2})[\s\-]*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\-,]*(\d{2,4})\b/i);
  if(m){const mo=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(m[2].toLowerCase())+1;let y=+m[3];y=y<100?2000+y:y;return `${y}-${String(mo).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`}
  return''}
function parseBill(text){const out={lines:[],total:0,date:parseDate(text),gstin:'',vendor:'',gst:0};
  const up=text.toUpperCase();const g=up.match(/\b\d{2}[A-Z0-9]{5}\d{4}[A-Z0-9][1-9A-Z][Z2][0-9A-Z]\b/);if(g)out.gstin=g[0].replace(/^(\d{2})(.{5})(.{4})(.)(.)(.)/,(a,st,pan,n4,c,e,z)=>st+pan.replace(/0/g,'O').replace(/1/g,'I')+n4+c+e+'Z');
  const L=text.split(/\n/).map(s=>s.replace(/[|\[\]{}_~]/g,' ').replace(/\s+/g,' ').trim()).filter(s=>s.length>1);
  const SKIP=/(sub ?total|grand total|net (amt|amount|total|payable)|total|cgst|sgst|igst|gst|tax|discount|round|amount in words|rupees|balance|change|tender|cash|card|upi|phone|ph[.:]|mob|tel|invoice|bill ?no|receipt|date|time|thank|visit|gstin|fssai|hsn|cashier|counter|qty|rate|description|particulars|s\.? ?no|address|state|code|terms|signature|customer)/i;
  const totals=[];
  L.forEach((ln,i)=>{const nums=(ln.match(NUM)||[]).map(toNum);
    if(/(grand total|net (amt|amount|total|payable)|total amount|amount payable|bill amount|total)/i.test(ln)&&nums.length){totals.push({v:nums[nums.length-1],strong:/(grand|net|payable)/i.test(ln)});return}
    if(/\b(c|s|i)gst\b/i.test(ln)&&nums.length){const a=nums[nums.length-1];if(a<1e6)out.gst+=a;return}
    if(!out.vendor&&i<6&&/[a-z]{3}/i.test(ln)&&!/\d+[.,]\d{2}\b/.test(ln)&&!/\d{5,}/.test(ln)&&!/^\s*\d{1,3}\s/.test(ln)&&!/(tax invoice|cash memo|estimate|invoice|bill|receipt|date|gstin|phone|ph[.:]|mob|original|duplicate|description|particulars|qty)/i.test(ln))out.vendor=ln.replace(/[^\w &.\-']/g,'').trim();
    if(SKIP.test(ln)||!nums.length)return;
    let body=ln.replace(/^\s*\d{1,3}\s*[.)\-:]?\s+(?=[a-z])/i,'');
    const toks=[];let m;const re=new RegExp(NUM.source,'g');while((m=re.exec(body))){const v=toNum(m[0]);if(v<1e6)toks.push({v,i:m.index,s:m[0]})}
    if(!toks.length)return;const am=toks[toks.length-1],amount=am.v;let qT=null,rT=null;
    const pre=toks.slice(Math.max(0,toks.length-4),-1);
    for(let a=0;a<pre.length&&!qT;a++)for(let c=a+1;c<pre.length;c++){if(Math.abs(pre[a].v*pre[c].v-amount)<=Math.max(1,amount*.02)){[qT,rT]=pre[a].v<=pre[c].v?[pre[a],pre[c]]:[pre[c],pre[a]];break}}
    const xq=body.match(/\bx\s?(\d+(?:\.\d+)?)/i);
    if(!qT&&xq)qT={v:+xq[1],i:body.indexOf(xq[0])};
    if(!qT&&pre.length===1&&pre[0].v>0&&pre[0].v<1000)qT=pre[pre.length-1];
    const cut=Math.min(...[qT,rT,am].filter(Boolean).map(t=>t.i));
    let name=body.slice(0,cut).replace(/\b(rs|inr|₹)\.?\s*$/i,'').replace(/[\s\-:]+$/,'').trim();
    if(!/[a-z]{3}/i.test(name))return;
    const qty=qT?qT.v:1,rate=rT?rT.v:Math.round(amount/qty*100)/100;
    const UW='kg|kgs|g|gm|gms|ltr|lt|l|ml|pcs|pc|nos|no|pkt|packet|bag|box|tin|can|bottle|btl|dozen|doz|cyl|cylinder|bundle|tray';
    const U={kgs:'kg',gm:'g',gms:'g',ltr:'L',lt:'L',l:'L',pc:'pcs',nos:'pcs',no:'pcs',pkt:'packet',cyl:'cylinder',doz:'dozen',btl:'pcs',bottle:'pcs',can:'tin',bundle:'pcs',tray:'pcs'};
    let unit='',um=qT&&body.slice(qT.i+String(qT.s||qT.v).length).match(new RegExp('^\\s*('+UW+')\\b','i'));
    if(!um){const after=body.slice(cut);um=after.match(new RegExp('(?:^|\\s)('+UW+')\\b','i'))}
    if(!um&&!xq){const n2=name.match(new RegExp('(\\d+(?:\\.\\d+)?)\\s?('+UW+')\\b','i'));if(n2&&!qT)um=[0,n2[2]]}
    unit=um?(U[um[1].toLowerCase()]||um[1].toLowerCase()):'pcs';
    name=name.replace(/\s{2,}/g,' ');
    if(amount<=0)return;out.lines.push({name,qty,unit,rate,amount})});
  const strong=totals.filter(t=>t.strong);out.total=(strong.length?strong[strong.length-1].v:totals.length?Math.max(...totals.map(t=>t.v)):0)||Math.round(sum(out.lines,l=>l.amount));
  return out}
function scanPick(after){const i=document.createElement('input');i.type='file';i.accept='image/*,application/pdf';i.onchange=()=>i.files[0]&&scanBill(i.files[0],after);i.click()}
async function scanBill(file,into){const bar=document.createElement('div');bar.className='toast';bar.textContent=T('Reading bill…');document.body.appendChild(bar);
  const prog=m=>{if(m.status==='recognizing text')bar.textContent=T('Reading bill…')+' '+Math.round(m.progress*100)+'%';else if(/load/.test(m.status))bar.textContent=T('Loading bill reader (first time only)…')};
  try{let text,bill;
    if(file.type==='application/pdf'){const r=await pdfRead(file,prog);text=r.text;bill=file.size<=700e3?await compress(file):r.img?{data:r.img,mime:'image/jpeg',size:b64len(r.img),thumb:''}:null}
    else{bill=await compress(file);text=await ocrImage(bill.data,prog)}
    const p=parseBill(text);bar.remove();
    if(!p.lines.length&&!p.total){toast(T('Could not read items — enter them by hand'))}
    let vendorId='';if(p.gstin)vendorId=(S.vendors.find(v=>(v.gstin||'').toUpperCase()===p.gstin)||{}).id||'';
    if(!vendorId&&p.vendor){const n=normName(p.vendor);const v=S.vendors.find(v=>{const a=normName(v.name);return a&&(n.includes(a)||a.includes(n.split(' ').slice(0,2).join(' ')))});if(v)vendorId=v.id}
    const preset={amount:p.total||'',date:p.date&&p.date<=today()?p.date:today(),gstIn:Math.round(p.gst)||'',vendorId,lines:p.lines,_bill:bill,_scan:{vendor:p.vendor,gstin:p.gstin,n:p.lines.length,text}};
    const v=vend(vendorId);preset.cat=v&&v.cat?v.cat:(p.lines.some(l=>/oil|rice|dal|atta|sugar|masala/i.test(l.name))?'Groceries':'Groceries');
    if(into)into(preset);else expForm(null,null,preset)}
  catch(e){bar.remove();toast(e.message||'Could not read the bill')}}
