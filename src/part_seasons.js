/* ================= SEASONS PLANNER ================= */
// Reference dates. Muhurtha lists are Kannadiga (Amavasyant) dates published by hindu-blog.com; holidays from the
// Karnataka 2026 government list (greytHR) and a provisional 2027 list (officeholidays.com). Users can add their own dates.
const SEASON_DATA={
  holidays:{KA:{
    2026:[['01-01','New Year'],['01-15','Makara Sankranti'],['01-26','Republic Day'],['01-27','Sri Madhvanavami'],['02-04','Shab-e-Barat'],['03-02','Holi'],['03-17','Shab-e-Qadar'],['03-19','Ugadi'],['03-20','Jumat-ul-Wida'],['03-21','Khutub-e-Ramzan'],['03-23','Devara Dasimayya Jayanthi'],['03-27','Sri Ramanavami'],['03-31','Mahaveera Jayanthi'],['04-03','Good Friday'],['04-14','Dr B R Ambedkar Jayanthi'],['04-20','Basava Jayanthi / Akshaya Tritiya'],['04-21','Sri Shankaracharya Jayanthi'],['04-22','Sri Ramanujacharya Jayanthi'],['05-01','May Day'],['05-28','Bakrid'],['06-26','Last day of Muharram'],['08-15','Independence Day'],['08-21','Varamahalakshmi Vrata'],['08-26','Eid-Milad'],['08-27','Yajur Upakarma'],['08-28','Narayana Guru Jayanthi / Raksha Bandhan'],['09-04','Krishna Janmashtami'],['09-14','Varasiddhi Vinayaka Vrata (Ganesha Chaturthi)'],['09-17','Vishwakarma Jayanthi'],['09-25','Ananta Padmanabha Vrata'],['10-02','Gandhi Jayanthi'],['10-20','Mahanavami / Ayudha Pooja'],['10-21','Vijayadashami'],['11-01','Kannada Rajyotsava'],['11-10','Balipadyami / Deepavali'],['11-24','Guru Nanak Jayanthi'],['11-26','Huttari'],['11-27','Kanakadasa Jayanthi'],['12-24','Christmas Eve'],['12-25','Christmas']],
    2027:[['01-15','Makara Sankranti'],['01-26','Republic Day'],['03-06','Maha Shivaratri'],['03-09','Khutub-e-Ramzan'],['03-26','Good Friday'],['04-07','Ugadi'],['04-14','Dr B R Ambedkar Jayanthi'],['04-18','Mahaveera Jayanthi'],['05-01','May Day'],['05-09','Basava Jayanthi'],['05-17','Bakrid'],['06-16','Last day of Muharram'],['08-15','Independence Day / Eid-Milad'],['09-04','Ganesha Chaturthi'],['09-27','Mahalaya Amavasya'],['10-02','Gandhi Jayanthi'],['10-09','Ayudha Pooja / Vijayadashami'],['10-15','Valmiki Jayanthi'],['10-28','Naraka Chaturdashi'],['10-29','Deepavali'],['11-01','Kannada Rajyotsava'],['11-16','Kanakadasa Jayanthi'],['12-25','Christmas']]}},
  festivals:{2026:[['08-21','Varamahalakshmi'],['09-13','Gowri Habba'],['09-14','Ganesha Chaturthi'],['10-20','Ayudha Pooja'],['10-21','Dasara'],['11-10','Deepavali / Balipadyami']],
    2027:[['01-15','Makara Sankranti'],['03-06','Maha Shivaratri'],['04-07','Ugadi'],['04-15','Sri Ramanavami'],['05-09','Akshaya Tritiya'],['08-13','Varamahalakshmi'],['09-03','Gowri Habba'],['09-04','Ganesha Chaturthi'],['10-08','Mahanavami'],['10-09','Dasara'],['10-29','Deepavali'],['10-30','Balipadyami'],['11-11','Tulasi Habba']]},
  muhurtha:{KA:{2026:{2:[5,6,7,8,20,21,22,25,26],3:[2,3,4,7,8,9,11,12],4:[15,20,21,25,26,27,28,29],5:[1,3,5,6,7,8,13,14],6:[21,22,23,24,25,26,27,29],7:[1,6,7,11],11:[21,24,25,26],12:[2,3,4,6,11,12]},
    2027:{1:[1,2,26,27,28,29],2:[10,11,12,19,23,25,26],3:[10,11],4:[18,19,21,23,24,25,26,27,28],5:[4,7,9,13,14,15,16,17,18,19,20,21,22,23,24,25,30,31],6:[1,5,9,10,11,12,13,15,16,17,19,20,21,26,27,28],7:[1,7,8,9,11,12],11:[10,11,15,16,20,21,23,24,25,26,29],12:[2,7,8,9,12,13,14]}}},
  noWedding:{2026:[['2026-01-01','2026-01-31','Shukrasta — no wedding dates'],['2026-07-15','2026-08-12','Ashada masa'],['2026-08-13','2026-10-31','Chaturmasa — no wedding dates'],['2026-12-16','2027-01-14','Dhanurmasa — many families avoid weddings']],
    2027:[['2027-08-01','2027-10-31','Chaturmasa — no wedding dates'],['2027-12-16','2028-01-14','Dhanurmasa — many families avoid weddings']]},
  provisional:{2027:true}};
