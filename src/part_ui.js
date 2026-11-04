/* ================= UI kit (Kosha v2 icons, tiles, avatars) ================= */
const P={
  home:'<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
  ledger:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  assets:'<path d="M3 10l9-6 9 6"/><path d="M5 10v9M19 10v9M9 10v9M15 10v9M3 21h18"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  wallet:'<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h13a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H3"/><path d="M6 6l9-3 1 3"/>',
  users:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="7" r="2.5"/><path d="M16 14c2.8 0 5 2.2 5 5"/>',
  bank:'<path d="M3 10l9-6 9 6H3z"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  house:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
  car:'<path d="M5 16V12l2-5h10l2 5v4"/><path d="M3 16h18v3h-3v-1H6v1H3z"/><circle cx="7.5" cy="13.5" r=".8" fill="currentColor"/><circle cx="16.5" cy="13.5" r=".8" fill="currentColor"/>',
  truck:'<path d="M2.5 6h11v10h-11z"/><path d="M13.5 9.5h4l3 3.5v3h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  shield:'<path d="M12 3l7 3v5c0 4.5-3 8.1-7 10-4-1.9-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  repeat:'<path d="M4 12a7 7 0 0 1 12-5l2 2"/><path d="M18 4v5h-5"/><path d="M20 12a7 7 0 0 1-12 5l-2-2"/><path d="M6 20v-5h5"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
  income:'<path d="M17 7L7 17"/><path d="M7 9v8h8"/>',
  expense:'<path d="M7 17L17 7"/><path d="M9 7h8v8"/>',
  pie:'<path d="M12 3v9h9a9 9 0 1 1-9-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
  scan:'<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M8 10h8M8 14h5"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  lock:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  chevR:'<path d="M9 6l6 6-6 6"/>',chevL:'<path d="M15 6l-6 6 6 6"/>',chevD:'<path d="M6 9l6 6 6-6"/>',
  cart:'<path d="M3 4h2l2.4 11h10.8L20.5 8H7"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
  wrench:'<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 0-2-2z"/>',
  handcoin:'<circle cx="15.5" cy="7.5" r="3.5"/><path d="M2 15h3l3 2h5a1.5 1.5 0 0 0 0-3h-3"/><path d="M5 15v5M13 17l5.5-2.2a1.6 1.6 0 0 1 1.3 2.9L13 21H5"/>',
  list:'<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  check:'<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
  event:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  fuel:'<rect x="4" y="3" width="10" height="18" rx="1.5"/><path d="M4 9h10M14 8l4 3v7a1.5 1.5 0 0 0 3 0v-9l-3-3"/>',
  bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  food:'<path d="M5 3v8a2 2 0 0 0 4 0V3M7 11v10M16 3c-2 1.5-3 4-3 7h3v11"/>',
  leaf:'<path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15z"/><path d="M5 19l8-8"/>',
  milk:'<path d="M8 3h8v3l2 4v11H6V10l2-4z"/><path d="M6 13h12"/>',
  fish:'<path d="M3 12c3-4 8-5 12-3l5-3v12l-5-3c-4 2-9 1-12-3z"/><circle cx="8" cy="11" r=".8" fill="currentColor"/>',
  flame:'<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 3 2.5 3 4"/>',
  chef:'<path d="M7 14a4 4 0 1 1 2-7.5A4 4 0 0 1 16 7a3.5 3.5 0 1 1 1 7z"/><path d="M7 14v6h10v-6"/>',
  pot:'<path d="M4 10h16v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M2 10h20M9 10V8a3 3 0 0 1 6 0v2"/>',
  box:'<path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/>',
  party:'<path d="M4 20l5-14 9 9z"/><path d="M14 4l1 2M19 5l-2 2M20 10h-2"/>',
  cash:'<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/>',
  briefcase:'<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5h6v2M3 12h18"/>',
  grid:'<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  store:'<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5 11v9h14v-9"/>',
  person:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  logout:'<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 16l-4-4 4-4M6 12h10"/>'
};
function ico(name,size){const s=size||22;return `<svg class="v2i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name]||P.tag}</svg>`}
const TONES={amber:"#f29a1d",green:"#1f9d55",red:"#e5484d",blue:"#2f7fe0",purple:"#8b5cf6",teal:"#0ea5a4",pink:"#e0457b",orange:"#f97316",slate:"#64748b",indigo:"#5b6ee1",brown:"#a16207"};
function tile(name,tone,extra){const c=TONES[tone]||tone||TONES.amber;return `<span class="tile ${extra||''}" style="--tc:${c}">${P[name]?ico(name,extra&&extra.includes('sm')?18:20):esc(name)}</span>`}
const AVC=['#f29a1d','#2f7fe0','#1f9d55','#8b5cf6','#e0457b','#0ea5a4','#f97316','#5b6ee1','#a16207','#e5484d'];
function brandColor(n){let h=0;String(n||'?').split('').forEach(c=>h=(h*31+c.charCodeAt(0))>>>0);return AVC[h%AVC.length]}
function ava(name,extra,color){return `<span class="ava ${extra||''}" style="--tc:${color||brandColor(name)}">${esc(String(name||'?').trim().charAt(0).toUpperCase()||'?')}</span>`}
const CAT_ICON={'Groceries':['cart','green'],'Vegetables':['leaf','green'],'Meat & fish':['fish','red'],'Milk & dairy':['milk','blue'],'Gas / fuel':['flame','orange'],'Cook & helpers':['chef','purple'],'Serving staff':['users','indigo'],'Salaries':['briefcase','slate'],'Vehicle fuel':['fuel','brown'],'Vehicle repair':['wrench','slate'],'Transport hire':['truck','purple'],'Vessels / rental':['pot','amber'],'Packing & disposables':['box','teal'],'Decoration':['party','pink'],'Rent':['house','brown'],'Electricity':['bolt','blue'],'Other':['receipt','slate']};
function catTile(id,extra){const m=CAT_ICON[id];return m?tile(m[0],m[1],extra):`<span class="tile ${extra||''}" style="--tc:${TONES.amber}">${catIcon(id)}</span>`}
const ITEM_TILE={'Grains & pulses':['cart','amber'],'Oil & ghee':['milk','orange'],'Spices & masala':['flame','red'],'Vegetables':['leaf','green'],'Dairy':['milk','blue'],'Gas & fuel':['flame','orange'],'Disposables':['box','teal'],'Cleaning':['repeat','indigo'],'Other':['box','slate']};
const itemTile=c=>{const m=ITEM_TILE[c]||ITEM_TILE.Other;return tile(m[0],m[1])};
const NAV_ICON={home:'home',events:'calendar',ledger:'ledger',ins:'pie',assets:'shield',data:'grid'};
const heroArt=`<svg class="hero-art" viewBox="0 0 220 130" aria-hidden="true">
  <circle cx="186" cy="26" r="16" fill="#ffc163" opacity=".9"/>
  <path d="M0 104 C40 86 80 92 120 100 C160 88 196 90 220 96 V130 H0z" fill="#bfe0a6"/>
  <path d="M30 118 C70 104 120 110 220 112 V130 H0 V122z" fill="#8fcb7a"/>
  <g transform="translate(86 14) scale(.92)">
    <path d="M10 36 h76 v10 a26 26 0 0 1 -26 26 h-24 a26 26 0 0 1 -26 -26z" fill="#c9822f"/>
    <path d="M10 36 h76 v6 h-76z" fill="#e8a14a"/>
    <rect x="4" y="32" width="88" height="7" rx="3.5" fill="#a8641f"/>
    <path d="M0 40 q-6 2 -4 8 q4 2 8 -2" fill="none" stroke="#a8641f" stroke-width="4" stroke-linecap="round"/>
    <path d="M96 40 q6 2 4 8 q-4 2 -8 -2" fill="none" stroke="#a8641f" stroke-width="4" stroke-linecap="round"/>
    <g fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".95"><path d="M30 26 c-6 -6 6 -10 0 -18"/><path d="M48 24 c-6 -6 6 -10 0 -18"/><path d="M66 26 c-6 -6 6 -10 0 -18"/></g>
  </g>
  <path d="M14 112 c10 -22 34 -30 58 -24 c-14 8 -30 18 -40 30z" fill="#4f9d4f"/><path d="M20 112 c14 -10 30 -18 46 -22" stroke="#d6edc4" stroke-width="1.5" fill="none"/>
  <g fill="#5fae5f"><circle cx="200" cy="96" r="9"/><circle cx="208" cy="102" r="7"/><rect x="202" y="102" width="3" height="12" fill="#8a5a3b"/></g>
  <g fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".9"><path d="M26 30c6-5 12-5 18 0M42 22c4-3 8-3 12 0"/></g></svg>`;
