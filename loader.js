/* Nearo - js/loader.js
   LOADER (read-only): starts the app. It loads css/styles.css and the js/ files in order, and swaps in any code
   edited in Admin > Code studio > Source files (saved in the browser under "nearo.src").
   Safety: if edited code throws an error while the app starts, the edits are switched off automatically
   (key "nearo.srcoff") so the app opens again. ?safe=1 in the address also switches all edits off. */
(function(){
  var SAFE=/[?&]safe=1/.test(location.search),OV={files:{},added:[]},OFF=null;
  try{OV=JSON.parse(localStorage.getItem("nearo.src"))||OV}catch(e){}
  try{OFF=JSON.parse(localStorage.getItem("nearo.srcoff"))}catch(e){}
  OV.files=OV.files||{};OV.added=OV.added||[];
  var USE=!SAFE&&!OFF;
  var JS=["js/config.js","js/i18n.js","js/app.js","js/admin.js","js/studio.js","js/ide.js","js/start.js","js/pwa.js"];
  function ov(p){var f=OV.files[p];return USE&&f&&f.on!==false&&typeof f.src==="string"?f.src:null}
  var hasOv=USE&&Object.keys(OV.files).some(function(k){return ov(k)!==null});
  // an edited index.html replaces the whole page once
  if(!window.__nearoPage){var h=ov("index.html");if(h){window.__nearoPage=1;document.open();document.write(h);document.close();return}}
  var c=ov("css/styles.css");
  if(c!==null){var l=document.getElementById("mainCss");if(l)l.disabled=true;var st=document.createElement("style");st.id="srcCss";st.textContent=c;document.head.appendChild(st)}
  OV.added.forEach(function(p){if(/\.css$/.test(p)){var s=ov(p);if(s!==null){var e=document.createElement("style");e.setAttribute("data-src",p);e.textContent=s;document.head.appendChild(e)}}});
  var list=JS.concat(OV.added.filter(function(p){return /\.js$/.test(p)}));
  var booting=true;
  if(hasOv)window.addEventListener("error",function(e){
    if(!booting)return;
    try{localStorage.setItem("nearo.srcoff",JSON.stringify({msg:e.message,file:e.filename,line:e.lineno,t:Date.now()}))}catch(x){}
    location.reload();
  });
  function next(i){
    if(i>=list.length){setTimeout(function(){booting=false},4000);return}
    var p=list[i],s=ov(p),el=document.createElement("script");
    if(s!==null){el.text=s+"\n//# sourceURL="+p;document.body.appendChild(el);next(i+1)}
    else{el.src=p;el.onload=function(){next(i+1)};el.onerror=function(){next(i+1)};document.body.appendChild(el)}
  }
  next(0);
})();
