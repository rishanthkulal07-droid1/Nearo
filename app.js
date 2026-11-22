/* Nearo - js/app.js
   CORE APP: finding handymen, booking, orders, handyman dashboard, profiles, material prices, quotes, OTP, payments, rewards and language switching.
   Load order in index.html: config, i18n, app, admin, studio, start. */
/* ===== APP CODE ===== */
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const load=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};
const store=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
/* admin-editable settings (saved by the admin console) */
const CFG=load("nearo.config",{});
const DEF={site:SITE_NAME,fee:QUICK_FEE,cats:CATEGORIES.slice()};
function applyCfg(){
  SITE_NAME=DEF.site;QUICK_FEE=DEF.fee;CATEGORIES=DEF.cats.slice();
  if(CFG.siteName)SITE_NAME=CFG.siteName;
  if(CFG.quickFee!=null)QUICK_FEE=Number(CFG.quickFee);
  if(CFG.categories&&CFG.categories.length)CATEGORIES=CFG.categories.slice();
  MATERIALS.forEach(m=>{if(m.base==null)m.base=m.p;const o=CFG.matPrices&&CFG.matPrices[m.name];m.p=o!=null?Number(o):m.base});
}
applyCfg();
let radius=10,lang=load("fixnear.lang","en"),role=null,uTab="find",pTab="requests",cat=CATEGORIES[0],hot=null,me={...DEFAULT_LOC},bookPro=null;
let myPro=null,B=load("fixnear.bookings",[]),cust={name:"",phone:""};
let proLoc=null;
const active=b=>b.status==="pending"||b.status==="accepted";
const isBusy=p=>!p.on||B.some(b=>b.proId===p.id&&active(b));
const digits=s=>String(s||"").replace(/\D/g,"").slice(-10);
const fmtPhone=s=>{const d=String(s||"").replace(/\D/g,"");return d.length===10?`+91 ${d.slice(0,5)} ${d.slice(5)}`:""};
document.addEventListener("input",e=>{const t=e.target;if(t&&t.hasAttribute&&t.hasAttribute("data-num")){const v=t.value.replace(/\D/g,"").slice(0,10);if(v!==t.value)t.value=v}});
const money=n=>CURRENCY+Number(n).toLocaleString("en-IN");
const fmtDate=d=>new Date(d+"T00:00").toLocaleDateString(({en:"en-IN",kn:"kn-IN",hi:"hi-IN"})[lang]||"en-IN",{weekday:"short",day:"numeric",month:"short"});
const saveB=()=>store("fixnear.bookings",B);
function toast(t){const e=$("toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2400)}

const jobsOf=(id,p)=>B.filter(b=>b.proId===id&&b.status==="completed").length+((p&&p.demoJobs)||0);
function allPros(){
  const out=CFG.showSamples===false?[]:SAMPLE.map((s,i)=>({...s,id:"s"+i,sample:true,jobs:s.years*7,d:Math.hypot(s.dx,s.dy)}));
  ACC.filter(a=>a.role==="pro"&&!a.suspended).forEach(a=>{
    const p=a.id===SID?myPro:load("fixnear.pro."+a.id,null);if(!p)return;
    const pl=a.id===SID?proLoc:(p.lat!=null?{lat:p.lat,lng:p.lng}:null);
    let dx=.5,dy=.5;
    if(pl){dy=(pl.lat-me.lat)*111.32;dx=(pl.lng-me.lng)*111.32*Math.cos(me.lat*Math.PI/180)}
    const id="p_"+a.id;const rr=ratingOf(id,p);out.push({...p,id,sample:false,rating:rr.count?+rr.avg.toFixed(1):null,reviews:rr.count,jobs:jobsOf(id,p),dx,dy,d:Math.hypot(dx,dy)});
  });
  return out.map(p=>({...p,busy:isBusy(p)}));
}
function visible(){
  const k=$("sort").value;
  return allPros().filter(p=>p.trade===cat&&p.d<=radius).sort((a,b)=>k==="p"?a.price-b.price:a.d-b.d);
}

/* ---------- navigation ---------- */
function tabsBase(){
  if(role===null)return[];
  if(role==="admin")return ADM_TABS.filter(t=>!t[2]||isSuper()).map(t=>[t[0],t[1],0]);
  if(role==="user")return[["find","Find a handyman",0],["orders","My orders",B.filter(b=>mineC(b)&&active(b)).length],["materials","Material prices",0],["uprofile","My profile",0]];
  if(!myPro)return[["profile","Set up profile",0]];
  return[["requests","Requests",B.filter(b=>b.proId===MYID&&b.status==="pending").length],["jobs","Jobs",0],["rewards","Rewards & earnings",0],["materials","Material prices",0],["profile","My profile",0]];
}
function render(){
  if(role===null)return;
  if(role==="pro"&&!myPro)pTab="profile";
  const cur=role==="admin"?admTab:role==="user"?uTab:pTab;
  $("annc").hidden=!CFG.announcement;$("anncTxt").textContent=CFG.announcement||"";
  const cx=String(cur).startsWith("x:");
  $("vAdmin").hidden=role!=="admin"||cx;$("vCustom").hidden=!cx;
  $("tabs").innerHTML=tabsFor().map(([k,l,n])=>`<button data-tab="${k}" ${k===cur?'aria-current="page"':""}>${l}${n?`<span class="badge">${n}</span>`:""}</button>`).join("");
  $("vFind").hidden=!(role==="user"&&uTab==="find");
  $("vOrders").hidden=!(role==="user"&&uTab==="orders");
  $("vDash").hidden=!(role==="pro"&&myPro&&(pTab==="requests"||pTab==="jobs"));
  $("vProfile").hidden=!(role==="pro"&&pTab==="profile");
  $("vUProfile").hidden=!(role==="user"&&uTab==="uprofile");
  $("vReward").hidden=!(role==="pro"&&myPro&&pTab==="rewards");
  $("vMat").hidden=!((role==="user"&&uTab==="materials")||(role==="pro"&&myPro&&pTab==="materials"));
  if(role==="admin"&&!cx)renderAdmin();
  if(!$("vFind").hidden)renderFind();
  if(!$("vOrders").hidden)renderOrders();
  if(!$("vDash").hidden)renderDash();
  if(!$("vProfile").hidden)renderProfile();
  if(!$("vUProfile").hidden)renderUProfile();
  if(!$("vReward").hidden)renderReward();
  if(!$("vMat").hidden)renderMat();
  if(cx)renderCustom(cur);
  emit("render");
}
$("tabs").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(!b)return;if(role==="admin")admTab=b.dataset.tab;else if(role==="user")uTab=b.dataset.tab;else pTab=b.dataset.tab;render();window.scrollTo(0,0)});

