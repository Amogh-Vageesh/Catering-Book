/* ================= INSIGHTS: tap to open/hide + export ================= */
const CK='caterbook.collapsed';
let COLL;try{COLL=new Set(JSON.parse(localStorage.getItem(CK)||'[]'))}catch(e){COLL=new Set()}
const saveColl=()=>{try{localStorage.setItem(CK,JSON.stringify([...COLL]))}catch(e){}};
const secKey=t=>insTab+'|'+t.replace(/^[^\wಀ-೿]+/,'').trim();
function makeSections(){const box=$('#insbody');if(!box)return;const kids=[...box.childNodes].filter(n=>n.nodeType===1);if(!kids.length)return;
  const groups=[];let cur={title:T('Summary'),els:[]};
  kids.forEach(el=>{if(el.tagName==='H2'){if(cur.els.length||cur.h)groups.push(cur);cur={title:el.textContent,h:el,els:[]}}else cur.els.push(el)});groups.push(cur);
  box.innerHTML='';groups.filter(g=>g.els.length).forEach(g=>{const k=secKey(g.title);const sec=document.createElement('div');sec.className='sect'+(COLL.has(k)?' shut':'');sec.dataset.k=k;
    const h=document.createElement('h2');h.className='sh';h.innerHTML=`<span class="sp">${esc(g.title)}</span><span class="chev">▾</span>`;h.onclick=()=>{sec.classList.toggle('shut');sec.classList.contains('shut')?COLL.add(k):COLL.delete(k);saveColl()};
    const b=document.createElement('div');b.className='sb';g.els.forEach(e=>b.appendChild(e));sec.append(h,b);box.appendChild(sec)})}
function allSections(open){document.querySelectorAll('#insbody .sect').forEach(s=>{s.classList.toggle('shut',!open);open?COLL.delete(s.dataset.k):COLL.add(s.dataset.k)});saveColl()}
function insToolbar(){return `<div class="row" style="gap:6px;margin:-2px 0 10px"><button class="chip" onclick="allSections(true)">▾ ${T('Expand all')}</button><button class="chip" onclick="allSections(false)">▸ ${T('Collapse all')}</button><span class="sp"></span><button class="btn sm" onclick="exportMenu()">📤 ${T('Export')}</button></div>`}
/* read whatever is on screen into rows, section by section */
function cellText(el){return el.textContent.replace(/\s+/g,' ').trim()}
function rowsFrom(el,out){if(!el||el.nodeType!==1||el.tagName==='SVG'||el.tagName==='svg'||el.tagName==='BUTTON'||el.tagName==='INPUT'&&false)return;
  if(el.classList.contains('kpi')){const parts=[...el.children].map(cellText).filter(Boolean);out.push(parts);return}
  if(el.tagName==='TABLE'){el.querySelectorAll('tr').forEach(tr=>out.push([...tr.children].map(cellText)));return}
  if(el.classList.contains('alert')){out.push([cellText(el)]);return}
  if(el.classList.contains('row')&&!el.querySelector('.row')){const c=[...el.children].filter(x=>x.tagName!=='svg'&&x.tagName!=='SVG').map(x=>x.tagName==='INPUT'?x.value+'%':cellText(x)).filter(Boolean);if(c.length)out.push(c);return}
  if(el.classList.contains('item')){const t=el.querySelector('.t1'),m=el.querySelector('.mut'),a=el.querySelector('.amt');out.push([t&&cellText(t),m&&cellText(m),a&&cellText(a)].filter(Boolean));return}
  if(el.classList.contains('empty')){out.push([cellText(el)]);return}
  if(el.tagName==='DETAILS'){out.push([cellText(el.querySelector('summary'))]);[...el.querySelectorAll(':scope > div > div')].forEach(d=>out.push(['  '+cellText(d)]));return}
  [...el.children].forEach(c=>rowsFrom(c,out));
  if(!el.children.length&&el.classList.contains('mut')&&cellText(el))out.push([cellText(el)])}
function insSnapshot(){const tabs={overview:'Overview',activity:'Activity',prices:'Prices & margin',seasons:'Seasons',orders:'Orders',costs:'Costs',customers:'Customers',staff:'Staff',cash:'Cash flow',tax:'Tax'};
  const per=insTab==='cash'?T('Next 3 months'):insTab==='seasons'?String(seasonYear()):period(insTab==='tax'?TP:IP).label;
  const secs=[...document.querySelectorAll('#insbody .sect')].map(s=>{const rows=[];rowsFrom(s.querySelector('.sb'),rows);return{title:s.querySelector('.sh .sp').textContent,rows:rows.filter(r=>r.length)}});
  return{title:`${S.biz} — ${T(tabs[insTab])} — ${per}`,tab:T(tabs[insTab]),per,secs}}
function exportMenu(){sheet(`<h3>📤 ${T('Export')} — ${esc(insSnapshot().title)}</h3>
  <button class="btn w" onclick="exportXls()">📊 ${T('Excel file')}</button>
  <button class="btn ghost w" onclick="exportShare()">💬 ${T('Share as text (WhatsApp etc.)')}</button>
  <button class="btn ghost w" onclick="exportPrint()">🖨️ ${T('Print / save as PDF')}</button>
  <div class="mut" style="margin-top:10px">${T('Exports everything on this tab for the selected period, including hidden sections.')}</div>`)}
function exportXls(){const s=insSnapshot();const rows=[[s.title],['Exported',new Date().toLocaleString('en-IN')],[]];
  s.secs.forEach(sec=>{rows.push([sec.title.toUpperCase()]);sec.rows.forEach(r=>rows.push(r.map(c=>{const n=String(c).replace(/[₹,%\s]/g,'');return /^-?\d+(\.\d+)?$/.test(n)&&!/[a-z]/i.test(c)?+n:c})));rows.push([])});
  const xml=`<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="h"><Font ss:Bold="1"/></Style></Styles>${xmlSheet(s.tab.slice(0,30),rows)}</Workbook>`;
  dl(`${S.biz.replace(/\W+/g,'-')}-${s.tab.replace(/\W+/g,'-')}-${s.per.replace(/\W+/g,'-')}.xls`,xml,'application/vnd.ms-excel');close()}
function exportText(){const s=insSnapshot();return `*${s.title}*\n`+s.secs.map(sec=>`\n_${sec.title}_\n`+sec.rows.slice(0,25).map(r=>'• '+r.join(' · ')).join('\n')).join('\n')}
async function exportShare(){const t=exportText();close();
  if(window.AndroidBridge&&AndroidBridge.shareText){try{AndroidBridge.shareText(t);return}catch(e){}}
  if(navigator.share){try{await navigator.share({text:t});return}catch(e){}}
  try{await navigator.clipboard.writeText(t);toast(T('Copied — paste in WhatsApp'))}catch(e){window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank')}}
function exportPrint(){close();const shut=[...document.querySelectorAll('#insbody .sect.shut')];shut.forEach(s=>s.classList.remove('shut'));
  const h=document.createElement('div');h.id='printhead';h.innerHTML=`<h1 style="font-size:18px;margin:0 0 4px">${esc(insSnapshot().title)}</h1><div class="mut">${new Date().toLocaleString(loc())}</div>`;$('#main').prepend(h);
  setTimeout(()=>{if(window.AndroidBridge&&AndroidBridge.print){try{AndroidBridge.print();}catch(e){window.print()}}else window.print();h.remove();shut.forEach(s=>s.classList.add('shut'))},100)}
