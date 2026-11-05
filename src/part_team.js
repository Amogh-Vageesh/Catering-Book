/* ================= TEAM: order mirror, cash advances, change history, voice ================= */

/* ---- orders for non-owners: "jobs" = an order without prices, payments or bills ---- */
const JOB_KEYS=['id','date','status','type','venueType','venue','client','customerId','plates','menu','booked','vehicleIds','vendorIds','confirmedOn','cancelledOn','lostReason','by','at','deleted'];
const jobOf=e=>{const j={};JOB_KEYS.forEach(k=>{if(e[k]!==undefined)j[k]=e[k]});j.client=evName(e);return j};
function jobsBackfill(){if(!CLOUD||!isOwn())return;const k='caterbook.jobs.v1';try{if(localStorage.getItem(k))return}catch(x){}
  S.events.forEach(e=>CloudFB.put('jobs',e.id,jobOf(e)).catch(()=>{}));try{localStorage.setItem(k,'1')}catch(x){}}

/* ---- who is who ---- */
const mine=x=>x.byE?x.byE===myKey():x.by===me().name;
function persons(){const t=S.team.filter(u=>!OWNERISH(u.role)&&u.active!==false).map(u=>({key:'u:'+(CLOUD?u.email||u.id:u.id),name:u.name||u.email,sub:roleName(u),kind:'team'}));
  const w=S.workers.filter(w=>w.active!==false).map(w=>({key:'w:'+w.id,name:w.name,sub:T(w.role||wCat(w)),kind:'worker'}));
  return [...t,...w]}
function personName(k){if(!k)return'';if(k===myKey())return me().name;const p=persons().find(x=>x.key===k);if(p)return p.name;
  if(k.startsWith('w:')){const w=wkr(k.slice(2));return w?w.name:''}const u=S.team.find(u=>'u:'+(CLOUD?u.email||u.id:u.id)===k);return u?u.name||u.email:k.slice(2)}

/* ---- cash advances given to team members / workers for expenses ---- */
function floatBal(k){const g=S.floats.filter(f=>f.to===k),x=S.expenses.filter(e=>e.floatOf===k);const given=sum(g.filter(f=>+f.amount>0),f=>f.amount),back=-sum(g.filter(f=>+f.amount<0),f=>f.amount),spent=sum(x,e=>e.amount);
  return{given,back,spent,bal:given-back-spent,g,x}}
const balText=b=>b.bal>=0?`${T('Cash left')} ${inr(b.bal)}`:`${T('Owed to them')} ${inr(-b.bal)}`;
function cashKeys(){return [...new Set([...S.floats.map(f=>f.to),...S.expenses.map(e=>e.floatOf)].filter(Boolean))]}
function floatsV(){const K=cashKeys(),rows=K.map(k=>({k,n:personName(k),b:floatBal(k)})).sort((a,b)=>b.b.bal-a.b.bal);
  const out=sum(rows,r=>Math.max(0,r.b.bal)),owed=sum(rows,r=>Math.max(0,-r.b.bal));
  return `<div class="kpis">${kpi(T('Cash with team'),inr(out),'',T('given, not yet spent'))}${kpi(T('Owed to team'),inr(owed),owed?'out':'',T('spent from their own money'))}</div>
  ${can.money()?`<button class="btn w" style="margin-top:0" onclick="floatForm()">${ico('cash',18)} ${T('Give cash for expenses')}</button>`:''}
  <div class="card">${rows.length?rows.map(r=>`<div class="item" onclick="floatPerson('${esc(r.k)}')">${ava(r.n)}<div class="sp"><div class="t1">${esc(r.n)}</div><div class="mut">${T('Given')} ${inr(r.b.given-r.b.back)} · ${T('Spent')} ${inr(r.b.spent)} · ${r.b.x.length} ${T('bills')}</div></div><div class="amt ${r.b.bal<0?'out':''}">${r.b.bal<0?'−':''}${inr(Math.abs(r.b.bal))}</div></div>`).join(''):`<div class="empty">${T('No cash given yet')}</div>`}</div>
  <div class="mut" style="margin:0 2px 20px">${T('When someone spends, they pick “Paid from cash given to me” in the expense — it comes off their balance here, with who, where and the bill photo.')}</div>`}