/* ---------- customer: find ---------- */
function cardHTML(p){
  const ini=p.name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return `<article class="card themed ${hot===p.id?"hot":""}" id="card-${p.id}" data-id="${p.id}" data-trade="${esc(p.trade)}">
   <div class="av" aria-hidden="true">${ICONS[p.trade]||esc(ini)}</div>
   <div><h3>${esc(p.name)} ${p.sample?'<span class="meta">(Sample)</span>':""}</h3>${certBadge(p.jobs,p.rating)}
    <div class="meta">${esc(p.trade)} · ${p.years||0} yrs · ${p.jobs||0} jobs${p.rating?` · ★ ${p.rating}${p.reviews?` (${p.reviews})`:""}`:(p.sample?"":" · New")} · ${p.d.toFixed(1)} km away</div>
    <div class="meta">${esc(p.about)}</div>
    <span class="tag ${p.busy?"busy":""}">${p.busy?"Busy":"Available now"}</span></div>
   <div class="acts"><div class="price">${money(p.price)}<div class="meta">minimum</div></div>
    <button class="btn" data-book="${p.id}" ${p.busy?"disabled":""}>${p.busy?"Busy right now":"Book now"}</button>
    <a class="btn ghost sm" href="tel:${esc(p.phone.replace(/[^+\d]/g,""))}">Call</a></div></article>`;
}
function renderFind(){
  $("chips").innerHTML=CATEGORIES.map(c=>`<button class="chip" aria-pressed="${c===cat}" data-c="${esc(c)}"><span aria-hidden="true">${ICONS[c]||ico('<circle cx="12" cy="12" r="8"/><path d="M9 12l2 2 4-4"/>')}</span>${esc(c)}</button>`).join("");
  const v=visible();
  $("listTitle").textContent=`${plural(cat)} within ${radius} km (${v.length})`;
  $("list").innerHTML=v.length?v.map(cardHTML).join(""):`<div class="empty">No ${esc(plural(cat).toLowerCase())} within ${radius} km yet. Try another trade or move your location.</div>`;
  const C=160,R=148,sc=R/radius;
  let s=`<circle class="pulse" cx="${C}" cy="${C}" r="14"><animate attributeName="r" values="10;24;10" dur="2.4s" repeatCount="indefinite"/></circle>`;
  [.25,.5,1].forEach(f=>s+=`<circle class="ring" cx="${C}" cy="${C}" r="${R*f}"/><text class="ringlbl" x="${C+4}" y="${C-R*f+11}">${+(radius*f).toFixed(1)} km</text>`);
  s+=`<circle class="me" cx="${C}" cy="${C}" r="7"/><text class="ringlbl" x="${C}" y="${C+22}" text-anchor="middle">You</text>`;
  v.forEach(p=>s+=`<g class="pin ${p.busy?"off":""} ${hot===p.id?"hot":""}" data-id="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)}, ${p.d.toFixed(1)} km"><circle cx="${C+p.dx*sc}" cy="${C-p.dy*sc}" r="9"/></g>`);
  $("map").innerHTML=s;
}
function setHot(id){hot=id;renderFind();const el=$("card-"+id);if(el)el.scrollIntoView({behavior:"smooth",block:"center"})}
$("chips").addEventListener("click",e=>{const b=e.target.closest("[data-c]");if(b){cat=b.dataset.c;hot=null;renderFind()}});
$("sort").addEventListener("change",renderFind);
$("map").addEventListener("click",e=>{const g=e.target.closest(".pin");if(g)setHot(g.dataset.id)});
$("map").addEventListener("keydown",e=>{const g=e.target.closest(".pin");if(g&&(e.key==="Enter"||e.key===" ")){e.preventDefault();setHot(g.dataset.id)}});
$("list").addEventListener("click",e=>{const c=e.target.closest(".card");if(c&&!e.target.closest("a,button"))setHot(c.dataset.id)});
function getLoc(ok,st,btn){
  if(!navigator.geolocation){st.textContent="Your browser can’t share location. Using the default area.";return}
  btn.disabled=true;st.textContent="Finding your location…";
  navigator.geolocation.getCurrentPosition(p=>{btn.disabled=false;ok({lat:p.coords.latitude,lng:p.coords.longitude})},
   ()=>{btn.disabled=false;st.textContent="Location is blocked. Allow location access in your browser settings and try again."},{enableHighAccuracy:true,timeout:10000});
}
$("locBtn").onclick=()=>getLoc(p=>{me=p;$("locStatus").textContent="Live location on. Showing handymen near you.";renderFind()},$("locStatus"),$("locBtn"));
$("locStatus").textContent="Showing the Bengaluru centre. Tap “Use my live location” for results near you.";

