export function appPage(env) {
  const domain = env.PUBLIC_DOMAIN || "";
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>HeyMia · Lensflow</title>
<style>
:root{--bg:#07070c;--card:rgba(18,18,28,.84);--line:rgba(255,255,255,.08);--ink:#f6f3ec;--mute:#9b97a8;--gold:#e8c47a}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:radial-gradient(900px 420px at 12% -8%,rgba(120,60,160,.28),transparent 60%),#07070c;color:var(--ink);font-family:ui-sans-serif,system-ui,sans-serif}
.app{display:grid;grid-template-columns:240px 1fr;min-height:100vh}
nav{border-right:1px solid var(--line);padding:22px 16px}
.brand{font-size:22px;letter-spacing:-.04em} .sub{color:var(--mute);font-size:12px;margin:0 0 24px}
nav button{display:block;width:100%;text-align:left;background:0;border:0;color:var(--ink);padding:10px 12px;border-radius:10px;cursor:pointer}
nav button.on,nav button:hover{background:rgba(255,255,255,.06)}
main{padding:28px 32px 80px;max-width:1100px}
h1{font-size:34px;letter-spacing:-.04em;margin:0 0 8px}
.lead{color:var(--mute)}
.row{display:flex;gap:12px;flex-wrap:wrap;margin:12px 0}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:18px;margin:12px 0}
input,textarea,select{width:100%;background:#0c0c14;border:1px solid var(--line);color:var(--ink);border-radius:12px;padding:12px 14px;font:inherit;margin-top:8px}
textarea{min-height:130px}
button.act{background:linear-gradient(180deg,#f0d59a,#c9a35a);color:#1a1408;border:0;border-radius:999px;padding:10px 16px;font-weight:650;cursor:pointer}
button.ghost{background:0;border:1px solid var(--line);color:var(--ink);border-radius:999px;padding:10px 16px;cursor:pointer}
.banner{display:none;padding:14px 16px;border-radius:14px;margin:12px 0;font-weight:600}
.banner.ok{display:block;background:rgba(143,214,196,.16);border:1px solid rgba(143,214,196,.35)}
.banner.bad{display:block;background:rgba(255,122,122,.12);border:1px solid rgba(255,122,122,.35)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.pill{display:inline-block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;border:1px solid var(--line);padding:4px 8px;border-radius:999px;color:var(--gold)}
pre{background:#09090f;border:1px solid var(--line);border-radius:12px;padding:14px;overflow:auto;max-height:420px;font-size:12px}
.chat{display:flex;flex-direction:column;gap:10px;max-height:420px;overflow:auto}
.bubble{padding:12px 14px;border-radius:14px;max-width:80%}
.me{align-self:flex-end;background:#2a2436}.bot{align-self:flex-start;background:#151520;border:1px solid var(--line)}
@media(max-width:860px){.app{grid-template-columns:1fr}nav{display:flex;gap:8px;overflow:auto;border-right:0;border-bottom:1px solid var(--line)}nav button{width:auto}}
</style></head><body>
<div class="app">
<nav>
  <div class="brand">HeyMia</div>
  <p class="sub">Lensflow edge</p>
  <button class="on" data-view="home">Overview</button>
  <button data-view="sites">Deploy websites</button>
  <button data-view="vault">File vault</button>
  <button data-view="rooms">Fantasy rooms</button>
  <button data-view="sessions">Sessions</button>
  <button data-view="chat">Talk</button>
  <button data-view="crm">CRM</button>
  <button data-view="status">Status</button>
</nav>
<main id="main"></main>
</div>
<script>
const DOMAIN = ${JSON.stringify(domain)};
const $ = (s,r=document)=>r.querySelector(s);
const main = $("#main");
let view="home", banner={type:"",text:""};
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("nav button").forEach(x=>x.classList.toggle("on",x===b));
  view=b.dataset.view; render();
});
function show(type,text){banner={type,text};const el=$("#banner");if(el){el.className="banner "+(type==="ok"?"ok":"bad");el.textContent=text;}}
async function api(path,opt={}){
  const r=await fetch(path,Object.assign({headers:{"content-type":"application/json"}},opt));
  const ct=r.headers.get("content-type")||"";
  if(ct.includes("application/json")) return r.json();
  if(!r.ok) throw new Error(await r.text());
  return r;
}
function shell(title,lead,inner){
  main.innerHTML = \`<h1>\${title}</h1><p class="lead">\${lead}</p><div id="banner" class="banner"></div>\${inner}\`;
  if(banner.text) show(banner.type,banner.text);
}
function render(){
  if(view==="home") return home();
  if(view==="sites") return sites();
  if(view==="vault") return vault();
  if(view==="rooms") return rooms();
  if(view==="sessions") return sessions();
  if(view==="chat") return chat();
  if(view==="crm") return crm();
  status();
}
async function home(){
  let st={}; try{st=await api("/api/status")}catch(e){st={message:String(e)}}
  shell("HeyMia is live","Companion studio, file vault, and a website publisher on Cloudflare.",
    \`<div class="card"><span class="pill">\${st.vault||"unknown"} vault</span><p>\${st.message||""}</p>
    <div class="row"><button class="act" onclick="view='sites';render()">Publish a site</button>
    <button class="ghost" onclick="view='vault';render()">Open vault</button></div></div>
    <div class="grid"><div class="card"><h3>Websites</h3><p class="lead">Served at /s/your-slug/</p></div>
    <div class="card"><h3>Vault</h3><p class="lead">Code, media, PDFs.</p></div>
    <div class="card"><h3>Rooms</h3><p class="lead">Saved scenes and themes.</p></div></div>\`);
}
async function sites(){
  shell("Deploy websites","Publish static sites to the HeyMia edge.",
    \`<div class="card"><input id="sname" placeholder="Site name"><input id="sslug" placeholder="slug (optional)">
    <input id="stag" placeholder="Tagline"><textarea id="shtml" placeholder="Optional custom HTML"></textarea>
    <div class="row"><button class="act" id="spub">Publish</button></div></div><div id="slist"></div>\`);
  $("#spub").onclick=async()=>{
    try{
      const body={name:$("#sname").value,slug:$("#sslug").value,tagline:$("#stag").value};
      if($("#shtml").value.trim()) body.html=$("#shtml").value;
      const r=await api("/api/sites",{method:"POST",body:JSON.stringify(body)});
      if(!r.ok) return show("bad",r.error||"Publish failed");
      show("ok",r.message||"Published"); sites();
    }catch(e){show("bad",String(e))}
  };
  const data=await api("/api/sites");
  $("#slist").innerHTML=(data.sites||[]).map(s=>\`<div class="card"><strong>\${s.slug}</strong>
    <p class="lead">\${s.files} files · \${s.bytes} bytes</p>
    <div class="row"><a class="act" style="text-decoration:none" href="/s/\${s.slug}/" target="_blank">Open site</a>
    <button class="ghost" data-del="\${s.slug}">Delete</button></div></div>\`).join("")||'<div class="card">No sites yet.</div>';
  $("#slist").querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{
    await api("/api/sites/"+b.dataset.del,{method:"DELETE"}); show("ok","Deleted "+b.dataset.del); sites();
  });
}
async function vault(){
  shell("File vault","Upload anything. Code opens in a preview.",
    \`<div class="card"><input type="file" id="vf" multiple><div class="row"><button class="act" id="vup">Upload</button></div></div>
    <div id="vlist"></div><pre id="vprev" hidden></pre>\`);
  $("#vup").onclick=async()=>{
    const files=$("#vf").files; if(!files.length) return show("bad","Choose a file first.");
    for(const f of files){
      const r=await fetch("/api/vault",{method:"POST",headers:{"X-Filename":f.name},body:f});
      const j=await r.json(); if(!j.ok) return show("bad",j.error||"Upload failed"); show("ok",j.message);
    }
    vault();
  };
  const data=await api("/api/vault");
  $("#vlist").innerHTML=(data.objects||[]).map(o=>\`<div class="card"><strong>\${o.key}</strong><p class="lead">\${o.size} bytes</p>
    <div class="row"><button class="ghost" data-open="\${o.key}">Open</button>
    <a class="ghost" style="text-decoration:none" href="/api/vault/\${encodeURIComponent(o.key)}">Download</a>
    <button class="ghost" data-del="\${o.key}">Delete</button></div></div>\`).join("")||'<div class="card">Vault is empty.</div>';
  $("#vlist").querySelectorAll("[data-open]").forEach(b=>b.onclick=async()=>{
    const r=await api("/api/vault/"+encodeURIComponent(b.dataset.open));
    if(r.text){$("#vprev").hidden=false;$("#vprev").textContent=r.text;}
    else location.href="/api/vault/"+encodeURIComponent(b.dataset.open);
  });
  $("#vlist").querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{
    await api("/api/vault/"+encodeURIComponent(b.dataset.del),{method:"DELETE"}); show("ok","Deleted "+b.dataset.del); vault();
  });
}
async function rooms(){
  shell("Fantasy rooms","Save a room with a theme and a scene prompt.",
    \`<div class="card"><input id="rn" placeholder="Room name"><input id="rt" placeholder="Theme">
    <textarea id="rp" placeholder="Scene prompt"></textarea>
    <div class="row"><button class="act" id="rc">Create room</button></div></div><div id="rlist"></div>\`);
  $("#rc").onclick=async()=>{
    const r=await api("/api/rooms",{method:"POST",body:JSON.stringify({name:$("#rn").value,theme:$("#rt").value,prompt:$("#rp").value})});
    if(!r.ok) return show("bad",r.error); show("ok","Room created"); rooms();
  };
  const data=await api("/api/rooms");
  $("#rlist").innerHTML=(data.rooms||[]).map(x=>\`<div class="card"><strong>\${x.name}</strong><p class="lead">\${x.theme}</p><p>\${x.prompt||""}</p></div>\`).join("")||'<div class="card">No rooms yet.</div>';
}
async function sessions(){
  shell("Sessions","Private session notes for Mia or Jess.",
    \`<div class="card"><input id="st" placeholder="Title"><select id="sp"><option value="mia">Mia</option><option value="jess">Jess</option></select>
    <textarea id="sn" placeholder="What happened"></textarea>
    <div class="row"><button class="act" id="sc">Save session</button></div></div><div id="slist"></div>\`);
  $("#sc").onclick=async()=>{
    const r=await api("/api/sessions",{method:"POST",body:JSON.stringify({title:$("#st").value,persona:$("#sp").value,notes:$("#sn").value})});
    if(!r.ok) return show("bad",r.error); show("ok","Session saved"); sessions();
  };
  const data=await api("/api/sessions");
  $("#slist").innerHTML=(data.sessions||[]).map(x=>\`<div class="card"><span class="pill">\${x.persona}</span><strong> \${x.title}</strong><p>\${x.notes||""}</p></div>\`).join("")||'<div class="card">No sessions yet.</div>';
}
function chat(){
  shell("Talk","Mia or Jess. Gemini if configured, otherwise Workers AI.",
    \`<div class="card"><select id="persona"><option value="mia">Mia</option><option value="jess">Jess</option></select>
    <div class="chat" id="log"></div>
    <div class="row"><input id="msg" placeholder="Say something"><button class="act" id="send">Send</button></div></div>\`);
  const log=[];
  const draw=()=>{$("#log").innerHTML=log.map(m=>\`<div class="bubble \${m.role==='user'?'me':'bot'}">\${m.content}</div>\`).join("")};
  $("#send").onclick=async()=>{
    const content=$("#msg").value.trim(); if(!content) return;
    log.push({role:"user",content}); $("#msg").value=""; draw();
    const r=await api("/api/chat",{method:"POST",body:JSON.stringify({persona:$("#persona").value,messages:log})});
    log.push({role:"assistant",content:r.text||r.error||"No reply"}); draw();
  };
}
async function crm(){
  shell("CRM","Lightweight contacts for Fan Studio follow-up.",
    \`<div class="card"><input id="cn" placeholder="Name"><input id="ce" placeholder="Email"><textarea id="cnote" placeholder="Note"></textarea>
    <div class="row"><button class="act" id="cc">Add contact</button></div></div><div id="clist"></div>\`);
  $("#cc").onclick=async()=>{
    const r=await api("/api/crm",{method:"POST",body:JSON.stringify({name:$("#cn").value,email:$("#ce").value,note:$("#cnote").value})});
    if(!r.ok) return show("bad",r.error); show("ok","Contact saved"); crm();
  };
  const data=await api("/api/crm");
  $("#clist").innerHTML=(data.contacts||[]).map(x=>\`<div class="card"><strong>\${x.name}</strong><p class="lead">\${x.email}</p><p>\${x.note||""}</p></div>\`).join("")||'<div class="card">No contacts yet.</div>';
}
async function status(){
  const st=await api("/api/status");
  shell("Deploy status","Health check used after wrangler deploy.",\`<div class="card"><pre>\${JSON.stringify(st,null,2)}</pre></div>\`);
  show(st.ok?"ok":"bad",st.message);
}
render();
</script></body></html>`;
}