function floatPerson(k){const b=floatBal(k),n=personName(k);
  const L=[...b.g.map(f=>({d:f.date,a:+f.amount,t:'g',f})),...b.x.map(x=>({d:x.date,a:-x.amount,t:'x',x}))].sort((p,q)=>q.d.localeCompare(p.d));
  sheet(`<h3>${esc(n)}</h3><div class="kpis">${kpi(T('Given'),inr(b.given-b.back))}${kpi(T('Spent'),inr(b.spent),'out',b.x.length+' '+T('bills'))}${kpi(b.bal>=0?T('Cash left'):T('Owed to them'),inr(Math.abs(b.bal)),b.bal<0?'out':'in')}</div>
  ${can.money()?`<div class="row" style="gap:8px"><button class="btn sp" onclick="floatForm('${esc(k)}')">${T('Give cash')}</button><button class="btn ghost sp" onclick="floatForm('${esc(k)}',1)">${T('Cash returned')}</button></div>`:''}
  <div class="card" style="padding:4px 14px;margin-top:10px">${L.map(r=>r.t==='g'?`<div class="item" ${can.money()?`onclick="floatForm('${esc(k)}',0,'${r.f.id}')"`:''}>${tile(r.a>0?'cash':'repeat',r.a>0?'green':'slate','sm')}<div class="sp"><div class="t1">${r.a>0?T('Cash given'):T('Cash returned')}</div><div class="mut">${fd(r.d)} · ${esc(T(r.f.mode||''))}${r.f.note?' · '+esc(r.f.note):''}${r.f.by?' · '+esc(r.f.by):''}</div></div><div class="amt ${r.a>0?'in':''}">${r.a>0?'+':'−'}${inr(Math.abs(r.a))}</div></div>`:expRow(r.x)).join('')||`<div class="empty">${T('Nothing here')}</div>`}</div>`)}
function floatForm(k,ret,fid){const f0=fid?S.floats.find(x=>x.id===fid):{date:today(),mode:'Cash',to:k||''};if(fid)ret=+f0.amount<0;const P=persons();
  sheet(`<h3>${ret?T('Cash returned'):T('Give cash for expenses')}</h3><form id="f">
  <label>${T('To')} *</label><select name="to" required><option value=""></option>${P.map(p=>`<option value="${esc(p.key)}" ${p.key===f0.to?'selected':''}>${esc(p.name)} · ${esc(p.sub)}</option>`).join('')}</select>
  <label>${T('Amount (₹)')} *</label><input name="amount" type="number" inputmode="decimal" required value="${f0.amount?Math.abs(f0.amount):''}">
  <div class="g2"><div><label>${T('Date')}</label><input name="date" type="date" value="${esc(f0.date)}"></div><div><label>${T('Mode')}</label><select name="mode">${MODES.map(m=>`<option ${m===f0.mode?'selected':''} value="${m}">${T(m)}</option>`).join('')}</select></div></div>
  <label>${T('Note')}</label><input name="note" value="${esc(f0.note||'')}" placeholder="${T('e.g. for vegetables and gas this week')}">
  <div class="mut" id="fb" style="margin-top:8px"></div>
  <button class="btn w" style="margin-top:14px">${T('Save')}</button>${fid&&can.del()?`<button type="button" class="btn red w" id="dfl">${T('Delete')}</button>`:''}</form>`);
  const f=$('#f'),hint=()=>{const v=f.to.value;$('#fb').textContent=v?personName(v)+': '+balText(floatBal(v)):''};f.to.onchange=hint;hint();
  f.onsubmit=ev=>{ev.preventDefault();const o=Object.fromEntries(new FormData(f));o.amount=(ret?-1:1)*Math.abs(+o.amount);o.toName=personName(o.to);
    if(fid)Object.assign(f0,o);else S.floats.push(stamp({id:uid(),...o}));save();render();floatPerson(o.to)};
  if($('#dfl'))$('#dfl').onclick=()=>{if(!confirm('Delete?'))return;S.floats=S.floats.filter(x=>x.id!==fid);save();render();floatPerson(f0.to)}}
function myCashCard(){const b=floatBal(myKey());if(!b.g.length&&!b.x.length)return'';
  return `<button class="nw card" onclick="floatPerson('${esc(myKey())}')">${tile('cash',b.bal<0?'red':'green','lg')}<span class="nw-main"><small>${b.bal>=0?T('Cash with you'):T('Business owes you')}</small><b class="${b.bal<0?'out':''}">${inr(Math.abs(b.bal))}</b></span><span class="delta">${T('Spent')} ${inr(b.spent)}<small>${b.x.length} ${T('bills')} · ${T('Given')} ${inr(b.given-b.back)}</small></span></button>`}