/* ---------- booking ---------- */
let bPhotoData="";
function toggleType(){$("whenRow").hidden=document.querySelector('input[name=bType]:checked').value==="quick"}
$("bookForm").addEventListener("change",e=>{if(e.target.name==="bType")toggleType()});
$("bPhoto").onchange=e=>{
  const f=e.target.files[0];bPhotoData="";$("bPrev").hidden=true;if(!f)return;
  const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{
    const k=Math.min(1,720/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=im.width*k;c.height=im.height*k;
    c.getContext("2d").drawImage(im,0,0,c.width,c.height);bPhotoData=c.toDataURL("image/jpeg",.65);$("bPrev").src=bPhotoData;$("bPrev").hidden=false};im.src=r.result};r.readAsDataURL(f)};
function openBook(id){
  const p=allPros().find(x=>x.id===id);if(!p||p.busy)return;
  bookPro=p;
  $("dlgSum").innerHTML=`<b>${esc(p.name)}</b> · ${esc(p.trade)}<div class="meta">Minimum charge ${money(p.price)}. The final price is agreed on site.</div>`;
  $("bName").value=cust.name||"";$("bPhone").value=digits(cust.phone);if(cust.addr)$("bAddr").value=cust.addr;$("bErr").textContent="";
  const mv=p.trade==="Moving assistance";
  document.querySelector("label[for=bNote]").textContent=mv?"What needs moving?":"What needs fixing?";
  $("bNote").setAttribute("placeholder",mv?"e.g. 2BHK home, 3rd floor, no lift":"e.g. Pipe under the kitchen sink is leaking");
  document.querySelector("input[name=bType][value=inspect]").checked=true;document.querySelector("input[name=bPay][value=online]").checked=true;toggleType();bPhotoData="";$("bPhoto").value="";$("bPrev").hidden=true;$("qfee").textContent=money(QUICK_FEE);
  const t=new Date().toISOString().slice(0,10);$("bDate").min=t;$("bDate").value=t;
  $("dlg").showModal();
}
$("bCancel").onclick=()=>$("dlg").close();
$("bookForm").addEventListener("submit",e=>{
  e.preventDefault();
  const name=$("bName").value.trim(),ph=fmtPhone($("bPhone").value),addr=$("bAddr").value.trim(),date=$("bDate").value,note=$("bNote").value.trim(),type=document.querySelector("input[name=bType]:checked").value;
  const err=!name?"Enter your name.":ph.replace(/\D/g,"").length<10?"Enter a 10-digit mobile number.":!addr?"Enter the address or area.":(!date&&type==="inspect")?"Choose a date.":!note?"Describe what needs fixing.":"";
  if(err){$("bErr").textContent=err;return}
  const p=bookPro;
  B.unshift({id:"b"+Date.now(),proId:p.id,proName:p.name,trade:p.trade,proPhone:p.phone,price:p.price,sample:p.sample,customer:true,uid:SID,
    name,cphone:ph,addr,type,pay:document.querySelector("input[name=bPay]:checked").value,otp:newOtp(),fee:type==="quick"?QUICK_FEE:0,photo:bPhotoData,date:type==="quick"?new Date().toISOString().slice(0,10):date,slot:type==="quick"?"Quick repair (within about 2 hours)":$("bSlot").value,note,status:"pending",created:Date.now()});
  saveB();cust={...cust,name,phone:digits(ph),addr:cust.addr||addr};store("fixnear.cust."+SID,cust);
  $("dlg").close();$("bNote").value="";$("bPhoto").value="";bPhotoData="";uTab="orders";render();toast("Request sent to "+p.name);
});

/* ---------- orders (customer) ---------- */
const statusLabel=b=>b.status==="cancelled"?"Cancelled by "+(b.by||"customer"):STATUS[b.status];
const whyHTML=b=>b.status==="cancelled"&&b.why?`<div class="meta">Reason: ${esc(b.why)}</div>`:"";
const canDone=b=>b.type==="quick"||(b.quote&&b.quote.status==="approved"); // inspection jobs need the customer to confirm the quote first
const typeTag=b=>`<div><span class="tag ${b.type==="quick"?"pending":"completed"}">${b.type==="quick"?TAGICO.zap+" Quick repair":TAGICO.search+" Inspection first"}</span></div>`;
const photoHTML=b=>b.photo?`<img class="ph" src="${b.photo}" alt="Photo of the problem">`:"";
const quoteHTML=b=>b.quote?`<div class="sum">Quote: <b>${money(b.quote.total)}</b> <span class="tag ${b.quote.status==="approved"?"":"pending"}">${b.quote.status==="approved"?"Order confirmed":"Awaiting confirmation"}</span><div class="meta">Materials ${money(b.quote.mat)} + labour ${money(b.quote.labour)}${b.quote.items.length?"<br>"+b.quote.items.map(i=>esc(i.qty+" × "+i.name)).join(", "):""}</div></div>`:"";
function orderHTML(b){
  return `<article class="card themed" data-trade="${esc(b.trade||"")}" style="grid-template-columns:1fr auto">
   <div><h3>${esc(b.proName)} ${b.sample?'<span class="meta">(Sample)</span>':""}</h3>
    <div class="meta">${esc(b.trade)} · ${fmtDate(b.date)}, ${esc(b.slot)}</div>
    <div class="meta">${esc(b.addr)} — “${esc(b.note)}”</div>${typeTag(b)}${whyHTML(b)}${photoHTML(b)}${quoteHTML(b)}${payTag(b)}${otpHTML(b)}${paidHTML(b)}${ratingHTML(b)}
    <span class="tag ${b.status}">${statusLabel(b)}</span></div>
   <div class="acts"><div class="price">${money(b.price)}<div class="meta">minimum${b.fee?` + ${money(b.fee)} priority fee`:""}</div></div>
    ${active(b)&&!(b.quote&&b.quote.status==="approved"&&false)?`<button class="btn bad sm" data-act="cancel" data-id="${b.id}">${b.status==="pending"?"Cancel request":"Cancel booking"}</button>`:""}
    ${b.status==="accepted"&&b.quote&&b.quote.status!=="approved"?`<button class="btn" data-act="confirm" data-id="${b.id}">Confirm order · ${money(b.quote.total)}</button>`:""}
    ${b.status==="accepted"?`<a class="btn ghost sm" href="tel:${esc(b.proPhone.replace(/[^+\d]/g,""))}">Call handyman</a>`:""}
    ${b.status==="completed"&&!b.rating?`<button class="btn sm" data-act="rate" data-id="${b.id}">Rate this handyman</button>`:""}
    ${!active(b)?`<button class="btn ghost sm" data-act="again" data-id="${b.id}">Book again</button>`:""}</div></article>`;
}
function renderOrders(){
  const mine=B.filter(mineC),a=mine.filter(active),p=mine.filter(b=>!active(b));
  $("ordersList").innerHTML=!mine.length?`<div class="empty">You haven’t booked anyone yet.<br><br><button class="btn" data-tab="find">Find a handyman</button></div>`:
   `<div class="listhead"><h2>Active (${a.length})</h2></div>${a.map(orderHTML).join("")||'<div class="empty">No active bookings.</div>'}
    <div class="listhead" style="margin-top:22px"><h2>Previously booked (${p.length})</h2></div>${p.map(orderHTML).join("")||'<div class="empty">Completed and cancelled bookings will appear here.</div>'}`;
}
$("ordersList").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b){uTab="find";render()}});