const STATES={KA:'Karnataka'};
const seasonState=()=>S.seasonState||'KA';
let SY=null;const seasonYear=()=>SY||+today().slice(0,4);
function seasonDates(y){const st=seasonState(),out=[];
  ((SEASON_DATA.holidays[st]||{})[y]||[]).forEach(([md,n])=>out.push({d:y+'-'+md,n,k:'holiday'}));
  (st==='KA'?(SEASON_DATA.festivals[y]||[]):[]).forEach(([md,n])=>{if(!out.some(o=>o.d===y+'-'+md&&o.n.includes(n.split(' ')[0])))out.push({d:y+'-'+md,n,k:'festival'})});
  const mu=(SEASON_DATA.muhurtha[st]||{})[y]||{};Object.entries(mu).forEach(([m,days])=>[...new Set(days)].forEach(dd=>out.push({d:`${y}-${String(m).padStart(2,'0')}-${String(dd).padStart(2,'0')}`,n:T('Wedding muhurtha'),k:'muhurtha'})));
  (S.customDates||[]).filter(c=>c.date&&c.date.startsWith(y+'-')).forEach(c=>out.push({d:c.date,n:c.name,k:'custom',id:c.id}));
  return out.sort((a,b)=>a.d.localeCompare(b.d))}
const noWed=y=>[...(SEASON_DATA.noWedding[y-1]||[]),...(SEASON_DATA.noWedding[y]||[])].filter(([a,b])=>b>=y+'-01-01'&&a<=y+'-12-31');
const KI={holiday:'🏛️',festival:'🪔',muhurtha:'💍',custom:'📌'};
function monthInfo(y,m){const key=`${y}-${String(m).padStart(2,'0')}`,D=seasonDates(y).filter(x=>x.d.startsWith(key));
  const mu=D.filter(x=>x.k==='muhurtha'),fe=D.filter(x=>x.k==='festival'||x.k==='holiday'&&/sankranti|ugadi|ganesh|vinayaka|dasara|vijaya|deepavali|varamahalakshmi|ramanavami|akshaya|ayudha/i.test(x.n)),cu=D.filter(x=>x.k==='custom');
  const nw=noWed(y).filter(([a,b])=>a<=key+'-31'&&b>=key+'-01');
  // your own history: same month in previous years
  const hist=S.events.filter(e=>live(e)&&e.date.slice(5,7)===key.slice(5)&&e.date.slice(0,4)<String(y)),yrs=new Set(hist.map(e=>e.date.slice(0,4))).size||1;
  const histAvg=hist.length/yrs,booked=S.events.filter(e=>live(e)&&mk(e.date)===key),enq=S.events.filter(e=>e.status==='enquiry'&&mk(e.date)===key);
  const score=mu.length*1.2+fe.length*2+cu.length+histAvg*1.5-(nw.length&&!mu.length?2:0);
  const level=score>=12?['Peak','due']:score>=7?['Busy','enq']:score>=3?['Normal','']:['Lean','can'];
  return{key,D,mu,fe,cu,nw,histAvg,booked,enq,score,level}}