/* expense form additions: where + paid from */
function expExtra(x){const own=can.money(),P=persons(),cur=x.id?x.floatOf||'':(own?'':myKey());
  return `<div class="g2"><div><label>${T('Where (shop / place)')}</label><input name="where" value="${esc(x.where||'')}" list="wl" placeholder="${T('e.g. KR Market')}"><datalist id="wl">${[...new Set(S.expenses.map(e=>e.where).filter(Boolean))].slice(-30).map(w=>`<option value="${esc(w)}">`).join('')}</datalist></div>
  <div><label>${T('Paid from')}</label>${own?`<select name="floatOf"><option value="">${T('Business money')}</option>${P.map(p=>`<option value="${esc(p.key)}" ${p.key===cur?'selected':''}>${T('Cash with')} ${esc(p.name)}</option>`).join('')}${cur&&!P.some(p=>p.key===cur)?`<option value="${esc(cur)}" selected>${esc(personName(cur))}</option>`:''}</select>`
   :`<select name="floatOf"><option value="${esc(myKey())}" ${cur?'selected':''}>${T('Cash given to me / my money')}</option><option value="" ${cur?'':'selected'}>${T('Business account (owner paid)')}</option></select>`}</div></div>
  <div class="mut" id="flh" style="margin-top:4px"></div>`}
function wireExpExtra(f,x){const h=()=>{const k=f.floatOf&&f.floatOf.value,el=$('#flh');if(!el)return;if(!k){el.textContent='';return}const b=floatBal(k),a=(+f.amount.value||0)-(x.id&&x.floatOf===k?+x.amount||0:0);
  el.innerHTML=`💵 ${esc(personName(k))}: ${balText(b)} → ${T('after this')} <b class="${b.bal-a<0?'out':''}">${b.bal-a<0?T('owed')+' ':''}${inr(Math.abs(b.bal-a))}</b>`};
  if(f.floatOf)f.floatOf.onchange=h;f.amount.addEventListener('input',h);h()}

/* ---- order change history ---- */
const HFIELDS=[['date','Event date',fd],['status','Status',v=>T((stLabel[v]||[v])[0])],['type','Event type',v=>T(v||'')],['venueType','Venue type',v=>T(v||'')],['venue','Venue'],['client','Customer'],
  ['plates','Plates',v=>(+v||0)+''],['rate','Rate per plate (₹)',v=>inr(v),1],['extra','Extras (₹)',v=>inr(v),1],['discount','Discount (₹)',v=>inr(v),1],['gstMode','GST',v=>T({none:'No GST',extra:'GST extra',incl:'GST included'}[v||'none']),1],['gst','GST %',v=>(+v||0)+'%',1],
  ['goods','Items sold at the event',v=>(v||[]).map(g=>`${g.q} ${g.n} @ ${inr(g.r)}`).join(', ')||'—',1],['menu','Menu / notes',v=>String(v||'').slice(0,60)]];
function evDiff(a,b){const out=[];HFIELDS.forEach(([k,l,fmt,money])=>{const f=fmt||(v=>String(v??''));let x=a[k],y=b[k];
  if(k==='gstMode'){x=gMode(a);y=gMode(b)}if(k==='gst'&&(gMode(a)==='none'&&gMode(b)==='none'))return;
  const sx=f(x),sy=f(y);if(String(x??'')===String(y??'')||sx===sy)return;if(k==='goods'&&JSON.stringify(x||[])===JSON.stringify(y||[]))return;out.push({f:l,a:sx,b:sy,m:money?1:0})});return out}
function histBlock(e){const H=(e.hist||[]).slice().reverse();if(!H.length)return'';const show=can.money();
  return `<h2>${T('Change history')}</h2><div class="card" style="padding:6px 14px">${H.map(h=>{const ch=h.ch.filter(c=>show||!c.m);if(!ch.length)return'';return `<div class="hist"><div class="mut">${new Date(h.at).toLocaleString(loc(),{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})} · ${esc(h.by||'')}${h.v?' · 🎤':''}</div>${h.note?`<div class="hn">“${esc(h.note)}”</div>`:''}${ch.map(c=>`<div class="hc"><span>${esc(T(c.f))}</span> <s>${esc(c.a)||'—'}</s> → <b>${esc(c.b)||'—'}</b></div>`).join('')}</div>`}).join('')}</div>`}