/* ---------- handyman dashboard ---------- */
function jobHTML(b){
  return `<article class="card themed" data-trade="${esc(b.trade||"")}" style="grid-template-columns:1fr auto">
   <div><h3>${esc(b.name)}</h3>
    <div class="meta">${fmtDate(b.date)}, ${esc(b.slot)}</div>
    <div class="meta">${esc(b.addr)}</div><div class="meta">“${esc(b.note)}”</div>${typeTag(b)}${whyHTML(b)}${photoHTML(b)}${quoteHTML(b)}${payTag(b)}${otpHTML(b)}${paidHTML(b)}${ratingHTML(b)}
    <span class="tag ${b.status}">${statusLabel(b)}</span></div>
   <div class="acts"><div class="price">${money(b.price)}<div class="meta">minimum${b.fee?` + ${money(b.fee)} priority fee`:""}</div></div>
    <a class="btn ghost sm" href="tel:${esc(b.cphone.replace(/[^+\d]/g,""))}">Call ${esc(b.cphone)}</a>
    ${b.status==="pending"?`<button class="btn sm" data-act="accept" data-id="${b.id}">Accept</button><button class="btn bad sm" data-act="decline" data-id="${b.id}">Decline</button>`:""}
    ${b.status==="accepted"?`${b.quote&&b.quote.status==="approved"?"":`<button class="btn ghost sm" data-act="quote" data-id="${b.id}">${b.quote?"Edit":"Add"} materials &amp; quote</button>`}<button class="btn sm" data-act="complete" data-id="${b.id}" ${canDone(b)?"":"disabled"}>Mark completed</button>${canDone(b)?"":`<div class="meta">Complete the job after the customer confirms your quote.</div>`}<button class="btn bad sm" data-act="cancel" data-id="${b.id}">Cancel job</button>`:""}</div></article>`;
}
function renderDash(){
  const m=B.filter(b=>b.proId===MYID),c=s=>m.filter(b=>b.status===s);
  $("dashTitle").textContent="Hello, "+myPro.name.split(" ")[0];
  $("availPanel").setAttribute("data-trade",myPro.trade);$("dashBadge").innerHTML=certBadge(myJobs(),ratingOf(MYID,myPro).avg)+`<span class="meta">${myJobs()} jobs</span>`+ratingLine(MYID);
  const act=m.some(active);$("availToggle").checked=!!myPro.on&&!act;$("availLbl").textContent=$("availToggle").checked?"Available":"Busy";
  $("availNote").textContent=m.some(active)?"You show as Busy to customers while you have an open booking.":myPro.on?"Customers can book you now.":"You show as Busy to customers.";
  $("stats").innerHTML=[["New requests",c("pending").length],["Confirmed jobs",c("accepted").length],["Completed",c("completed").length],["Minimum earned",money(c("completed").reduce((t,b)=>t+b.price,0))]].map(([l,v])=>`<div class="stat"><b>${v}</b><span class="meta">${l}</span></div>`).join("");
  const list=pTab==="requests"?c("pending"):[...c("accepted"),...c("completed"),...c("declined")];
  $("dashList").innerHTML=`<div class="listhead"><h2>${pTab==="requests"?"New booking requests":"Your jobs"}</h2></div>`+
   (list.length?list.map(jobHTML).join(""):`<div class="empty">${pTab==="requests"?"No new requests. Keep yourself available so customers can book you.":"Accepted and completed jobs will appear here."}</div>`);
}
$("availToggle").onchange=e=>{if(B.some(b=>b.proId===MYID&&active(b))){renderDash();toast("You have an open booking, so you stay Busy.");return}myPro.on=e.target.checked;store("fixnear.pro."+SID,myPro);renderDash()};
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-act]"),bk=e.target.closest("[data-book]");
  if(bk){openBook(bk.dataset.book);return}
  if(!b)return;
  const x=B.find(y=>y.id===b.dataset.id);if(!x)return;
  const a=b.dataset.act;
  if(a==="again"){openBook(x.proId);return}
  if(a==="cancel"){openCancel(x);return}
  if(a==="rate"){openRate(x);return}
  if(a==="quote"){openQuote(x);return}
  if(a==="confirm"){x.quote.status="approved";x.quote.approvedAt=Date.now();saveB();render();toast("Order confirmed");return}
  if(a==="complete"){if(!canDone(x)){toast("Wait for the customer to confirm the quote.");return}openOtp(x);return}
  x.status={accept:"accepted",decline:"declined",complete:"completed",cancel:"cancelled"}[a];
  if(x.proId===MYID&&myPro){
    if(a==="accept")myPro.on=false;                                   // accepted job: handyman is Busy automatically
    else if((a==="complete"||a==="cancel")&&!B.some(y=>y.proId===MYID&&active(y)))myPro.on=true; // back to Available when all jobs are done
    store("fixnear.pro."+SID,myPro);
  }
  saveB();render();toast(x.status==="accepted"?"Booking confirmed":x.status==="completed"?"Job completed":"Updated");
});
// Demo only: sample handymen confirm after ~6 s, send a quote after ~15 s, and finish ~12 s after you confirm the order.
setInterval(()=>{let ch=false;const now=Date.now();B.forEach(b=>{
  if(!b.sample)return;const age=now-b.created;
  if(b.status==="pending"&&age>6000){b.status="accepted";ch=true}
  else if(b.status==="accepted"){
    if(b.type==="quick"){if(age>40000){b.status="completed";ch=true}}
    else if(!b.quote&&age>15000){
      const g={Plumber:"Plumbing",Electrician:"Electrical",Painter:"Painting"}[b.trade],m=MATERIALS.find(x=>x.g===g),pr=m?price(m,cityFor(me)):0;
      b.quote={items:m?[{name:m.name,qty:1,price:pr}]:[],mat:pr,labour:b.price,total:pr+b.price,status:"sent"};ch=true}
    else if(b.quote&&b.quote.status==="approved"&&now-b.quote.approvedAt>12000){b.status="completed";ch=true}}});
  B.forEach(b=>{if(b.sample&&b.status==="completed"&&!b.paid){b.paid={...split(jobAmount(b)),method:b.pay||"online",at:now};ch=true}});
  if(ch){saveB();render()}},3000);

