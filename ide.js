/* Nearo - js/ide.js
   SOURCE FILES editor (Admin > Code studio > Source files): every file of the app in a VS Code style editor.
   - Colour-coded code (keywords, strings, comments, tags...) and a status bar: green = code is valid, amber = format
     warnings, red = error with the line number. Code with errors is never applied.
   - Valid changes are applied in real time: CSS instantly, JavaScript / HTML by reloading the app (can be switched off).
   - Upload files or a whole .zip, add new files, download everything as a .zip, reset a file or everything.
   Edits are stored in the browser (key "nearo.src") and read by js/loader.js. */

/* ---------- colour coding ---------- */
const hE=t=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const hS=(c,t)=>t?`<span class="h${c}">${hE(t)}</span>`:"";
const JSKW=new Set("break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch throw try typeof var void while with yield async await of static get set".split(" "));
const JSLIT=new Set(["true","false","null","undefined","this","NaN","Infinity"]);
function hlTpl(s,i){
  let o=hS("s","`"),j=i+1,buf="";const n=s.length;
  while(j<n&&s[j]!=="`"){
    if(s[j]==="\\"){buf+=s.slice(j,j+2);j+=2;continue}
    if(s[j]==="$"&&s[j+1]==="{"){
      o+=hS("s",buf);buf="";let d=1,k=j+2;
      while(k<n&&d>0){const c=s[k];if(c==="{")d++;else if(c==="}")d--;else if(c==='"'||c==="'"){k++;while(k<n&&s[k]!==c){if(s[k]==="\\")k++;k++}}else if(c==="`"){k=hlTpl(s,k)[1]-1}k++}
      o+=hS("o","${")+hlJS(s.slice(j+2,k-1))+hS("o","}");j=k;continue}
    buf+=s[j++];
  }
  o+=hS("s",buf+(s[j]==="`"?"`":""));return[o,Math.min(n,j+1)];
}
function hlJS(s){
  let o="",i=0,m;const n=s.length;let rx=true;
  while(i<n){
    const c=s[i],d=s[i+1];
    if(c==="/"&&d==="/"){let j=s.indexOf("\n",i);if(j<0)j=n;o+=hS("c",s.slice(i,j));i=j;continue}
    if(c==="/"&&d==="*"){let j=s.indexOf("*/",i+2);j=j<0?n:j+2;o+=hS("c",s.slice(i,j));i=j;continue}
    if(c==='"'||c==="'"){let j=i+1;while(j<n&&s[j]!==c&&s[j]!=="\n"){if(s[j]==="\\")j++;j++}j=Math.min(n,j+1);o+=hS("s",s.slice(i,j));i=j;rx=false;continue}
    if(c==="`"){const r=hlTpl(s,i);o+=r[0];i=r[1];rx=false;continue}
    if(c==="/"&&rx){
      let j=i+1,cls=false;
      while(j<n&&s[j]!=="\n"&&(s[j]!=="/"||cls)){if(s[j]==="\\")j++;else if(s[j]==="[")cls=true;else if(s[j]==="]")cls=false;j++}
      if(s[j]==="/"){j++;while(/[a-z]/i.test(s[j]||""))j++;o+=hS("r",s.slice(i,j));i=j;rx=false;continue}
    }
    if(/[0-9]/.test(c)||(c==="."&&/[0-9]/.test(d||""))){m=/^(0[xX][0-9a-fA-F]+|\d*\.?\d+(?:[eE][+-]?\d+)?)/.exec(s.slice(i,i+40));if(m){o+=hS("n",m[0]);i+=m[0].length;rx=false;continue}}
    if(/[A-Za-z_$]/.test(c)){
      const w=/^[A-Za-z_$][\w$]*/.exec(s.slice(i,i+80))[0];let k="v";
      if(JSKW.has(w))k="k";else if(JSLIT.has(w))k="l";else{let j=i+w.length;while(s[j]===" ")j++;if(s[j]==="(")k="f";else if(/^[A-Z]/.test(w))k="y"}
      o+=hS(k,w);i+=w.length;rx=k==="k"&&/^(return|typeof|case|do|else|in|of|void|delete|throw|new|yield|await)$/.test(w);continue;
    }
    if(/\s/.test(c)){o+=hE(c);i++;continue}
    o+=hS("o",c);i++;rx=!(c===")"||c==="]"||c==="}");
  }
  return o;
}
function hlSel(t){
  return t.replace(/(\.[\w-]+|#[\w-]+|::?[\w-]+(?:\([^)]*\))?|\[[^\]]*\]|@[\w-]+|[A-Za-z][\w-]*|[>+~,*]|[^.#:\[@\w>+~,*]+)/g,(x)=>{
    if(/^[.#:]/.test(x))return hS("q",x);if(x[0]==="[")return hS("a",x);if(x[0]==="@"||/^[A-Za-z]/.test(x))return hS("k",x);if(/^[>+~,*]$/.test(x))return hS("o",x);return hE(x)});
}
function hlVal(t){
  return t.replace(/(#[0-9a-fA-F]{3,8}\b|-?\d*\.?\d+(?:px|em|rem|%|vh|vw|vmin|vmax|s|ms|deg|fr|ch|ex)?\b|!important|--[\w-]+|[\w-]+(?=\()|[A-Za-z-]+|[^#\d!\-\w]+)/g,(x)=>{
    if(x[0]==="#"||/^-?\d|^\./.test(x))return hS("n",x);if(x==="!important")return hS("k",x);if(x.startsWith("--"))return hS("v",x);
    if(/\($/.test(x)||/^[\w-]+$/.test(x)&&t[t.indexOf(x)+x.length]==="(")return hS("f",x);if(/^[A-Za-z-]+$/.test(x))return hS("x",x);return hE(x)});
}
function hlCSS(s){
  let o="",i=0,mode="sel",buf="",par=0;const n=s.length,st=[];
  const fl=()=>{o+=mode==="sel"?hlSel(buf):mode==="val"?hlVal(buf):hE(buf);buf=""};
  while(i<n){
    const c=s[i],d=s[i+1];
    if(c==="/"&&d==="*"){fl();let e=s.indexOf("*/",i+2);e=e<0?n:e+2;o+=hS("c",s.slice(i,e));i=e;continue}
    if(c==='"'||c==="'"){fl();let j=i+1;while(j<n&&s[j]!==c&&s[j]!=="\n"){if(s[j]==="\\")j++;j++}o+=hS("s",s.slice(i,j+1));i=j+1;continue}
    if(c==="(")par++;else if(c===")")par=Math.max(0,par-1);
    if(par>0||c===")"){buf+=c;i++;continue}
    if(c==="{"){const g=/^\s*@(media|supports|container|layer|document|keyframes|-webkit-keyframes)/.test(buf);fl();o+=hS("o","{");st.push(g);mode=g?"sel":"prop";i++;continue}
    if(c==="}"){fl();o+=hS("o","}");st.pop();mode=st.length&&!st[st.length-1]?"prop":"sel";i++;continue}
    if(c===":"&&mode==="prop"){o+=hS("p",buf);buf="";o+=hS("o",":");mode="val";i++;continue}
    if(c===";"){fl();o+=hS("o",";");mode=st.length&&!st[st.length-1]?"prop":"sel";i++;continue}
    buf+=c;i++;
  }
  fl();return o;
}
const hlText=t=>hE(t).replace(/&amp;[#\w]+;/g,x=>`<span class="hn">${x}</span>`);
function hlHTML(s){
  let o="",i=0;const n=s.length;
  while(i<n){
    if(s.startsWith("<!--",i)){let j=s.indexOf("-->",i+4);j=j<0?n:j+3;o+=hS("c",s.slice(i,j));i=j;continue}
    if(s[i]==="<"&&/[A-Za-z\/!]/.test(s[i+1]||"")){
      let j=i+1;const close=s[j]==="/";if(close)j++;
      if(s[j]==="!"){let k=s.indexOf(">",j);k=k<0?n:k+1;o+=hS("g",s.slice(i,k));i=k;continue}
      const m=/^[A-Za-z][\w:-]*/.exec(s.slice(j,j+40));if(!m){o+=hE(s[i]);i++;continue}
      const name=m[0].toLowerCase();o+=hS("o","<"+(close?"/":""))+hS("t",m[0]);j+=m[0].length;
      while(j<n&&s[j]!==">"){
        const c=s[j];
        if(/\s/.test(c)){o+=hE(c);j++;continue}
        if(c==="/"){o+=hS("o","/");j++;continue}
        if(c==='"'||c==="'"){let k=j+1;while(k<n&&s[k]!==c)k++;o+=hS("s",s.slice(j,k+1));j=k+1;continue}
        if(c==="="){o+=hS("o","=");j++;continue}
        const mm=/^[^\s=>\/"']+/.exec(s.slice(j,j+80));if(mm){o+=hS("a",mm[0]);j+=mm[0].length}else{o+=hE(c);j++}
      }
      if(s[j]===">"){o+=hS("o",">");j++}
      i=j;
      if(!close&&(name==="script"||name==="style")){const mt=new RegExp("</"+name,"i").exec(s.slice(i));const k=mt?i+mt.index:n;const inner=s.slice(i,k);o+=name==="script"?hlJS(inner):hlCSS(inner);i=k}
      continue;
    }
    let k=s.indexOf("<",i+1);if(k<0)k=n;o+=hlText(s.slice(i,k));i=k;
  }
  return o;
}
const hlAny=(lang,s)=>lang==="css"?hlCSS(s):lang==="html"?hlHTML(s):lang==="json"?hlJS(s):hlJS(s);

/* ---------- checking the code (syntax and format) ---------- */
function chkHTML(s){
  const E=[],VOID=new Set("area base br col embed hr img input link meta param source track wbr".split(" ")),OPT=new Set("p li dt dd tr td th tbody thead tfoot option colgroup".split(" "));
  const st=[];let i=0,line=1;const n=s.length;
  const adv=to=>{for(;i<to;i++)if(s[i]==="\n")line++};
  while(i<n){
    const lt=s.indexOf("<",i);if(lt<0)break;adv(lt);
    if(s.startsWith("<!--",i)){const e=s.indexOf("-->",i+4);if(e<0){E.push({line,msg:"Unclosed comment (missing -->)"});break}adv(e+3);continue}
    const m=/^<(\/?)([A-Za-z][\w:-]*)/.exec(s.slice(i,i+60));
    if(!m){if(s[i+1]==="!"){const e=s.indexOf(">",i);adv(e<0?n:e+1);continue}adv(i+1);continue}
    const close=m[1]==="/",name=m[2].toLowerCase(),startLine=line,base=i;
    let j=i+m[0].length,q="";
    for(;j<n;j++){const c=s[j];if(q){if(c===q)q=""}else if(c==='"'||c==="'")q=c;else if(c===">")break}
    if(j>=n){E.push({line:startLine,msg:`Tag <${name}> is never closed with ">"`});break}
    const selfc=s[j-1]==="/";adv(j+1);
    if(close){
      let k=st.length-1;while(k>=0&&st[k].name!==name&&OPT.has(st[k].name))k--;
      if(k>=0&&st[k].name===name)st.length=k;
      else E.push({line:startLine,msg:st.length?`Unexpected </${name}>. Expected </${st[st.length-1].name}> (opened on line ${st[st.length-1].line})`:`Unexpected closing tag </${name}>`});
      continue;
    }
    if(VOID.has(name)||selfc)continue;
    if(name==="script"||name==="style"){
      const mt=new RegExp("</"+name+"\\s*>","i").exec(s.slice(i));
      if(!mt){E.push({line:startLine,msg:`<${name}> is never closed`});break}
      adv(i+mt.index+mt[0].length);continue;
    }
    st.push({name,line:startLine});
  }
  st.forEach(t=>{if(!OPT.has(t.name))E.push({line:t.line,msg:`<${t.name}> is never closed`})});
  return E;
}
function chkCSS(s){
  const E=[],st=[];let i=0,line=1,par=0,stmt="",sl=1;const n=s.length;
  const bad=(l,m)=>E.push({line:l,msg:m});
  const miss=()=>{const t=st[st.length-1];if(t&&!t.g&&stmt.trim()&&!stmt.includes(":"))bad(sl,`Missing ":" in declaration "${stmt.trim().slice(0,40)}"`)};
  while(i<n){
    const c=s[i],d=s[i+1];
    if(c==="/"&&d==="*"){const e=s.indexOf("*/",i+2);if(e<0){bad(line,"Unclosed comment (missing */)");return E}for(let k=i;k<e+2;k++)if(s[k]==="\n")line++;i=e+2;continue}
    if(c==='"'||c==="'"){let j=i+1;while(j<n&&s[j]!==c){if(s[j]==="\n"){bad(line,"Unterminated string");return E}if(s[j]==="\\")j++;j++}if(j>=n){bad(line,"Unterminated string");return E}if(!stmt.trim())sl=line;stmt+=s.slice(i,j+1);i=j+1;continue}
    if(c==="\n")line++;
    if(c==="(")par++;else if(c===")")par=Math.max(0,par-1);
    if(par>0||c===")"){stmt+=c;i++;continue}
    if(c==="{"){st.push({g:/^\s*@(media|supports|container|layer|document|keyframes|-webkit-keyframes)/.test(stmt),line:sl});stmt="";i++;continue}
    if(c==="}"){if(!st.length)bad(line,"Unexpected }");else{miss();st.pop()}stmt="";i++;continue}
    if(c===";"){miss();stmt="";i++;continue}
    if(!stmt.trim()&&!/\s/.test(c))sl=line;
    stmt+=c;i++;
  }
  st.forEach(t=>bad(t.line,"This block is never closed (missing })"));
  if(par>0)bad(line,'Unclosed "("');
  return E;
}
function chkJSON(s){
  try{JSON.parse(s);return[]}catch(e){const m=/position (\d+)/.exec(e.message);const line=m?s.slice(0,+m[1]).split("\n").length:1;return[{line,msg:e.message.replace(/ in JSON at position \d+.*/,"")}]}
}
function chkJS(src){
  return new Promise(res=>{
    const url=URL.createObjectURL(new Blob(["if(0){"+src+"\n}"],{type:"text/javascript"}));
    const s=document.createElement("script");let done=false;
    const fin=r=>{if(done)return;done=true;window.removeEventListener("error",h,true);s.remove();URL.revokeObjectURL(url);res(r)};
    const h=e=>{if(e.filename===url){e.preventDefault();fin([{line:e.lineno,col:e.colno,msg:String(e.message).replace(/^Uncaught /,"")}])}};
    window.addEventListener("error",h,true);
    s.onload=()=>setTimeout(()=>fin([]),0);s.src=url;document.head.appendChild(s);setTimeout(()=>fin([]),2500);
  });
}
function warnFmt(s){
  const W=[];const L=s.split("\n");
  const tr=L.findIndex(l=>/[ \t]+$/.test(l));if(tr>=0)W.push({line:tr+1,msg:"Trailing spaces at the end of the line"});
  const tb=L.findIndex(l=>/^\t/.test(l));if(tb>=0&&L.some(l=>/^  /.test(l)))W.push({line:tb+1,msg:"Mixed tab and space indentation"});
  if(s.length&&!s.endsWith("\n"))W.push({line:L.length,msg:"The file should end with a new line"});
  return W;
}
async function ideCheck(p,s){
  const lang=ideLang(p);
  const errs=lang==="css"?chkCSS(s):lang==="html"?chkHTML(s):lang==="json"?chkJSON(s):await chkJS(s);
  return{errs,warns:warnFmt(s)};
}

/* ---------- state ---------- */
const IDE_CORE=["index.html","css/styles.css","js/config.js","js/i18n.js","js/app.js","js/admin.js","js/studio.js","js/ide.js","js/start.js","js/pwa.js","js/loader.js"];
const IDE_RO=["js/loader.js"];
const ideLang=p=>/\.html?$/.test(p)?"html":/\.css$/.test(p)?"css":/\.json$/.test(p)?"json":"js";
let SRCS=load("nearo.src",{files:{},added:[]});SRCS.files=SRCS.files||{};SRCS.added=SRCS.added||[];
const IDE_RUNNING=!SAFE&&!localStorage.getItem("nearo.srcoff");
const IDE_BOOT=IDE_RUNNING?JSON.parse(JSON.stringify(SRCS.files)):{};
const IDE={path:sessionStorage.getItem("nearo.ide.file")||"css/styles.css",work:{},orig:{},res:{},live:localStorage.getItem("nearo.ide.live")!=="0",timer:0,gen:0,lines:0};
sessionStorage.removeItem("nearo.ide.file");
const idePaths=()=>IDE_CORE.concat(SRCS.added);
const saveSRC=()=>{try{localStorage.setItem("nearo.src",JSON.stringify(SRCS))}catch(e){toast("Browser storage is full. Download your source as a zip.")}};
async function ideOrig(p){
  if(IDE.orig[p]!==undefined)return IDE.orig[p];
  if(SRCS.added.includes(p)){IDE.orig[p]="";return""}
  try{const r=await fetch(p,{cache:"no-store"});IDE.orig[p]=r.ok?await r.text():""}catch(e){IDE.orig[p]=""}
  return IDE.orig[p];
}
const ideApplied=async p=>(SRCS.files[p]&&SRCS.files[p].src!==undefined)?SRCS.files[p].src:await ideOrig(p);
const ideBootText=async p=>(IDE_BOOT[p]&&IDE_BOOT[p].src!==undefined)?IDE_BOOT[p].src:await ideOrig(p);
const ideReload=p=>{sessionStorage.setItem("nearo.cs","ide");sessionStorage.setItem("nearo.ide.file",p||IDE.path);location.reload()};

/* ---------- the tab ---------- */
function csIde(){
  let off="";
  try{const o=JSON.parse(localStorage.getItem("nearo.srcoff")||"null");if(o)off=`<div class="warnbox"><b>Your last source change was switched off automatically.</b> It caused an error while the app started: <code>${esc(o.msg||"")}</code>${o.file?` (${esc(String(o.file).split("/").slice(-2).join("/"))}:${o.line||"?"})`:""}. The app is running on the original code. Fix the file below, then <button class="btn sm" data-ide="reenable">Switch my changes back on</button></div>`}catch(e){}
  if(!off&&SAFE)off=`<div class="warnbox"><b>Safe mode is on.</b> Your edited source files are switched off for this visit.</div>`;
  return `${off}<div class="panel" style="margin-bottom:12px">
   <p class="meta" style="margin:0 0 10px">Every file of the app is here. Changes are checked as you type: <b style="color:var(--ok)">green</b> means the code is valid, <b style="color:var(--warn)">amber</b> means format warnings, <b style="color:var(--bad)">red</b> means an error (it will not be applied). Valid changes go live automatically.</p>
   <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <label class="btn ghost sm" style="cursor:pointer">Upload files or .zip<input type="file" id="ideUp" multiple accept=".zip,.html,.css,.js,.json" hidden></label>
    <label class="btn ghost sm" style="cursor:pointer">Upload folder<input type="file" id="ideUpDir" webkitdirectory hidden></label>
    <button class="btn ghost sm" data-ide="new">New file</button>
    <button class="btn ghost sm" data-ide="download">Download all as .zip</button>
    <button class="btn bad sm" data-ide="resetall">Reset everything</button>
    <label class="check" style="margin-left:auto"><input type="checkbox" id="ideLive" ${IDE.live?"checked":""}> <span>Reload the app automatically for JavaScript / HTML changes (CSS is always instant)</span></label>
   </div></div>
   <div class="ide"><aside class="ide-ex" id="ideEx" aria-label="Files"></aside>
    <section class="ide-main"><div class="ide-bar" id="ideBar"></div>
     <div class="ide-wrap"><div class="ide-gut" aria-hidden="true"><pre id="ideNums"></pre></div>
      <div class="ide-ed"><div class="ide-layer" id="ideLayer" aria-hidden="true"><div id="ideMarks"></div><pre id="ideHl" class="ide-hl"></pre></div>
       <textarea id="ideTa" class="ide-ta" spellcheck="false" wrap="off" autocapitalize="off" autocomplete="off" aria-label="Code editor"></textarea></div></div>
     <div class="ide-status" id="ideSt"></div></section></div>`;
}
function ideRenderEx(){
  $("ideEx").innerHTML=`<div class="ide-exh">Files</div>`+idePaths().map(p=>{
    const lang=ideLang(p),i=p.lastIndexOf("/"),dir=i>=0?p.slice(0,i+1):"",base=p.slice(i+1),r=IDE.res[p];
    const mod=SRCS.files[p]&&SRCS.files[p].src!==undefined,bad=r&&r.errs.length;
    return `<button class="ide-f ${p===IDE.path?"on":""}" data-ide="open" data-p="${esc(p)}"><i class="fi ${lang}">${lang==="js"?"JS":lang==="css"?"#":"&lt;&gt;"}</i><span class="fn"><em>${esc(dir)}</em>${esc(base)}</span>${IDE_RO.includes(p)?'<small>read-only</small>':""}${mod?'<u title="Changed from the original"></u>':""}${bad?'<s title="Has errors"></s>':""}</button>`}).join("");
}
function ideRenderBar(){
  const p=IDE.path,ro=IDE_RO.includes(p),mod=SRCS.files[p]&&SRCS.files[p].src!==undefined;
  $("ideBar").innerHTML=`<span class="ide-tab"><i class="fi ${ideLang(p)}">${ideLang(p)==="js"?"JS":ideLang(p)==="css"?"#":"&lt;&gt;"}</i>${esc(p)}${mod?" ●":""}</span>
   <span class="ide-sp"></span>${ro?'<span class="meta" style="color:#cca700">Read-only: the loader starts the app</span>':`<button class="ide-b" data-ide="format">Format</button><button class="ide-b" data-ide="apply">Apply now</button><button class="ide-b" data-ide="resetfile">${SRCS.added.includes(p)?"Delete file":"Reset file"}</button>`}`;
}
function ideLineInfo(){
  const ta=$("ideTa");if(!ta)return"";const before=ta.value.slice(0,ta.selectionStart).split("\n");
  return `Ln ${before.length}, Col ${before[before.length-1].length+1}`;
}
function ideStatus(note){
  const st=$("ideSt");if(!st)return;const r=IDE.res[IDE.path]||{errs:[],warns:[]},e=r.errs[0],w=r.warns[0];
  let cls="ok",msg="✔ No problems found. The code is valid.";
  if(!r.checked){cls="wait";msg="Checking…"}
  else if(e){cls="err";msg=`✖ ${r.errs.length} error${r.errs.length>1?"s":""}: line ${e.line}${e.col?":"+e.col:""} – ${e.msg}. Not applied.`}
  else if(w){cls="warn";msg=`⚠ Valid, with ${r.warns.length} format warning${r.warns.length>1?"s":""}: line ${w.line} – ${w.msg}.`}
  st.className="ide-status "+cls;
  st.innerHTML=`<span>${esc(msg)}${note?` <b>${esc(note)}</b>`:""}</span><span>${ideLineInfo()} · ${({js:"JavaScript",css:"CSS",html:"HTML",json:"JSON"})[ideLang(IDE.path)]} · UTF-8</span>`;
}
function ideMarks(){
  const r=IDE.res[IDE.path];if(!$("ideMarks"))return;
  $("ideMarks").innerHTML=r?r.errs.map(e=>`<div class="ide-mk err" style="top:${12+(e.line-1)*20}px"></div>`).join("")+r.warns.slice(0,40).map(e=>`<div class="ide-mk warn" style="top:${12+(e.line-1)*20}px"></div>`).join(""):"";
}
function ideDraw(){
  const ta=$("ideTa");if(!ta)return;const t=ta.value,lang=ideLang(IDE.path);
  $("ideHl").innerHTML=hlAny(lang,t)+"\n";
  const n=t.split("\n").length;if(n!==IDE.lines){IDE.lines=n;$("ideNums").textContent=Array.from({length:n},(_,i)=>i+1).join("\n")}
  ideSync();
}
function ideSync(){const ta=$("ideTa");if(!ta)return;$("ideLayer").style.transform=`translate(${-ta.scrollLeft}px,${-ta.scrollTop}px)`;$("ideNums").style.transform=`translateY(${-ta.scrollTop}px)`}
async function ideOpen(p){
  IDE.path=p;IDE.lines=0;
  const ta=$("ideTa");if(!ta)return;
  const t=IDE.work[p]!==undefined?IDE.work[p]:await ideApplied(p);IDE.work[p]=t;
  ta.value=t;ta.readOnly=IDE_RO.includes(p);ta.scrollTop=0;ta.scrollLeft=0;
  ideRenderEx();ideRenderBar();ideDraw();ideValidate(true);
}
async function ideAfter(){
  const ta=$("ideTa");if(!ta)return;
  ta.addEventListener("scroll",ideSync);
  ta.addEventListener("input",()=>{IDE.work[IDE.path]=ta.value;ideDraw();IDE.res[IDE.path]=Object.assign(IDE.res[IDE.path]||{errs:[],warns:[]},{checked:false});ideStatus();ideValidate(false)});
  ["keyup","click"].forEach(ev=>ta.addEventListener(ev,()=>ideStatus()));
  ta.addEventListener("keydown",ideKey);
  await ideOpen(IDE.path);
}
function ideKey(e){
  const ta=e.target;if(ta.readOnly)return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();ideValidate(true,true);return}
  if(e.key==="Tab"){
    e.preventDefault();const v=ta.value,s=ta.selectionStart,en=ta.selectionEnd;
    if(s===en&&!e.shiftKey){document.execCommand("insertText",false,"  ");return}
    const a=v.lastIndexOf("\n",s-1)+1,blk=v.slice(a,en),out=e.shiftKey?blk.replace(/^ {1,2}/gm,""):blk.replace(/^/gm,"  ");
    ta.setSelectionRange(a,en);document.execCommand("insertText",false,out);ta.setSelectionRange(a,a+out.length);return;
  }
  if(e.key==="Enter"&&!e.ctrlKey&&!e.metaKey){
    const v=ta.value,s=ta.selectionStart,a=v.lastIndexOf("\n",s-1)+1,ind=/^[ \t]*/.exec(v.slice(a,s))[0],prev=v[s-1],next=v[ta.selectionEnd];
    e.preventDefault();
    if((prev==="{"||prev==="("||prev==="[")&&(next==="}"||next===")"||next==="]"))document.execCommand("insertText",false,"\n"+ind+"  \n"+ind);
    else document.execCommand("insertText",false,"\n"+ind+((prev==="{"||prev==="("||prev==="[")?"  ":""));
  }
}

/* ---------- validate and apply in real time ---------- */
function ideValidate(now,force){
  clearTimeout(IDE.timer);const p=IDE.path,lang=ideLang(p),gen=++IDE.gen;
  const run=async()=>{
    const text=IDE.work[p];if(text===undefined)return;
    const r=await ideCheck(p,text);if(gen!==IDE.gen||p!==IDE.path)return;
    r.checked=true;IDE.res[p]=r;ideMarks();ideRenderEx();ideStatus();
    if(r.errs.length||IDE_RO.includes(p))return;
    await ideApply(p,text,force);
  };
  IDE.timer=setTimeout(run,now?0:(lang==="css"?250:700));
}
async function ideApply(p,text,force){
  const orig=await ideOrig(p),isAdd=SRCS.added.includes(p),cur=await ideApplied(p);
  if(text!==cur||force){
    if(text===orig&&!isAdd)delete SRCS.files[p];else SRCS.files[p]={src:text,on:true,t:Date.now()};
    saveSRC();ideRenderEx();ideRenderBar();
  }
  const lang=ideLang(p);
  if(lang==="css"){
    let el=p==="css/styles.css"?$("srcCss"):document.querySelector(`style[data-src="${p}"]`);
    if(!el){el=document.createElement("style");if(p==="css/styles.css"){el.id="srcCss";const l=$("mainCss");if(l)l.disabled=true}else el.setAttribute("data-src",p);document.head.appendChild(el)}
    el.textContent=text;ideStatus(IDE_RUNNING?"Applied instantly.":"Saved (switched off right now).");return;
  }
  const boot=await ideBootText(p),changed=isAdd?!IDE_BOOT[p]||IDE_BOOT[p].src!==text:text!==boot;
  if(!changed){ideStatus();return}
  if(!IDE_RUNNING){ideStatus("Saved, but your edits are switched off right now.");return}
  if(IDE.live||force){ideStatus("Applying… reloading the app.");setTimeout(()=>ideReload(p),400)}
  else ideStatus("Saved. Press “Apply now” to reload the app with this change.");
}

/* ---------- formatting ---------- */
function fmtCSS(s){
  let o="",d=0,i=0,par=0;const n=s.length,nl=()=>"\n"+"  ".repeat(d);
  while(i<n){
    const c=s[i];
    if(c==="/"&&s[i+1]==="*"){let e=s.indexOf("*/",i+2);e=e<0?n:e+2;o+=s.slice(i,e);i=e;continue}
    if(c==='"'||c==="'"){let j=i+1;while(j<n&&s[j]!==c){if(s[j]==="\\")j++;j++}o+=s.slice(i,j+1);i=j+1;continue}
    if(c==="(")par++;if(c===")")par--;
    if(par>0||c===")"){o+=c;i++;continue}
    if(c==="{"){o=o.replace(/\s+$/,"")+" {";d++;o+=nl();i++;while(/\s/.test(s[i]||""))i++;continue}
    if(c==="}"){d=Math.max(0,d-1);o=o.replace(/\s+$/,"")+nl()+"}";i++;while(/\s/.test(s[i]||""))i++;o+=d?nl():"\n\n";continue}
    if(c===";"){o+=";";i++;while(/\s/.test(s[i]||""))i++;if(s[i]!=="}")o+=nl();continue}
    o+=c;i++;
  }
  return o.replace(/[ \t]+$/gm,"").replace(/\n{3,}/g,"\n\n").trim()+"\n";
}
const fmtTidy=s=>s.replace(/\t/g,"  ").replace(/[ \t]+$/gm,"").replace(/\n{3,}/g,"\n\n").replace(/\s*$/,"\n");
function ideFormat(){
  const ta=$("ideTa"),p=IDE.path,lang=ideLang(p);let t=ta.value,note="";
  if(lang==="css"){t=fmtCSS(t);note="CSS laid out one declaration per line."}
  else if(lang==="json"){try{t=JSON.stringify(JSON.parse(t),null,2)+"\n";note="JSON re-indented."}catch(e){return toast("Fix the JSON error first.")}}
  else{t=fmtTidy(t);note="Tabs → 2 spaces, trailing spaces removed, final new line added."}
  ta.focus();ta.select();document.execCommand("insertText",false,t);toast("Formatted. "+note);
}

/* ---------- zip: read and write ---------- */
const CRCT=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=u=>{let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRCT[(c^u[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
async function unzip(buf){
  const dv=new DataView(buf),u=new Uint8Array(buf);let e=u.length-22;
  while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;if(e<0)throw new Error("This is not a valid .zip file.");
  const cnt=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const out=[];
  for(let i=0;i<cnt;i++){
    if(dv.getUint32(p,true)!==0x02014b50)break;
    const method=dv.getUint16(p+10,true),csz=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
    const name=new TextDecoder().decode(u.subarray(p+46,p+46+nl));p+=46+nl+xl+cl;
    if(name.endsWith("/"))continue;
    const lh=30+dv.getUint16(off+26,true)+dv.getUint16(off+28,true),data=u.subarray(off+lh,off+lh+csz);
    let raw;
    if(method===0)raw=data;else if(method===8)raw=new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());else continue;
    out.push({path:name,bytes:raw});
  }
  return out;
}
function makeZip(files){
  const te=new TextEncoder(),parts=[],cen=[];let off=0;
  const d=new Date(),dt=((d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1))&0xffff,dd=(((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate())&0xffff;
  files.forEach(f=>{
    const nm=te.encode(f.path),data=f.bytes,crc=crc32(data),lh=new DataView(new ArrayBuffer(30));
    [[0,0x04034b50,4],[4,20,2],[6,0x0800,2],[8,0,2],[10,dt,2],[12,dd,2],[14,crc,4],[18,data.length,4],[22,data.length,4],[26,nm.length,2],[28,0,2]].forEach(([o,v,l])=>l===4?lh.setUint32(o,v,true):lh.setUint16(o,v,true));
    parts.push(new Uint8Array(lh.buffer),nm,data);
    const ch=new DataView(new ArrayBuffer(46));
    [[0,0x02014b50,4],[4,20,2],[6,20,2],[8,0x0800,2],[10,0,2],[12,dt,2],[14,dd,2],[16,crc,4],[20,data.length,4],[24,data.length,4],[28,nm.length,2],[30,0,2],[32,0,2],[34,0,2],[36,0,2],[38,0,4],[42,off,4]].forEach(([o,v,l])=>l===4?ch.setUint32(o,v,true):ch.setUint16(o,v,true));
    cen.push(new Uint8Array(ch.buffer),nm);off+=30+nm.length+data.length;
  });
  const csz=cen.reduce((t,a)=>t+a.length,0),end=new DataView(new ArrayBuffer(22));
  [[0,0x06054b50,4],[8,files.length,2],[10,files.length,2],[12,csz,4],[16,off,4]].forEach(([o,v,l])=>l===4?end.setUint32(o,v,true):end.setUint16(o,v,true));
  return new Blob([...parts,...cen,new Uint8Array(end.buffer)],{type:"application/zip"});
}
async function ideDownload(){
  const files=[],te=new TextEncoder();
  for(const p of idePaths())files.push({path:p,bytes:te.encode(IDE.work[p]!==undefined&&SRCS.files[p]===undefined&&false?IDE.work[p]:await ideApplied(p))});
  for(const p of ["sw.js","manifest.webmanifest","README.txt","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png"]){try{const r=await fetch(p,{cache:"no-store"});if(r.ok)files.push({path:p,bytes:new Uint8Array(await r.arrayBuffer())})}catch(e){}}
  const u=URL.createObjectURL(makeZip(files)),a=document.createElement("a");a.href=u;a.download="nearo-source-edited.zip";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);
  toast("Downloaded "+files.length+" files");
}

/* ---------- upload ---------- */
function idePathFor(raw){
  const p=raw.replace(/\\/g,"/").replace(/^\.\//,"");
  const core=IDE_CORE.concat(SRCS.added).find(c=>p===c||p.endsWith("/"+c));if(core)return core;
  const base=p.split("/").pop();
  if(/\.css$/.test(base))return"css/"+base;if(/\.js$/.test(base))return"js/"+base;return null;
}
async function ideImport(list){
  const ok=[],bad=[],skip=[];
  for(const f of list){
    const p=idePathFor(f.path);
    if(!p||IDE_RO.includes(p)||!/\.(html|css|js)$/.test(p)){skip.push(f.path);continue}
    const text=new TextDecoder().decode(f.bytes),r=await ideCheck(p,text);
    if(r.errs.length){bad.push(`${p}: line ${r.errs[0].line} – ${r.errs[0].msg}`);continue}
    if(!IDE_CORE.includes(p)&&!SRCS.added.includes(p))SRCS.added.push(p);
    const orig=await ideOrig(p);
    if(text===orig&&IDE_CORE.includes(p))delete SRCS.files[p];else SRCS.files[p]={src:text,on:true,t:Date.now()};
    IDE.work[p]=text;ok.push(p);
  }
  saveSRC();
  if(bad.length)await dlgBox({title:`${bad.length} file${bad.length>1?"s were":" was"} not applied`,msg:"These files have errors, so they were left out:\n\n"+bad.join("\n"),ok:"OK",cancel:false});
  toast(`${ok.length} file${ok.length===1?"":"s"} applied${skip.length?`, ${skip.length} ignored (not editable here)`:""}`);
  if(ok.length)ideReload(ok[0]);else renderAdmin();
}
async function ideFiles(fileList){
  const out=[];
  for(const f of fileList){
    if(/\.zip$/i.test(f.name)){try{out.push(...await unzip(await f.arrayBuffer()))}catch(e){toast(e.message||"Could not read the .zip")}}
    else out.push({path:f.webkitRelativePath||f.name,bytes:new Uint8Array(await f.arrayBuffer())});
  }
  if(out.length)await ideImport(out);else toast("No files found.");
}

/* ---------- buttons ---------- */
$("admBody").addEventListener("change",e=>{
  if(!studioOK())return;
  if(e.target.id==="ideUp"||e.target.id==="ideUpDir"){const fl=[...e.target.files];e.target.value="";if(fl.length)ideFiles(fl)}
  if(e.target.id==="ideLive"){IDE.live=e.target.checked;localStorage.setItem("nearo.ide.live",IDE.live?"1":"0");toast(IDE.live?"Live reload is on.":"Live reload is off. Use “Apply now”.")}
});
$("admBody").addEventListener("click",async e=>{
  const b=e.target.closest("[data-ide]");if(!b||!studioOK())return;const k=b.dataset.ide,p=IDE.path;
  if(k==="open"){if(b.dataset.p!==p)ideOpen(b.dataset.p);return}
  if(k==="format")return ideFormat();
  if(k==="apply")return ideValidate(true,true);
  if(k==="download")return ideDownload();
  if(k==="reenable"){localStorage.removeItem("nearo.srcoff");ideReload();return}
  if(k==="new"){
    const v=await dlgBox({title:"New file",msg:"New JavaScript files run after the app starts. Use a name like js/extra.js or css/extra.css.",input:{label:"File name",value:"js/extra.js",validate:v=>!/^(js|css)\/[\w.-]+\.(js|css)$/.test(v)?"Use js/name.js or css/name.css":(idePaths().includes(v)?"That file already exists.":"")},ok:"Create"});
    if(!v)return;SRCS.added.push(v);SRCS.files[v]={src:v.endsWith(".css")?"/* New styles */\n":"/* New file: runs after the app has started. */\n",on:true};saveSRC();IDE.work[v]=SRCS.files[v].src;IDE.orig[v]="";IDE.path=v;renderAdmin();return;
  }
  if(k==="resetfile"){
    const added=SRCS.added.includes(p);
    if(!await dlgBox({title:added?"Delete this file?":"Reset this file?",msg:added?`${p} will be removed from the app.`:`${p} goes back to the original code.`,ok:added?"Delete":"Reset"}))return;
    if(added){SRCS.added=SRCS.added.filter(x=>x!==p);delete IDE.work[p];IDE.path="css/styles.css"}else IDE.work[p]=await ideOrig(p);
    delete SRCS.files[p];saveSRC();
    if(ideLang(p)==="css"&&!added){const el=$("srcCss");if(el)el.textContent=IDE.work[p]}
    if(ideLang(p)==="css"&&!added){renderAdmin();return}
    ideReload();return;
  }
  if(k==="resetall"){
    if(!await dlgBox({title:"Reset everything?",msg:"All edited and added source files are removed and the app goes back to the original code.",ok:"Reset everything"}))return;
    SRCS={files:{},added:[]};saveSRC();localStorage.removeItem("nearo.srcoff");ideReload("css/styles.css");
  }
});
