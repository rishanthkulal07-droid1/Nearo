/* Nearo - js/config.js
   SETTINGS AND DATA. Edit trades, sample handymen, material prices, cities, icons, payment split and fees here.
   Load order in index.html: config, i18n, app, admin, studio, start. */
/* ===== EDIT HERE: settings and sample data ===== */
let SITE_NAME="Nearo", MAX_RADIUS=30;const CURRENCY="₹";
let QUICK_FEE=150; // extra charge (₹) for a quick, priority visit
const DEFAULT_LOC={lat:12.9716,lng:77.5946};
let CATEGORIES=["Plumber","Electrician","Carpenter","Painter","AC repair","Cleaner","Moving assistance"];
// Sample handymen sit dx km east / dy km north of the customer so the demo always has results.
const SAMPLE=[
 {name:"Ravi Kumar",trade:"Plumber",phone:"+91 98450 11001",price:300,years:9,rating:4.8,dx:1.2,dy:.8,on:true,about:"Leaks, tap and pipe fitting."},
 {name:"Imran Sheikh",trade:"Plumber",phone:"+91 98450 11002",price:250,years:5,rating:4.5,dx:-3.1,dy:2,on:true,about:"Bathroom and kitchen plumbing."},
 {name:"Suresh Babu",trade:"Plumber",phone:"+91 98450 11003",price:400,years:14,rating:4.9,dx:5.4,dy:-4.2,on:false,about:"Water tank and borewell work."},
 {name:"Anil Reddy",trade:"Electrician",phone:"+91 98450 22001",price:350,years:8,rating:4.7,dx:-.9,dy:-1.7,on:true,about:"Wiring, fans, switchboards."},
 {name:"Farhan Ali",trade:"Electrician",phone:"+91 98450 22002",price:300,years:4,rating:4.4,dx:4.2,dy:3.6,on:true,about:"Inverters, lights and repairs."},
 {name:"Mohan Das",trade:"Carpenter",phone:"+91 98450 33001",price:500,years:12,rating:4.6,dx:2.6,dy:-2.4,on:true,about:"Furniture repair, door fitting."},
 {name:"Kiran Patil",trade:"Painter",phone:"+91 98450 44001",price:600,years:7,rating:4.3,dx:-6.2,dy:-1.1,on:true,about:"Interior and exterior painting."},
 {name:"Joseph Mathew",trade:"AC repair",phone:"+91 98450 55001",price:450,years:10,rating:4.8,dx:.4,dy:6.1,on:true,about:"Split and window AC service."},
 {name:"Lakshmi Devi",trade:"Cleaner",phone:"+91 98450 66001",price:350,years:6,rating:4.7,dx:-2,dy:-3.3,on:true,about:"Deep cleaning for homes."},
 {name:"Vikram Singh",trade:"Plumber",phone:"+91 98450 11004",price:350,years:11,rating:4.6,dx:12.5,dy:7.5,on:true,about:"Pipeline and leak repair."},
 {name:"Dinesh Rao",trade:"Electrician",phone:"+91 98450 22004",price:320,years:6,rating:4.5,dx:-14,dy:9,on:true,about:"Short circuits and rewiring."},
 {name:"Syed Hussain",trade:"Carpenter",phone:"+91 98450 33002",price:480,years:9,rating:4.5,dx:18,dy:-12,on:true,about:"Wardrobes, doors and polish."},
 {name:"Gopal Nair",trade:"Painter",phone:"+91 98450 44002",price:550,years:15,rating:4.7,dx:-20,dy:-19,on:true,about:"Full-home painting teams."},
 {name:"Sunil Gowda",trade:"AC repair",phone:"+91 98450 55002",price:400,years:8,rating:4.4,dx:9,dy:8.5,on:true,about:"AC gas refill and servicing."},
 {name:"Meena Kumari",trade:"Cleaner",phone:"+91 98450 66002",price:300,years:4,rating:4.6,dx:15,dy:10,on:true,about:"Kitchen and bathroom cleaning."},
 {name:"Ramesh Gowda",trade:"Moving assistance",phone:"+91 98450 77001",price:800,years:10,rating:4.7,dx:2.1,dy:1.4,on:true,about:"Packing, loading and local shifting."},
 {name:"Zameer Pasha",trade:"Moving assistance",phone:"+91 98450 77002",price:1200,years:8,rating:4.5,dx:-4.5,dy:3.2,on:true,about:"Mini-truck and tempo shifting."},
 {name:"Naveen Kumar",trade:"Moving assistance",phone:"+91 98450 77003",price:600,years:5,rating:4.4,dx:6.8,dy:-5.1,on:true,about:"Furniture dismantling and moving."},
 {name:"Harish Shetty",trade:"Moving assistance",phone:"+91 98450 77004",price:1500,years:12,rating:4.8,dx:-11,dy:8,on:true,about:"Full-house relocation teams."},
 {name:"Basavaraj M",trade:"Moving assistance",phone:"+91 98450 77005",price:900,years:7,rating:4.3,dx:17,dy:9,on:false,about:"Home and office shifting."}
];
const ico=d=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
const ICONS={
 "Plumber":ico('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'),
 "Electrician":ico('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
 "Carpenter":ico('<rect x="3" y="3.5" width="14" height="5.5" rx="1"/><path d="M10 9v12"/><path d="M17 5.5h3.5v2H17"/>'),
 "Painter":ico('<rect x="3" y="3" width="14" height="6" rx="1.5"/><path d="M17 6h3v6h-9v3"/><rect x="9" y="15" width="4" height="6" rx="1"/>'),
 "AC repair":ico('<path d="M12 2v20M4 7l16 10M4 17 20 7"/><path d="m9.5 4 2.5 2 2.5-2M9.5 20l2.5-2 2.5 2"/>'),
 "Moving assistance":ico('<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>'),
 "Cleaner":ico('<path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z"/><path d="M19 15v5M16.5 17.5h5"/>')
};
const TAGICO={zap:ico('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),search:ico('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>')};
// Indicative material prices in ₹ for the reference city. Edit to match real shop rates.
// Each city multiplies the base price (x). The nearest city to the user sets the price shown.
const CITIES=[{n:"Bengaluru",lat:12.97,lng:77.59,x:1},{n:"Mumbai",lat:19.08,lng:72.88,x:1.12},{n:"Delhi",lat:28.61,lng:77.21,x:1.05},{n:"Hyderabad",lat:17.39,lng:78.49,x:.97},{n:"Chennai",lat:13.08,lng:80.27,x:1.02},{n:"Pune",lat:18.52,lng:73.86,x:.98},{n:"Kolkata",lat:22.57,lng:88.36,x:.95}];
const MATERIALS=[
 {name:"PVC pipe, 1/2 inch, 3 m",g:"Plumbing",k:"pipe",p:120},{name:"CPVC pipe, 3/4 inch, 3 m",g:"Plumbing",k:"pipe",p:260},
 {name:"Elbow joint",g:"Plumbing",k:"joint",p:25},{name:"Brass tap",g:"Plumbing",k:"tap",p:280},
 {name:"Ball valve, 1/2 inch",g:"Plumbing",k:"tap",p:180},{name:"Teflon tape",g:"Plumbing",k:"tape",p:20},
 {name:"Copper wire 1.5 sq mm, 90 m",g:"Electrical",k:"wire",p:1450},{name:"Copper wire 2.5 sq mm, 90 m",g:"Electrical",k:"wire",p:2250},
 {name:"Modular switch",g:"Electrical",k:"switch",p:55},{name:"MCB 16 A",g:"Electrical",k:"mcb",p:260},
 {name:"LED bulb 9 W",g:"Electrical",k:"bulb",p:90},{name:"Insulation tape",g:"Electrical",k:"tape",p:30},
 {name:"Wall primer, 4 L",g:"Painting",k:"bucket",p:850},{name:"Emulsion paint, 4 L",g:"Painting",k:"bucket",p:1300}
];
const SHAPES={
 pipe:'<rect x="6" y="24" width="52" height="16" rx="3" fill="var(--brand)"/><rect x="6" y="24" width="8" height="16" fill="var(--ink)" opacity=".25"/><rect x="50" y="24" width="8" height="16" fill="var(--ink)" opacity=".25"/>',
 joint:'<path d="M6 26h26a10 10 0 0 1 10 10v22" stroke="var(--brand)" stroke-width="14" fill="none"/>',
 tap:'<path d="M12 22h26a10 10 0 0 1 10 10v6h-8v-6a2 2 0 0 0-2-2H12z" fill="var(--brand)"/><rect x="22" y="12" width="6" height="10" fill="var(--ink)"/><path d="M40 44h8v6a4 4 0 0 1-8 0z" fill="var(--accent)"/>',
 tape:'<circle cx="32" cy="32" r="22" fill="var(--ink)"/><circle cx="32" cy="32" r="9" fill="var(--bg)"/>',
 wire:'<circle cx="32" cy="32" r="22" fill="none" stroke="var(--accent)" stroke-width="8"/><circle cx="32" cy="32" r="10" fill="var(--ink)" opacity=".25"/>',
 switch:'<rect x="14" y="10" width="36" height="44" rx="6" fill="var(--surface)" stroke="var(--ink)" stroke-width="3"/><rect x="24" y="20" width="16" height="24" rx="3" fill="var(--brand)"/>',
 mcb:'<rect x="20" y="8" width="24" height="48" rx="4" fill="var(--surface)" stroke="var(--ink)" stroke-width="3"/><rect x="27" y="18" width="10" height="14" fill="var(--bad)"/>',
 bulb:'<circle cx="32" cy="26" r="15" fill="var(--accent)"/><rect x="25" y="40" width="14" height="10" rx="2" fill="var(--ink)" opacity=".6"/><rect x="27" y="52" width="10" height="4" rx="2" fill="var(--ink)"/>',
 bucket:'<path d="M14 20h36l-4 34H18z" fill="var(--brand)"/><rect x="12" y="14" width="40" height="8" rx="3" fill="var(--accent)"/>'};
const svg=k=>`<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">${SHAPES[k]}</svg>`;
const STATUS={pending:"Waiting for confirmation",accepted:"Confirmed",completed:"Completed",declined:"Declined",cancelled:"Cancelled"};


/* ----- ratings, badges and bonuses (edit freely) ----- */
const BADGE_MIN_RATING=3.5;                 // average stars must be ABOVE this to earn any Certified Partner badge
const BADGE_TIERS=[[16,1],[30,2],[50,3]];   // [jobs needed, badge]  1 = green, 2 = blue-silver, 3 = gold
const BONUS_STEPS=[[15,100],[25,110],[35,120],[45,130],[50,140],[65,150],[75,160],[85,170],[95,180],[100,1000]]; // [jobs, bonus in rupees]