/* ---------- handyman profile ---------- */
function renderUProfile(){
  const mine=B.filter(mineC),nm=(cust.name||"").trim();
  $("uAv").textContent=nm?nm.split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase():"?";
  $("uNameShow").textContent=nm||"Your name";
  $("uPhoneShow").textContent=digits(cust.phone)?"+91 "+digits(cust.phone):"";
  $("uStats").innerHTML=[["Total bookings",mine.length],["Active",mine.filter(active).length],["Completed",mine.filter(b=>b.status==="completed").length]].map(([l,v])=>`<div class="stat"><b>${v}</b><span class="meta">${l}</span></div>`).join("");
  if(!$("uName").dataset.filled){$("uName").value=cust.name||"";$("uPhone").value=digits(cust.phone);$("uAddr").value=cust.addr||"";$("uName").dataset.filled="1"}
}
$("uForm").addEventListener("submit",e=>{
  e.preventDefault();const name=$("uName").value.trim(),ph=fmtPhone($("uPhone").value),addr=$("uAddr").value.trim();
  const err=!name?"Enter your name.":!ph?"Enter a 10-digit mobile number.":"";
  $("uErr").textContent=err;if(err)return;
  cust={name,phone:digits(ph),addr};store("fixnear.cust."+SID,cust);renderUProfile();toast("Details saved");
});
function renderProfile(){
  $("proForm").setAttribute("data-trade",myPro?myPro.trade:CATEGORIES[0]);
  $("profBadge").innerHTML=myPro?certBadge(myJobs(),ratingOf(MYID,myPro).avg)+`<span class="meta">${myJobs()} jobs</span>`+ratingLine(MYID):"";
  $("profTitle").textContent=myPro?"My profile":"Set up your handyman profile";
  $("pTrade").innerHTML=CATEGORIES.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
  if(myPro&&!$("pName").dataset.filled){
    $("pName").value=myPro.name;$("pPhone").value=digits(myPro.phone);$("pPrice").value=myPro.price;$("pYears").value=myPro.years;$("pAbout").value=myPro.about||"";$("pTrade").value=myPro.trade;$("pName").dataset.filled="1";
  }
}
$("pLocBtn").onclick=()=>getLoc(p=>{proLoc=p;$("pLocStatus").textContent="Work location set from your live location."},$("pLocStatus"),$("pLocBtn"));
$("proForm").addEventListener("submit",e=>{
  e.preventDefault();
  const name=$("pName").value.trim(),phone=fmtPhone($("pPhone").value),pv=$("pPrice").value,price=Number(pv);
  const err=!name?"Enter your full name.":phone.replace(/\D/g,"").length<10?"Enter a 10-digit mobile number.":(pv===""||price<0)?"Enter your minimum price in rupees.":"";
  $("pErr").textContent=err;if(err)return;
  const first=!myPro;
  myPro={name,phone,price,trade:$("pTrade").value,years:Number($("pYears").value)||0,about:$("pAbout").value.trim(),on:myPro?myPro.on:true,wallet:myPro&&myPro.wallet!=null?myPro.wallet:500,demoJobs:myPro?myPro.demoJobs||0:0,demoRate:myPro?myPro.demoRate||null:null,lat:proLoc?proLoc.lat:null,lng:proLoc?proLoc.lng:null};
  store("fixnear.pro."+SID,myPro);pTab="requests";render();toast(first?"Profile saved. Your dashboard is ready.":"Profile updated");
});

/* ---------- range ---------- */
function setRadius(v){radius=v;$("rng").value=v;$("rngVal").textContent=v+" km";renderFind()}
$("rng").oninput=e=>setRadius(+e.target.value);
$("rngQ").onclick=e=>{const b=e.target.closest("[data-r]");if(b)setRadius(+b.dataset.r)};