/* Kosha-style list sheet */
function sheetList(title,items){sheet(`<h3>${title}</h3><div>${items.map((it,i)=>`<button class="sheet-row" data-i="${i}">${it.tile||''}<span class="sp"><b>${esc(it.label)}</b>${it.sub?`<small>${esc(it.sub)}</small>`:''}</span>${ico('chevR',18)}</button>`).join('')}</div>`);
  document.querySelectorAll('.sheet .sheet-row').forEach(b=>b.onclick=()=>{close();items[+b.dataset.i].run()})}
function addSheet(){const L=[{label:T('New order'),sub:T('Enquiry or confirmed event'),tile:tile('calendar','amber'),run:()=>evForm()},
  {label:T('Expense'),sub:T('Bill, purchase, fuel, wages'),tile:tile('expense','red'),run:()=>expForm()},
  {label:T('Scan bill'),sub:T('Photo or PDF — fills items for you'),tile:tile('scan','green'),run:()=>scanPick()},
  {label:T('Mark attendance'),sub:T('Workers and groups, one day or a range'),tile:tile('users','purple'),run:()=>attendForm()},
  {label:T('Add work'),sub:T('Task for the team'),tile:tile('check','teal'),run:()=>workForm()},
  {label:T('Add customer'),tile:tile('person','blue'),run:()=>custForm()}];
  const ctx=fabAction();if(page||!['home','events','ledger'].includes(tab)){const lab={assets:assetTab==='assets'?'Add asset':'Add licence / policy',data:{customers:'Add customer',workers:'Add worker',vendors:'Add vendor',vehicles:'Add vehicle',stock:'Add item'}[dataTab]}[tab];if(ctx&&lab)L.unshift({label:T(lab),tile:tile('plus','amber'),run:ctx})}
  sheetList(T('Add entry'),L)}
/* theme */
const THK='caterbook.theme';
function applyTheme(){const t=localStorage.getItem(THK)||'auto';if(t==='auto')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',t)}
function setTheme(t){try{localStorage.setItem(THK,t)}catch(e){}applyTheme();render()}
applyTheme();