function insSeasons(){const y=seasonYear(),t=today(),months=Array.from({length:12},(_,i)=>monthInfo(y,i+1));
  const in90=seasonDates(+t.slice(0,4)).concat(seasonDates(+t.slice(0,4)+1)).filter(x=>x.d>=t&&x.d<=addDays(90));
  const mu90=in90.filter(x=>x.k==='muhurtha'),bookedDays=new Set(S.events.filter(live).map(e=>e.date)),free=mu90.filter(x=>!bookedDays.has(x.d));
  const peak=months.filter(m=>m.level[0]==='Peak').map(m=>mname(m.key).split(' ')[0]),lean=months.filter(m=>m.level[0]==='Lean').map(m=>mname(m.key).split(' ')[0]);
  const tips=[];
  if(peak.length)tips.push(`📈 ${T('Peak months')}: <b>${peak.join(', ')}</b> — ${T('take advances early, line up extra cooks and serving teams, fix rice/oil prices with vendors in advance.')}`);
  if(lean.length)tips.push(`📉 ${T('Lean months')}: <b>${lean.join(', ')}</b> — ${T('push corporate lunches, daily tiffin, festival orders (Varamahalakshmi, Ganesha, Navaratri) and housewarming / naming functions; good time for vessel repairs and staff leave.')}`);
  if(free.length)tips.push(`💍 ${free.length} ${T('wedding muhurtha days in the next 90 days have no booking yet')} — ${T('follow up with enquiries and halls.')}`);
  const AS=noWed(y).find(([a,b,n])=>/Ashada/.test(n));if(AS)tips.push(`🌧️ ${T('Ashada')}: ${fd(AS[0])} – ${fd(AS[1])} — ${T('almost no weddings; plan for Ashada-end and Shravana functions.')}`);
  return `<div class="row" style="gap:8px;margin-bottom:10px"><select style="flex:1" onchange="S.seasonState=this.value;save();render()">${Object.entries(STATES).map(([k,v])=>`<option value="${k}" ${k===seasonState()?'selected':''}>${v}</option>`).join('')}<option value="OTHER" ${seasonState()==='OTHER'?'selected':''}>${T('Other state — add your own dates')}</option></select>
    <div class="per" style="margin:0"><button onclick="SY=seasonYear()-1;render()">‹</button><b style="min-width:52px">${y}</b><button onclick="SY=seasonYear()+1;render()">›</button></div></div>
  ${SEASON_DATA.provisional[y]?`<div class="alert">ℹ️ ${y}: ${T('holiday list is provisional and muhurtha dates are indicative — confirm with the official notification and your purohit.')}</div>`:''}
  ${!(SEASON_DATA.muhurtha[seasonState()]||{})[y]&&seasonState()==='KA'?`<div class="alert">ℹ️ ${T('Reference dates for this year are not built in yet — add your own dates below.')}</div>`:''}
  <h2>🧭 ${T('Planning tips')}</h2>${tips.map(x=>`<div class="alert g" style="display:block">${x}</div>`).join('')||`<div class="card empty">${T('Nothing here')}</div>`}
  <h2>📅 ${T('Next 90 days')}</h2><div class="card">${in90.length?in90.slice(0,40).map(x=>{const b=S.events.filter(e=>live(e)&&e.date===x.d);return `<div class="row" style="padding:6px 0;border-top:1px solid var(--line)"><span style="width:62px" class="mut">${new Date(x.d+'T00:00').toLocaleDateString(loc(),{weekday:'short',day:'numeric',month:'short'})}</span><span class="sp">${KI[x.k]} ${esc(T(x.n))}</span>${b.length?`<span class="pill done">${b.length} ${T('booked')}</span>`:x.k==='muhurtha'?`<span class="pill enq">${T('Free')}</span>`:''}</div>`}).join(''):`<div class="empty">${T('Nothing here')}</div>`}
    ${mu90.length?`<div class="mut" style="margin-top:8px">💍 ${mu90.length} ${T('muhurtha days')} · ${mu90.length-free.length} ${T('booked')} · ${free.length} ${T('free')}</div>`:''}</div>
  <h2>📊 ${T('Season by month')} — ${y}</h2><div class="card">${bars(months.map(m=>mname(m.key).split(' ')[0]),[months.map(m=>m.mu.length),months.map(m=>Math.round(m.histAvg*10)/10),months.map(m=>m.booked.length)],['var(--acc)','var(--warn)','var(--in)'])}${legend([['var(--acc)',T('Muhurtha days')],['var(--warn)',T('Your past orders (avg)')],['var(--in)',T('Booked')]])}</div>
  <h2>🗓️ ${T('Month by month')}</h2><div class="card" style="padding:4px 14px">${months.map((m,i)=>`<details style="border-top:${i?'1px solid var(--line)':'0'};padding:8px 0"><summary style="display:flex;gap:8px;align-items:center;cursor:pointer;list-style:none"><b style="width:74px">${mname(m.key)}</b><span class="pill ${m.level[1]}">${T(m.level[0])}</span><span class="sp mut" style="font-size:12px">💍${m.mu.length} · 🪔${m.fe.length}${m.nw.length?' · 🚫':''}</span><span class="mut" style="font-size:12px">${m.booked.length} ${T('booked')}${m.enq.length?' +'+m.enq.length+'?':''}</span></summary>
    <div style="padding:6px 0 0 4px;font-size:13px">${m.nw.map(([a,b,n])=>`<div class="out">🚫 ${esc(T(n))} (${fd(a)} – ${fd(b)})</div>`).join('')}
    ${m.mu.length?`<div>💍 <b>${T('Muhurtha')}</b>: ${m.mu.map(x=>{const d=new Date(x.d+'T00:00');return `<span style="${bookedDays.has(x.d)?'color:var(--in);font-weight:600':''}">${d.getDate()} ${d.toLocaleDateString(loc(),{weekday:'short'})}</span>`}).join(', ')}</div>`:''}
    ${m.D.filter(x=>x.k!=='muhurtha').map(x=>`<div>${KI[x.k]} ${fd(x.d)} · ${esc(T(x.n))}${x.k==='custom'&&can.admin()?` <span style="color:var(--out);cursor:pointer" onclick="delCustomDate('${x.id}')">✕</span>`:''}</div>`).join('')}
    <div class="mut" style="margin-top:4px">${T('Your past orders in this month')}: ${m.histAvg?m.histAvg.toFixed(1)+' '+T('avg'):'—'} · ${T('booked')}: ${m.booked.length} (${sum(m.booked,e=>e.plates).toLocaleString('en-IN')} ${T('plates')})</div></div></details>`).join('')}</div>
  <h2>📌 ${T('Your own dates')}</h2><div class="card"><div class="mut" style="margin-bottom:8px">${T('Add local jatre, temple utsava, college fests, office annual days, or holidays for other states.')}</div>
    ${can.admin()?`<div class="g2"><input id="cdd" type="date" value="${t}"><input id="cdn" placeholder="${T('e.g. Banashankari jatre')}"></div><button class="btn ghost w" onclick="addCustomDate()">+ ${T('Add date')}</button>`:''}
    ${(S.customDates||[]).filter(c=>c.date>=t).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,12).map(c=>`<div class="row" style="padding:5px 0"><span class="sp">📌 ${fd(c.date)} · ${esc(c.name)}</span>${can.admin()?`<span style="color:var(--out);cursor:pointer" onclick="delCustomDate('${c.id}')">✕</span>`:''}</div>`).join('')}</div>
  <div class="mut" style="margin:10px 2px 20px">${T('Muhurtha dates vary by family, mutt and community — use them for planning, not for fixing a wedding.')}</div>`}
function addCustomDate(){const d=$('#cdd').value,n=$('#cdn').value.trim();if(!d||!n){toast(T('Enter a date and a name'));return}S.customDates=[...(S.customDates||[]),{id:uid(),date:d,name:n}];save();render()}
function delCustomDate(id){S.customDates=(S.customDates||[]).filter(c=>c.id!==id);save();render()}