/* ---------- material prices ---------- */
let matG="All";
const cityFor=loc=>CITIES.reduce((a,c)=>((c.lat-loc.lat)**2+(c.lng-loc.lng)**2<(a.lat-loc.lat)**2+(a.lng-loc.lng)**2)?c:a);
const price=(m,city)=>Math.round(m.p*city.x/5)*5;
function renderMat(){
  const city=cityFor(role==="pro"&&proLoc?proLoc:me);
  $("matLead").textContent=`Indicative prices for ${city.n}, the nearest city to your location. Shop rates vary, so confirm the final amount with your handyman.`;
  $("matChips").innerHTML=["All","Plumbing","Electrical","Painting"].map(g=>`<button class="chip" data-g="${g}" aria-pressed="${g===matG}">${g}</button>`).join("");
  $("matGrid").innerHTML=MATERIALS.filter(m=>matG==="All"||m.g===matG).map(m=>`<div class="mat"><div class="im">${svg(m.k)}</div>${esc(m.name)}<b>${money(price(m,city))}</b><span class="meta">${m.g}</span></div>`).join("");
}
$("matChips").onclick=e=>{const b=e.target.closest("[data-g]");if(b){matG=b.dataset.g;renderMat()}};

/* ---------- materials quote (handyman) ---------- */
let qB=null;
function calcQ(){
  const city=cityFor(proLoc||me);let mat=0,items=[];
  document.querySelectorAll("[data-q]").forEach(i=>{const q=+i.value||0,m=MATERIALS[+i.dataset.q];if(q>0){const pr=price(m,city);mat+=pr*q;items.push({name:m.name,qty:q,price:pr})}});
  const labour=+$("qLab").value||0;
  $("qTot").innerHTML=`Materials ${money(mat)} + labour ${money(labour)} = <b>${money(mat+labour)}</b>`;
  return{items,mat,labour,total:mat+labour};
}
function openQuote(b){
  qB=b;const city=cityFor(proLoc||me);
  $("qFor").textContent=`For ${b.name}. Material prices for ${city.n}.`;
  $("qList").innerHTML=MATERIALS.map((m,i)=>{const old=b.quote?b.quote.items.find(x=>x.name===m.name):null;
    return `<div class="row" style="grid-template-columns:1fr 84px;align-items:center;margin:6px 0"><span>${esc(m.name)}<div class="meta">${money(price(m,city))} each</div></span><input type="number" min="0" value="${old?old.qty:0}" data-q="${i}" aria-label="Quantity of ${esc(m.name)}"></div>`}).join("");
  $("qLab").value=b.quote?b.quote.labour:b.price;calcQ();$("qdlg").showModal();
}
$("qdlg").addEventListener("input",calcQ);
$("qCancel").onclick=()=>$("qdlg").close();
$("qForm").addEventListener("submit",e=>{e.preventDefault();qB.quote={...calcQ(),status:"sent"};saveB();$("qdlg").close();render();toast("Quote sent to the customer")});

/* ---------- cancel (customer and handyman) ---------- */
let cB=null;
function openCancel(b){
  cB=b;const cu=role==="user";
  $("cInfo").textContent=(cu?b.proName:b.name)+" · "+fmtDate(b.date);
  $("cWhy").innerHTML=(cu?["Changed my mind","Found another handyman","Quote is too high","Problem is already fixed","Other"]:["Cannot reach on time","Too far away","Materials not available","Customer not reachable","Other"]).map(r=>`<option value="${r}">${r}</option>`).join("");
  $("cdlg").showModal();
}
$("cKeep").onclick=()=>$("cdlg").close();
$("cForm").addEventListener("submit",e=>{
  e.preventDefault();cB.status="cancelled";cB.by=role==="user"?"customer":"handyman";cB.why=$("cWhy").value;
  if(cB.proId===MYID&&myPro&&!B.some(y=>y.proId===MYID&&active(y))){myPro.on=true;store("fixnear.pro."+SID,myPro)} // free again when no open jobs
  saveB();$("cdlg").close();render();toast("Booking cancelled");
});
/* ---------- apply language to the page ---------- */
const SRC=new WeakMap(),ASRC=new WeakMap(),ATTRS=["placeholder","aria-label","title","alt"];
let applying=false;
function applyLang(){
  applying=true;
  document.documentElement.lang=lang;
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
  while((n=w.nextNode())){
    const par=n.parentNode;if(par&&par.closest&&par.closest("script,style"))continue;
    const r=SRC.get(n),src=(r&&n.data===r.out)?r.src:n.data,out=lang==="en"?src:tr(src);
    if(out!==n.data)n.data=out;
    SRC.set(n,{src,out});
  }
  document.querySelectorAll(ATTRS.map(a=>"["+a+"]").join(",")).forEach(el=>{
    const rec=ASRC.get(el)||{};
    ATTRS.forEach(a=>{
      if(!el.hasAttribute(a))return;const cur=el.getAttribute(a),r=rec[a],src=(r&&cur===r.out)?r.src:cur,out=lang==="en"?src:tr(src);
      if(out!==cur)el.setAttribute(a,out);rec[a]={src,out};
    });
    ASRC.set(el,rec);
  });
  document.title=lang==="en"?"Nearo – book handymen near you":tr("Nearo – book handymen near you");
  document.querySelectorAll(".langsw [data-lang]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.lang===lang)));
  obs.takeRecords();applying=false;
}
let pend=false;
const obs=new MutationObserver(()=>{if(applying||pend)return;pend=true;requestAnimationFrame(()=>{pend=false;applyLang()})});
obs.observe(document.body,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:ATTRS});
function setLang(l){lang=l;store("fixnear.lang",l);render();applyLang()}
document.querySelector(".langsw").addEventListener("click",e=>{const b=e.target.closest("[data-lang]");if(b)setLang(b.dataset.lang)});