function billStale(e){const B=e.bills||[];if(!B.length)return null;const lb=B[B.length-1],lh=(e.hist||[]).filter(h=>h.ch.some(c=>c.m||/Plates|Items/.test(c.f))).pop();
  return lh&&lh.at>lb.at&&gstBreak(e).total!==lb.total?lb:null}

/* ---- voice: speak or paste the order, then review ---- */
let VLANG=(()=>{try{return localStorage.getItem('caterbook.vlang')||(LANGV==='kn'?'kn-IN':'en-IN')}catch(x){return'en-IN'}})();
function voiceOK(){return !!((window.AndroidBridge&&AndroidBridge.startSpeech)||window.SpeechRecognition||window.webkitSpeechRecognition)}
function listen(onText){
  if(window.AndroidBridge&&AndroidBridge.startSpeech){window.__onSpeech=(t,e)=>{if(t)onText(t);else if(e==='not-available')toast(T('No voice typing on this phone — paste the text instead'))};AndroidBridge.startSpeech(VLANG);return}
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){toast(T('Voice typing not available here — paste the text instead'));return}
  const r=new SR();r.lang=VLANG;r.interimResults=false;r.continuous=false;r.maxAlternatives=1;const b=$('#vmic');if(b)b.classList.add('rec');
  r.onresult=ev=>onText([...ev.results].map(x=>x[0].transcript).join(' '));r.onerror=ev=>toast(ev.error==='not-allowed'?T('Allow microphone to use voice'):T('Could not hear — try again'));r.onend=()=>{const b=$('#vmic');if(b)b.classList.remove('rec')};
  try{r.start()}catch(x){}}
function voiceSheet(eid){const e=eid?byId('events',eid):null;
  sheet(`<h3>🎤 ${e?T('Update order by voice'):T('New order by voice')}</h3>${e?`<div class="mut">${esc(evName(e))} · ${fd(e.date)}</div>`:''}
  <div class="seg" id="vl" style="margin-top:10px">${[['en-IN','English'],['kn-IN','ಕನ್ನಡ']].map(([k,l])=>`<button class="${VLANG===k?'on':''}" data-l="${k}">${l}</button>`).join('')}</div>
  <button class="vmic" id="vmic" onclick="listen(t=>{const a=$('#vt');a.value=(a.value?a.value+' ':'')+t;vPreview('${eid||''}')})">${ico('mic',34)}</button>
  <div class="mut" style="text-align:center">${voiceOK()?T('Tap and speak. Tap again to add more.'):T('Voice typing is not available in this browser — type or paste below.')}</div>
  <label>${T('What was said')} <span class="mut">(${T('you can also paste a WhatsApp message here')})</span></label><textarea id="vt" rows="4" oninput="vPreview('${eid||''}')" placeholder="${e?T('e.g. Plates reduced to 450. Add 100 sweet boxes at 40 rupees.'):T('e.g. Wedding on 20 December at Malleshwaram Kalyana Mantapa, 500 plates, 350 per plate, Ramesh 98450 12345, menu bisi bele bath, holige, payasa')}"></textarea>
  <div id="vp"></div>
  <button class="btn w" onclick="vApply('${eid||''}')">${T('Review & save')}</button>`);
  $('#vl').onclick=ev=>{const b=ev.target.closest('button');if(!b)return;VLANG=b.dataset.l;try{localStorage.setItem('caterbook.vlang',VLANG)}catch(x){}$('#vl').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))}}