/* ---------- OTP, payments, rewards ---------- */
const SPLIT={bank:88,sav:7,fee:5},WALLET_MAX=500,BONUS=1000;   // 88% bank, 7% savings, 5% platform fee
const newOtp=()=>String(1000+crypto.getRandomValues(new Uint16Array(1))[0]%9000);
const jobAmount=b=>(b.quote?b.quote.total:b.price)+(b.fee||0);
function split(a){const fee=Math.round(a*SPLIT.fee/100),sav=Math.round(a*SPLIT.sav/100);return{amount:a,fee,sav,bank:a-fee-sav}}
const walletOf=()=>myPro&&myPro.wallet!=null?myPro.wallet:WALLET_MAX;
function myJobs(){return jobsOf(MYID,myPro)}
function ratingOf(id,p){
  const rs=B.filter(b=>b.proId===id&&b.rating).map(b=>b.rating.stars);
  let sum=rs.reduce((t,x)=>t+x,0),count=rs.length;
  if(p&&p.demoRate){sum+=p.demoRate.sum;count+=p.demoRate.n}
  return{avg:count?sum/count:0,count};
}
const tier=(n,avg)=>{if(!(avg>BADGE_MIN_RATING))return 0;let t=0;BADGE_TIERS.forEach(([j,k])=>{if(n>=j)t=k});return t};   // badge needs enough jobs AND a rating above BADGE_MIN_RATING
const starsHTML=x=>`<span class="stars" style="--r:${(Math.max(0,Math.min(5,x))/5*100).toFixed(0)}%" role="img" aria-label="${(+x).toFixed(1).replace(".0","")} out of 5">★★★★★</span>`;
const ratingHTML=b=>b.rating?`<div class="rev">${starsHTML(b.rating.stars)} <span class="meta">${b.rating.stars}/5</span>${b.rating.comment?`<div class="meta">“${esc(b.rating.comment)}”</div>`:""}</div>`:"";
const ratingLine=id=>{const r=ratingOf(id,myPro);return r.count?`${starsHTML(r.avg)}<span class="meta">${r.avg.toFixed(1)} (${r.count})</span>`:""};
const SHIELD='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>';
const badgeEl=(t,title)=>`<span class="cert t${t}" title="${esc(title||"")}">${SHIELD}Certified Partner</span>`;
const certBadge=(n,avg)=>{const t=tier(n,avg);return t?badgeEl(t,`${n} jobs · ★ ${(+avg).toFixed(1)}`):""};
const payTag=b=>`<div><span class="tag ${b.pay==="cash"?"pending":"completed"}">${b.pay==="cash"?"Cash payment":"Online payment"}</span></div>`;
const otpHTML=b=>(role==="user"&&b.status==="accepted"&&b.otp)?`<div class="otp"><div class="meta">Completion OTP</div><b>${esc(b.otp)}</b><div class="meta">Share this code with the handyman only after the work is finished.</div></div>`:"";
const paidHTML=b=>b.paid?`<div class="meta">Paid ${money(b.paid.amount)}</div>`:"";
const pr=(l,v)=>`<div class="pr"><span>${l}</span><b>${money(v)}</b></div>`;

let oB=null;
function openOtp(b){
  if(!b.otp){b.otp=newOtp();saveB()}
  oB=b;const s=split(jobAmount(b)),cash=b.pay==="cash";
  $("oInfo").textContent=b.name+" · "+money(s.amount);
  $("oPay").innerHTML=cash?pr("Cash you collect",s.amount)+pr("Deducted from your wallet",s.sav+s.fee):pr("Job amount",s.amount)+pr("To your bank (88%)",s.bank)+pr("To your savings (7%)",s.sav)+pr("Platform fee (5%)",s.fee);
  $("oIn").value="";$("oErr").textContent="";$("odlg").showModal();
}
$("oCancel").onclick=()=>$("odlg").close();
$("oForm").addEventListener("submit",e=>{
  e.preventDefault();
  const b=oB,s=split(jobAmount(b)),cash=b.pay==="cash",cut=s.sav+s.fee,v=$("oIn").value;
  const say=t=>{$("oErr").textContent=t};
  if(!/^\d{4}$/.test(v))return say("Enter the 4-digit OTP.");
  if((b.tries||0)>=5)return say("Too many wrong tries. Please contact support.");
  if(cash&&walletOf()<cut)return say(`Your wallet has ${money(walletOf())} but this cash job needs ${money(cut)}. Top up to continue.`);
  if(v!==b.otp){b.tries=(b.tries||0)+1;saveB();return say("Wrong OTP. Ask the customer for the code shown in their app.")}
  const jb=jobsOf(MYID,null);b.status="completed";b.paid={...s,method:cash?"cash":"online",at:Date.now()};
  if(cash)myPro.wallet=walletOf()-cut;
  if(!B.some(y=>y.proId===MYID&&active(y)))myPro.on=true;
  store("fixnear.pro."+SID,myPro);saveB();$("odlg").close();render();const hit=BONUS_STEPS.find(([j])=>j>jb&&j<=jb+1);toast(hit?`Job completed. Bonus of ${money(hit[1])} added to your savings.`:"Job completed. Payment settled.");
});

const CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';
const BADGE_NAMES={1:"Green badge",2:"Blue-silver badge",3:"Gold badge"};
function renderReward(){
  const n=myJobs(),real=jobsOf(MYID,null),rr=ratingOf(MYID,myPro),t=tier(n,rr.avg);
  const m=B.filter(b=>b.proId===MYID&&b.status==="completed"&&b.paid);
  let bank=0,cash=0,sav=0,fee=0,bonus=0;m.forEach(b=>{if(b.paid.method==="cash")cash+=b.paid.amount;else bank+=b.paid.bank;sav+=b.paid.sav;fee+=b.paid.fee});
  BONUS_STEPS.forEach(([j,r])=>{if(real>=j)bonus+=r});sav+=bonus;
  const nb=BONUS_STEPS.find(([j])=>n<j);
  $("rwTop").setAttribute("data-trade",myPro.trade);
  $("rwTop").innerHTML=`<div class="jobsbig"><b>${n}</b><span class="meta">Jobs completed</span></div><div>${certBadge(n,rr.avg)}<div>${ratingLine(MYID)}</div><div class="pbar"><i style="width:${Math.min(100,n)}%"></i></div><div class="meta">${nb?`${nb[0]-n} more jobs to your next bonus of ${money(nb[1])}`:"All bonuses unlocked"}</div></div>`;
  $("rwTree").innerHTML=BONUS_STEPS.map(([k,r])=>{const ok=n>=k;
    return `<li class="node ${ok?"ok":""}"><span class="dot">${ok?CHECK:""}</span><div><b>${k} jobs</b> <span class="tag ${ok?"":"busy"}">${ok?"Unlocked":"Locked"}</span><div class="meta">${money(r)} bonus added to your savings</div></div></li>`}).join("");
  const w=walletOf(),revs=B.filter(b=>b.proId===MYID&&b.rating).sort((x,y)=>y.rating.at-x.rating.at).slice(0,5);
  $("rwBody").innerHTML=`<div class="stats">${[["Paid to your bank",bank],["Cash collected",cash],["Savings (Digital Gold or bank)",sav],["Platform fees",fee],["Milestone bonuses",bonus]].map(([l,v])=>`<div class="stat"><b>${money(v)}</b><span class="meta">${l}</span></div>`).join("")}</div>
   <div class="panel" style="margin-bottom:14px"><h2 style="margin-bottom:8px">Certified Partner badges</h2><p class="meta" style="margin:0 0 10px">Badges need an average rating above ${BADGE_MIN_RATING} stars.</p>
    ${BADGE_TIERS.map(([j,k])=>{const ok=t>=k;return `<div class="pr" style="align-items:center"><span>${badgeEl(k,"")}<span class="meta" style="display:block">${j} jobs and an average rating above ${BADGE_MIN_RATING}</span></span><span class="tag ${ok?"":"busy"}">${ok?"Unlocked":"Locked"}</span></div>`}).join("")}</div>
   <div class="panel" style="margin-bottom:14px"><h2 style="margin-bottom:8px">Your rating</h2>${rr.count?`<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><b style="font-size:1.8rem">${rr.avg.toFixed(1)}</b>${starsHTML(rr.avg)}<span class="meta">from ${rr.count} ${rr.count===1?"review":"reviews"}</span></div>`:`<div class="meta">No reviews yet.</div>`}
    ${revs.length?`<div class="meta" style="margin:10px 0 4px;font-weight:600">Recent reviews</div>`+revs.map(b=>`<div class="rev">${starsHTML(b.rating.stars)} <span class="meta">${esc((b.name||"").split(" ")[0])}</span>${b.rating.comment?`<div class="meta">“${esc(b.rating.comment)}”</div>`:""}</div>`).join(""):""}</div>
   <div class="panel avail" style="margin-bottom:14px"><div><b>Prepaid wallet</b><div style="font-size:1.6rem;font-weight:700">${money(w)}</div><div class="meta">Maximum ${money(WALLET_MAX)}</div></div><button class="btn" data-rw="top" ${w>=WALLET_MAX?"disabled":""}>Top up to ₹500</button></div>
   <div class="panel" style="margin-bottom:14px"><h2 style="margin-bottom:8px">How every payment is split</h2><ul class="split" style="margin:0;padding-left:20px"><li>88% goes straight to your bank account.</li><li>7% is saved in a Digital Gold or bank savings account in your name.</li><li>5% is the Nearo platform fee.</li><li>Cash jobs: you keep the cash and 12% (savings 7% + fee 5%) is deducted from your wallet.</li></ul></div>
   <div class="panel"><button class="btn ghost sm" data-rw="demo">Demo: add 10 completed jobs (5★)</button><p class="meta" style="margin:8px 0 0">For preview only. Demo jobs don’t add money.</p><p class="meta" style="margin:8px 0 0">Demo only: no real money moves until a licensed payment gateway is connected.</p></div>`;
}
/* ---------- reviews: stars and comments ---------- */
let rB=null,rStars=0;
const RWORDS=["Poor","Fair","Good","Very good","Excellent"];
function rPaint(){document.querySelectorAll("#rStars .star").forEach(b=>{b.classList.toggle("on",+b.dataset.s<=rStars);b.setAttribute("aria-checked",String(+b.dataset.s===rStars))});$("rWord").textContent=rStars?RWORDS[rStars-1]:""}
function openRate(b){rB=b;rStars=0;$("rInfo").textContent=b.proName+" · "+b.trade;$("rTxt").value="";$("rErr").textContent="";rPaint();$("rdlg").showModal()}
$("rStars").addEventListener("click",e=>{const s=e.target.closest(".star");if(s){rStars=+s.dataset.s;rPaint()}});
$("rStars").addEventListener("keydown",e=>{
  if(e.key==="ArrowRight"||e.key==="ArrowUp"){e.preventDefault();rStars=Math.min(5,rStars+1);rPaint()}
  if(e.key==="ArrowLeft"||e.key==="ArrowDown"){e.preventDefault();rStars=Math.max(1,rStars-1);rPaint()}
});
$("rCancel").onclick=()=>$("rdlg").close();
$("rForm").addEventListener("submit",e=>{
  e.preventDefault();if(!rStars){$("rErr").textContent="Please choose a star rating.";return}
  rB.rating={stars:rStars,comment:$("rTxt").value.trim().slice(0,300),at:Date.now()};saveB();$("rdlg").close();render();toast("Thanks for your review");
});
$("vReward").addEventListener("click",e=>{
  const b=e.target.closest("[data-rw]");if(!b||!myPro)return;
  if(b.dataset.rw==="top"){myPro.wallet=WALLET_MAX;toast("Wallet topped up")}else{myPro.demoJobs=(myPro.demoJobs||0)+10;const d=myPro.demoRate||{n:0,sum:0};myPro.demoRate={n:d.n+10,sum:d.sum+50}}
  store("fixnear.pro."+SID,myPro);renderReward();
});
$("pTrade").addEventListener("change",()=>$("proForm").setAttribute("data-trade",$("pTrade").value));