function vPreview(eid){const p=parseOrder($('#vt').value,eid?byId('events',eid):null);const L={client:'Customer',phone:'Phone',date:'Event date',type:'Event type',venue:'Venue',venueType:'Venue type',plates:'Plates',rate:'Rate per plate (₹)',extra:'Extras (₹)',discount:'Discount (₹)',status:'Status',adv:'Advance received now (₹)',menu:'Menu / notes'};
  const rows=Object.entries(p).filter(([k])=>L[k]).map(([k,v])=>[T(L[k]),k==='date'?fd(v):k==='status'?T(stLabel[v][0]):k==='rate'||k==='extra'||k==='discount'||k==='adv'?inr(v):v]);
  (p.goods||[]).forEach(g=>rows.push([T('Item'),`${g.q} × ${g.n} @ ${inr(g.r)}`]));
  $('#vp').innerHTML=rows.length?`<div class="card" style="margin-top:10px"><div class="mut" style="margin-bottom:4px">${T('Understood')}:</div>${rows.map(([a,b])=>`<div class="row" style="padding:3px 0"><span class="sp mut">${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}</div>`:''}
function vApply(eid){const t=$('#vt').value.trim();if(!t){toast(T('Say or type something first'));return}const p=parseOrder(t,eid?byId('events',eid):null);p._voice=t;close();evForm(eid||null,false,p)}

/* text → order fields (English + Kannada words, digits in either script) */
const KN_DIG='೦೧೨೩೪೫೬೭೮೯',KN_MON=['ಜನವರಿ','ಫೆಬ್ರವರಿ','ಮಾರ್ಚ್','ಏಪ್ರಿಲ್','ಮೇ','ಜೂನ್','ಜುಲೈ','ಆಗಸ್ಟ್','ಸೆಪ್ಟೆಂಬರ್','ಅಕ್ಟೋಬರ್','ನವೆಂಬರ್','ಡಿಸೆಂಬರ್'],EN_MON=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const KN_NUM=[['ಒಂಬೈನೂರು',900],['ಎಂಟುನೂರು',800],['ಏಳುನೂರು',700],['ಆರುನೂರು',600],['ಐನೂರು',500],['ನಾನೂರು',400],['ಮುನ್ನೂರು',300],['ಇನ್ನೂರು',200],['ನೂರು',100],['ಸಾವಿರ',1000]];
const TYPE_WORDS=[['Wedding',/wedding|marriage|kalyan|maduve|ಮದುವೆ|ವಿವಾಹ|ಕಲ್ಯಾಣ/],['Engagement',/engagement|nischit|ನಿಶ್ಚಿತಾರ್ಥ/],['Birthday',/birthday|ಹುಟ್ಟುಹಬ್ಬ|ಜನ್ಮದಿನ/],['Housewarming',/house\s?warming|gruha\s?pravesh|griha\s?pravesh|ಗೃಹಪ್ರವೇಶ/],['Naming ceremony',/naming|namakaran|cradle|ನಾಮಕರಣ/],['Upanayana',/upanayan|thread ceremony|ಉಪನಯನ/],['Corporate',/corporate|office party|company/],['Daily tiffin',/tiffin|daily lunch/]];
const VENUE_WORDS=[['Marriage hall',/hall|mantap|chatra|choultry|ಮಂಟಪ|ಛತ್ರ|ಹಾಲ್/],['Temple',/temple|ದೇವಸ್ಥಾನ|ಗುಡಿ/],['Corporate office',/office|ಆಫೀಸ್/],['School / college',/school|college|ಶಾಲೆ|ಕಾಲೇಜು/],['Home',/\b(home|house)\b|ಮನೆ/]];
function parseOrder(text,base){const out={};if(!text)return out;
  let s=' '+text.replace(/[೦-೯]/g,d=>KN_DIG.indexOf(d))+' ';KN_NUM.forEach(([w,n])=>{s=s.split(w).join(' '+n+' ')});
  s=s.replace(/(\d),(\d{3})/g,'$1$2').replace(/(\d+(?:\.\d+)?)\s*(?:k|thousand)\b/gi,(m,n)=>Math.round(n*1000));const l=s.toLowerCase();
  const num=re=>{const m=l.match(re);return m?+m[1]:null};
  const ph=l.replace(/(\d)[\s-](?=\d)/g,'$1').match(/(?:\+?91)?([6-9]\d{9})/);if(ph)out.phone=ph[1];
  const lp=ph?l.replace(/(\d)[\s-](?=\d)/g,'$1').replace(ph[0],' '):l;const n2=re=>{const m=lp.match(re);return m?+m[1]:null};
  let p=n2(/(\d{2,5})\s*(?:plates?|plate|people|persons?|guests?|members|pax|heads|ಪ್ಲೇಟ್\S*|ಜನ\S*|ಮಂದಿ\S*)/)??n2(/(?:plates?|ಪ್ಲೇಟ್\S*|guests?|people|count)\s*(?:count\s*)?(?:is|are|will be|has|have|got|now|reduced|increased|changed|revised|become|ಈಗ)?\s*(?:reduced|increased|changed|revised)?\s*(?:to|=|:|ಗೆ|ಕ್ಕೆ)?\s*(\d{2,5})/);if(p)out.plates=p;
  let r=n2(/(?:rs\.?|₹|rupees?)?\s*(\d{2,5})\s*(?:rs\.?|rupees?|ರೂ\S*)?\s*(?:per|a|each|\/|ಪ್ರತಿ)\s*(?:plate|head|person|ಪ್ಲೇಟ್\S*)/)??n2(/(?:rate|price|ಬೆಲೆ|ದರ)\s*(?:is|of|to|per plate|=|:|ಗೆ)?\s*(?:rs\.?|₹)?\s*(\d{2,5})/)??n2(/(?:per|ಪ್ರತಿ)\s*(?:plate|ಪ್ಲೇಟ್\S*)\s*(?:rs\.?|₹)?\s*(\d{2,5})/);if(r)out.rate=r;
  const ex=n2(/(?:extra|extras|additional|transport charge)\s*(?:charge|amount)?\s*(?:of|is|=)?\s*(?:rs\.?|₹)?\s*(\d{2,7})/);if(ex)out.extra=ex;
  const di=n2(/discount\s*(?:of|is|=)?\s*(?:rs\.?|₹)?\s*(\d{2,7})/);if(di)out.discount=di;
  const ad=n2(/advance\s*(?:of|is|paid|received|=)?\s*(?:rs\.?|₹)?\s*(\d{2,7})/)??n2(/(?:rs\.?|₹)?\s*(\d{2,7})\s*(?:rs\.?|rupees?)?\s*advance/);if(ad&&!base)out.adv=ad;
  const G=[];const gre=/(?:add|plus|sell|sold|also)\s+(\d{1,5})\s+([a-z][a-z ]{1,30}?)\s+(?:at|@|for|of)\s*(?:rs\.?|₹)?\s*(\d{1,6})\s*(?:rs|rupees)?(?:\s*(?:each|per\s*\w+))?/g;let m;while((m=gre.exec(lp)))G.push({n:cap(m[2].trim().replace(/\s+(boxes|bottles|packets|pieces)$/,' $1')),q:+m[1],r:+m[3],g:/water|bottle|sweet|box|gift/.test(m[2])?5:18});if(G.length)out.goods=G;
  // date
  const now=new Date(today()+'T00:00');let d=null;
  if(/day after tomorrow|ನಾಡಿದ್ದು/.test(l)){d=new Date(now);d.setDate(d.getDate()+2)}else if(/tomorrow|ನಾಳೆ/.test(l)){d=new Date(now);d.setDate(d.getDate()+1)}else if(/\btoday\b|ಇಂದು|ಇವತ್ತು/.test(l))d=new Date(now);
  const mi=()=>{let x=l.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s*)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(?:\s*,?\s*(20\d\d))?/);if(x)return[+x[1],EN_MON.indexOf(x[2]),x[3]];
    x=l.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(20\d\d))?/);if(x)return[+x[2],EN_MON.indexOf(x[1]),x[3]];
    for(let i=0;i<12;i++){const y=s.match(new RegExp('(\\d{1,2})\\s*(?:ನೇ)?\\s*'+KN_MON[i]));if(y)return[+y[1],i];const z=s.match(new RegExp(KN_MON[i]+'\\s*(\\d{1,2})'));if(z)return[+z[1],i]}
    x=lp.match(/\b(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\b/);if(x&&+x[2]<=12)return[+x[1],+x[2]-1,x[3]&&(x[3].length===2?'20'+x[3]:x[3])];return null};
  const md=mi();if(md&&md[0]>=1&&md[0]<=31){d=new Date(md[2]?+md[2]:now.getFullYear(),md[1],md[0]);if(!md[2]&&d<now)d.setFullYear(d.getFullYear()+1)}
  if(!d){const wd=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'],kw=['ಭಾನುವಾರ','ಸೋಮವಾರ','ಮಂಗಳವಾರ','ಬುಧವಾರ','ಗುರುವಾರ','ಶುಕ್ರವಾರ','ಶನಿವಾರ'];for(let i=0;i<7;i++)if(l.includes(wd[i])||s.includes(kw[i])){d=new Date(now);let k=(i-d.getDay()+7)%7||7;if(/next week|ಮುಂದಿನ ವಾರ/.test(l))k+=k<7?7:0;d.setDate(d.getDate()+k);break}}
  if(d)out.date=iso(d);
  const ty=TYPE_WORDS.find(([t,re])=>re.test(l)&&S.types.includes(t));if(ty)out.type=ty[0];
  const vt=VENUE_WORDS.find(([t,re])=>re.test(l));if(vt&&(S.venueTypes||VENUE_DEF).includes(vt[0]))out.venueType=vt[0];
  let v=s.match(/\b(?:at|venue is|venue|in)\s+([A-Za-z][^,.;\n]{2,40}?)(?=\s*(?:,|\.|;|\bon\b|\bfor\b|\bwith\b|\bmenu\b|\bcustomer\b|\d|$))/i);if(v&&!/^(the )?(morning|evening|night|afternoon|total)/i.test(v[1]))out.venue=v[1].trim();
  const kv=s.match(/([^\s,.\d]+(?:\s[^\s,.\d]+){0,3}?)(?:ದ|ನ|ಯ)?ಲ್ಲಿ/);if(!out.venue&&kv)out.venue=kv[1].trim().replace(/(ದ|ನ|ಯ)$/,'');
  const c=s.match(/\b(?:customer(?: name)?(?: is)?|client(?: is)?|name is|booked by|party name|mr\.?|mrs\.?|ms\.?|from)\s+([A-Za-z][A-Za-z.]+(?:\s[A-Za-z][A-Za-z.]+){0,2})/i);
  if(c&&!/^(the|a|an|today|tomorrow|morning|evening)$/i.test(c[1]))out.client=c[1].replace(/\s+(on|at|for|wants|needs|phone|number)\b.*$/i,'').split(' ').map(w=>cap(w.toLowerCase())).join(' ');
  if(/cancel|ರದ್ದು/.test(l))out.status='cancelled';else if(/confirm|advance|fixed|ಖಚಿತ|ಫಿಕ್ಸ್/.test(l))out.status='confirmed';else if(!base&&/enquiry|inquiry|quotation|quote|asking|ವಿಚಾರ/.test(l))out.status='enquiry';
  const mn=s.match(/(?:menu|ಮೆನು|items are|food)\s*(?:is|are|:|-|will be)?\s*(.+)$/i);if(mn)out.menu=mn[1].trim().replace(/[.\s]+$/,'');
  if(base){Object.keys(out).forEach(k=>{if(k!=='goods'&&String(base[k]??'')===String(out[k]))delete out[k]})}
  return out}

/* ---- sample data for the team features ---- */
function sampleTeam(){const t=today(),d=n=>iso(new Date(Date.now()+n*864e5));const mk2=CLOUD?null:'u:m1';if(!mk2)return;
  S.floats.push({id:uid(),to:'u:m1',toName:'Manju',amount:10000,date:d(-9),mode:'Cash',note:'Week groceries and gas',by:'Owner',byE:'u:owner'},{id:uid(),to:'u:s1',toName:'Ravi',amount:3000,date:d(-5),mode:'UPI',note:'Diesel and small items',by:'Owner',byE:'u:owner'});
  const ev=S.events.filter(e=>live(e)&&e.date<=t).sort((a,b)=>b.date.localeCompare(a.date))[0];
  S.expenses.push({id:uid(),date:d(-8),amount:4200,cat:'Vegetables',eventId:ev?ev.id:'',mode:'Cash',where:'KR Market',note:'Vegetables',floatOf:'u:m1',by:'Manju',byE:'u:m1'},
    {id:uid(),date:d(-6),amount:3850,cat:'Gas / fuel',eventId:'',mode:'Cash',where:'Indane, Jayanagar',note:'2 commercial cylinders',floatOf:'u:m1',by:'Manju',byE:'u:m1'},
    {id:uid(),date:d(-3),amount:1900,cat:'Vehicle fuel',eventId:'',mode:'UPI',where:'HP pump, Hosur Rd',floatOf:'u:s1',by:'Ravi',byE:'u:s1',qty:20,unit:'L'});
  S.events.filter(e=>e.date>t&&live(e)).slice(0,1).forEach(e=>{e.hist=[{at:new Date(Date.now()-3*864e5).toISOString(),by:'Owner',note:'Customer called — fewer guests',ch:[{f:'Plates',a:String((+e.plates||0)+100),b:String(+e.plates||0),m:0}]}]})}

Object.assign(KN,{'Co-owner':'ಸಹ-ಮಾಲೀಕ','Staff':'ಸಿಬ್ಬಂದಿ','Access':'ಅನುಮತಿ','Can add & edit':'ಸೇರಿಸಬಹುದು ಮತ್ತು ಬದಲಿಸಬಹುದು','Cash with team':'ತಂಡದ ಬಳಿ ಹಣ','Owed to team':'ತಂಡಕ್ಕೆ ಬಾಕಿ','given, not yet spent':'ಕೊಟ್ಟದ್ದು, ಇನ್ನೂ ಖರ್ಚಾಗಿಲ್ಲ','spent from their own money':'ಅವರ ಸ್ವಂತ ಹಣದಿಂದ',
'Give cash for expenses':'ಖರ್ಚಿಗೆ ಹಣ ಕೊಡಿ','Give cash':'ಹಣ ಕೊಡಿ','Cash returned':'ಹಣ ವಾಪಸ್','Cash given':'ಕೊಟ್ಟ ಹಣ','Given':'ಕೊಟ್ಟದ್ದು','Spent':'ಖರ್ಚು','bills':'ಬಿಲ್‌ಗಳು','Cash left':'ಉಳಿದ ಹಣ','Owed to them':'ಅವರಿಗೆ ಬಾಕಿ','No cash given yet':'ಇನ್ನೂ ಹಣ ಕೊಟ್ಟಿಲ್ಲ','To':'ಯಾರಿಗೆ',
'Cash with you':'ನಿಮ್ಮ ಬಳಿ ಹಣ','Business owes you':'ವ್ಯಾಪಾರ ನಿಮಗೆ ಕೊಡಬೇಕು','Where (shop / place)':'ಎಲ್ಲಿ (ಅಂಗಡಿ / ಸ್ಥಳ)','Paid from':'ಯಾವ ಹಣದಿಂದ','Business money':'ವ್ಯಾಪಾರದ ಹಣ','Cash with':'ಹಣ ಇರುವವರು','Cash given to me / my money':'ನನಗೆ ಕೊಟ್ಟ ಹಣ / ನನ್ನ ಹಣ','Business account (owner paid)':'ವ್ಯಾಪಾರ ಖಾತೆ (ಮಾಲೀಕರು ಕಟ್ಟಿದರು)','after this':'ಇದರ ನಂತರ','owed':'ಬಾಕಿ',
'Change history':'ಬದಲಾವಣೆ ಇತಿಹಾಸ','Reason for change':'ಬದಲಾವಣೆಗೆ ಕಾರಣ','Amend order':'ಆರ್ಡರ್ ಬದಲಿಸಿ','Order changed after the bill':'ಬಿಲ್ ನಂತರ ಆರ್ಡರ್ ಬದಲಾಗಿದೆ',
'Update order by voice':'ಧ್ವನಿಯಲ್ಲಿ ಆರ್ಡರ್ ಬದಲಿಸಿ','New order by voice':'ಧ್ವನಿಯಲ್ಲಿ ಹೊಸ ಆರ್ಡರ್','Tap and speak. Tap again to add more.':'ಒತ್ತಿ ಮಾತನಾಡಿ. ಇನ್ನಷ್ಟು ಸೇರಿಸಲು ಮತ್ತೆ ಒತ್ತಿ.','What was said':'ಹೇಳಿದ್ದು','you can also paste a WhatsApp message here':'WhatsApp ಸಂದೇಶವನ್ನೂ ಇಲ್ಲಿ ಅಂಟಿಸಬಹುದು','Review & save':'ಪರಿಶೀಲಿಸಿ ಉಳಿಸಿ','Understood':'ಅರ್ಥವಾದದ್ದು',
'Voice order':'ಧ್ವನಿ ಆರ್ಡರ್','Speak or paste order details':'ಆರ್ಡರ್ ವಿವರ ಹೇಳಿ ಅಥವಾ ಅಂಟಿಸಿ','Give cash to team':'ತಂಡಕ್ಕೆ ಹಣ','For expenses — track balance':'ಖರ್ಚಿಗೆ — ಬಾಕಿ ನೋಡಿ','My expenses':'ನನ್ನ ಖರ್ಚುಗಳು','Entered by':'ನಮೂದಿಸಿದವರು','Orders this month':'ಈ ತಿಂಗಳ ಆರ್ಡರ್‌ಗಳು','View only':'ನೋಡಲು ಮಾತ್ರ'});
