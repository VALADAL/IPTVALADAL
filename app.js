const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IMG='https://image.tmdb.org/t/p/',IDX={},arr=x=>Array.isArray(x)?x:[];
let cfg=JSON.parse(localStorage.vtv||'{}'),M=JSON.parse(localStorage.vtvm||'{}');
const S={live:[],movies:[],series:[],cats:{live:[],movies:[],series:[]},by:{},ln:{},rec:[],srec:[],v:'home',sel:{live:'all',movies:'all',series:'all'},q:'',lim:90,ready:false,err:'',E:{},cs:'',hk:''};
const TABS=[['home','Inicio'],['live','En vivo'],['movies','Películas'],['series','Series'],['cats','Categorías']];
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),4200)};
const base=()=>cfg.server.trim().replace(/\/+$/,'');
async function api(a,x={}){const u=new URL(base()+'/player_api.php');u.searchParams.set('username',cfg.user);u.searchParams.set('password',cfg.pass);if(a)u.searchParams.set('action',a);for(const k in x)u.searchParams.set(k,x[k]);
  const r=await fetch(cfg.proxy?cfg.proxy+encodeURIComponent(u):u);if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
const url=(t,id,ext)=>{const u=`${base()}/${t==='live'?'live':t==='movies'?'movie':'series'}/${encodeURIComponent(cfg.user)}/${encodeURIComponent(cfg.pass)}/${id}.${ext}`;return cfg.proxy?cfg.proxy+encodeURIComponent(u):u};
function clean(n){const y=(n.match(/\(((?:19|20)\d{2})\)/)||[])[1]||'';const t=n.replace(/[\[(].*?[\])]/g,' ').replace(/^\s*[A-Za-z]{2,3}\s*[-|:]\s*/,'').replace(/\s+/g,' ').trim();return{t:t||n,y}}
function norm(a,t){return a.map(x=>{const id=x.stream_id??x.series_id,name=String(x.name||'Sin título');
  const it={t,id,key:t+id,name,l:name.toLowerCase(),cat:String(x.category_id??''),poster:x.stream_icon||x.cover||'',backdrop:arr(x.backdrop_path)[0]||'',plot:x.plot||'',rating:parseFloat(x.rating)||0,year:String(x.year||x.releaseDate||x.release_date||'').slice(0,4),ext:t==='live'?'m3u8':(x.container_extension||'mp4'),added:+x.added||0};
  IDX[it.key]=it;return it})}
const info=it=>{const m=M[it.key]||{};return{poster:m.poster||it.poster,backdrop:m.backdrop||it.backdrop||m.poster||it.poster,overview:m.overview||it.plot,rating:m.rating||it.rating,year:m.year||it.year}};
async function tmdb(it){if(it.t==='live'||!cfg.tmdb)return;if(M[it.key])return M[it.key];
  const ty=it.t==='series'?'tv':'movie',n=clean(it.name),u=new URL('https://api.themoviedb.org/3/search/'+ty),h={};
  u.searchParams.set('query',n.t);u.searchParams.set('language','es-MX');if(n.y||it.year)u.searchParams.set(ty==='tv'?'first_air_date_year':'year',n.y||it.year);
  if(cfg.tmdb.length>60)h.Authorization='Bearer '+cfg.tmdb;else u.searchParams.set('api_key',cfg.tmdb);
  try{const r=await fetch(u,{headers:h});if(!r.ok)throw 0;const b=(await r.json()).results?.[0];
    M[it.key]=b?{poster:b.poster_path?IMG+'w342'+b.poster_path:'',backdrop:b.backdrop_path?IMG+'w1280'+b.backdrop_path:'',overview:b.overview||'',rating:b.vote_average||0,year:(b.release_date||b.first_air_date||'').slice(0,4)}:{};
    localStorage.vtvm=JSON.stringify(M);return M[it.key]}catch{}}
async function enrich(list){if(!cfg.tmdb)return;const todo=list.filter(x=>x&&x.t!=='live'&&!M[x.key]).slice(0,40);
  for(let i=0;i<todo.length;i+=5){await Promise.all(todo.slice(i,i+5).map(tmdb));paint()}}
function paint(){document.querySelectorAll('img[data-k]').forEach(im=>{const p=info(IDX[im.dataset.k]).poster;if(p&&im.getAttribute('src')!==p)im.src=p});
  if(S.v==='home'&&!S.q&&$('#hero')){const h=pick();if(h&&h.key+info(h).backdrop!==S.hk)$('#hero').outerHTML=hero()}}
const card=it=>{const i=info(it);return `<button class="card" data-o="${it.key}"><div class="ph">${i.poster?`<img data-k="${it.key}" loading="lazy" src="${esc(i.poster)}" onerror="this.remove()">`:''}${i.rating>0?`<i class="rt glass">★ ${i.rating.toFixed(1)}</i>`:''}</div><span class="n">${esc(clean(it.name).t)}</span></button>`};
const ch=it=>`<button class="ch glass" data-l="${it.key}"><span class="lg">${it.poster?`<img loading="lazy" src="${esc(it.poster)}" onerror="this.remove()">`:'TV'}</span><div><b>${esc(it.name)}</b><small>${esc(S.ln[it.cat]||'En vivo')}</small></div></button>`;
const pick=()=>{const p=[...S.rec.slice(0,10),...S.srec.slice(0,5)];return p.find(x=>M[x.key]?.backdrop)||p.find(x=>x.backdrop)||p[0]};
function hero(){const h=pick();if(!h)return '<section id="hero" class="hero"><div class="hc"><h1>Nada por aquí todavía</h1></div></section>';const i=info(h);S.hk=h.key+i.backdrop;
  return `<section id="hero" class="hero"><div class="bg" style="background-image:url('${esc(i.backdrop)}')"></div><div class="hc"><span class="tag">${h.t==='series'?'SERIE':'PELÍCULA'}${i.year?' · '+esc(i.year):''}${i.rating>0?' · ★ '+i.rating.toFixed(1):''}</span><h1>${esc(clean(h.name).t)}</h1><p>${esc(i.overview)}</p><div class="btns">${h.t==='movies'?`<button class="btn w" data-play="${h.key}">▶ Reproducir</button>`:''}<button class="btn glass" data-o="${h.key}">${h.t==='movies'?'Más info':'Ver episodios'}</button></div></div></section>`}
const welcome=()=>`<section class="hero"><div class="hc"><span class="tag">VALADAL TV</span><h1>Todo tu entretenimiento.</h1><p>Conecta tu suscripción Xtream para ver canales en vivo, películas y series con AirPlay.</p><div class="btns"><button class="btn w" data-set>Conectar proveedor</button></div></div></section>`;
function homeV(){if(!S.movies.length&&!S.series.length)return hero()+`<p class="msg">${S.live.length} canales disponibles en “En vivo”.</p>`;
  const rows=[['Películas recientes',S.rec.slice(0,20)],['Series recientes',S.srec.slice(0,20)],...S.cats.movies.filter(c=>S.by.movies[c.category_id].length>5).slice(0,4).map(c=>[c.category_name,S.by.movies[c.category_id].slice(0,16)])].filter(r=>r[1].length);
  setTimeout(()=>enrich([pick(),...rows.flatMap(r=>r[1].slice(0,10))]),0);
  return hero()+rows.map(([t,l])=>`<section class="sec"><h2>${esc(t)}</h2><div class="row">${l.map(card).join('')}</div></section>`).join('')+'<div class="main-pad"></div>'}
const pickL=t=>S.sel[t]==='all'?S[t]:(S.by[t][S.sel[t]]||[]);
const chips=t=>`<div class="chips">${[{category_id:'all',category_name:'Todos'},...S.cats[t]].map(c=>`<button class="chip glass ${S.sel[t]===String(c.category_id)?'on':''}" data-c="${t}|${c.category_id}">${esc(c.category_name)}</button>`).join('')}</div>`;
const more=(l,s)=>l.length>s.length?'<div class="more"><button class="btn glass" data-more>Mostrar más</button></div>':'';
function gridV(t){const l=pickL(t),s=l.slice(0,S.lim);setTimeout(()=>enrich(s),0);return `<div class="pt"><h1 class="ttl">${t==='movies'?'Películas':'Series'}</h1>${chips(t)}<div class="grid">${s.map(card).join('')}</div>${more(l,s)}<div class="main-pad"></div></div>`}
function liveV(){const l=pickL('live'),s=l.slice(0,S.lim);return `<div class="pt"><h1 class="ttl">En vivo</h1>${chips('live')}<div class="chl">${s.map(ch).join('')}</div>${more(l,s)}<div class="main-pad"></div></div>`}
const catsV=()=>'<div class="pt"><h1 class="ttl">Categorías</h1>'+[['movies','Películas'],['series','Series'],['live','En vivo']].filter(([t])=>S.cats[t].length).map(([t,n])=>`<h2 class="sub">${n}</h2><div class="chips wrapc">${S.cats[t].map(c=>`<button class="chip glass" data-c="${t}|${c.category_id}">${esc(c.category_name)} <small>${S.by[t][c.category_id].length}</small></button>`).join('')}</div>`).join('')+'<div class="main-pad"></div></div>';
function searchV(){const q=S.q.toLowerCase(),r=[...S.movies,...S.series,...S.live].filter(x=>x.l.includes(q)),p=r.filter(x=>x.t!=='live').slice(0,S.lim),c=r.filter(x=>x.t==='live').slice(0,40);setTimeout(()=>enrich(p),0);
  return `<div class="pt"><h1 class="ttl">Resultados</h1>${p.length?`<div class="grid">${p.map(card).join('')}</div>`:''}${c.length?`<h2 class="sub" style="margin-top:24px">Canales</h2><div class="chl">${c.map(ch).join('')}</div>`:''}${r.length?'':'<p class="msg">Sin resultados.</p>'}<div class="main-pad"></div></div>`}
function render(){$('#tabs').innerHTML=TABS.map(([k,n])=>`<button class="${S.v===k&&!S.q?'on':''}" data-v="${k}">${n}</button>`).join('');let h;
  if(!cfg.server)h=welcome();else if(S.err)h=`<div class="pt msg">${esc(S.err)}<br><br><button class="btn w" data-set>Revisar conexión</button></div>`;
  else if(!S.ready)h='<div class="pt msg">Cargando tu biblioteca…</div>';else if(S.q)h=searchV();else h=({home:homeV,live:liveV,movies:()=>gridV('movies'),series:()=>gridV('series'),cats:catsV})[S.v]();
  $('#main').innerHTML=h}
async function load(){if(!cfg.server)return render();S.ready=false;S.err='';render();
  try{const a=await api();if(a?.user_info?.auth===0)throw Error('Usuario o contraseña incorrectos.');
    const g=(x)=>api(x).catch(()=>[]);const [lc,mc,sc,l,m,s]=await Promise.all(['get_live_categories','get_vod_categories','get_series_categories','get_live_streams','get_vod_streams','get_series'].map(g));
    for(const k in IDX)delete IDX[k];
    S.live=norm(arr(l),'live');S.movies=norm(arr(m),'movies');S.series=norm(arr(s),'series');S.by={live:{},movies:{},series:{}};
    for(const t of ['live','movies','series'])for(const x of S[t])(S.by[t][x.cat]||=[]).push(x);
    S.cats={live:arr(lc),movies:arr(mc),series:arr(sc)};for(const t in S.cats)S.cats[t]=S.cats[t].filter(c=>S.by[t][c.category_id]);
    S.ln={};S.cats.live.forEach(c=>S.ln[c.category_id]=c.category_name);
    S.rec=[...S.movies].sort((a,b)=>b.added-a.added);S.srec=[...S.series].sort((a,b)=>b.added-a.added);S.ready=true;render();
  }catch(e){S.err='No se pudo conectar ('+e.message+'). Si tu servidor es http:// o bloquea CORS, usa el campo Proxy en Ajustes.';render()}}
const sheet=h=>{$('#sb').innerHTML=h;$('#sb').scrollTop=0;$('#sheet').classList.add('open')},shut=()=>$('#sheet').classList.remove('open');
async function open(key){const it=IDX[key];if(!it)return;if(!M[key]&&cfg.tmdb)await Promise.race([tmdb(it),new Promise(r=>setTimeout(r,1200))]);const i=info(it);
  sheet(`<div class="dh" style="background-image:url('${esc(i.backdrop)}')"><button class="x rbtn glass" data-x>✕</button></div><div class="db up"><h2>${esc(clean(it.name).t)}</h2><div class="meta">${i.rating>0?`<b>★ ${i.rating.toFixed(1)}</b>`:''}${i.year?`<span>${esc(i.year)}</span>`:''}<span>${it.t==='series'?'Serie':'Película'}</span></div>${it.t==='movies'?`<button class="btn w full" data-play="${key}">▶ Reproducir</button>`:''}<p class="ov">${esc(i.overview||'Sin descripción disponible.')}</p>${it.t==='series'?'<div id="eps" class="mu">Cargando episodios…</div>':''}</div>`);
  if(it.t==='series')try{const d=await api('get_series_info',{series_id:it.id});S.E=d.episodes||{};const k=Object.keys(S.E);if(!k.length)throw 0;S.cs=k[0];$('#eps').innerHTML=epsV()}catch{$('#eps').textContent='El proveedor no devolvió episodios.'}}
const epsV=()=>`<div class="chips" style="padding:4px 0 14px">${Object.keys(S.E).map(s=>`<button class="chip glass ${s===S.cs?'on':''}" data-s="${s}">Temporada ${s}</button>`).join('')}</div>`+S.E[S.cs].map((e,i)=>`<button class="ep glass" data-ep="${i}"><b>${esc((e.episode_num?e.episode_num+'. ':'')+(e.title||'Episodio'))}</b><small>${esc(e.info?.duration||'')}</small></button>`).join('');
function setSheet(){sheet(`<div class="db sp"><h2>Conexión</h2><p class="mu">Datos Xtream de tu proveedor.</p><input id="f-s" type="url" placeholder="URL del servidor  http://servidor:puerto" value="${esc(cfg.server)}" autocapitalize="off" autocorrect="off"><input id="f-u" placeholder="Usuario" value="${esc(cfg.user)}" autocapitalize="off" autocorrect="off"><input id="f-p" type="password" placeholder="Contraseña" value="${esc(cfg.pass)}"><input id="f-t" placeholder="TMDB API key (opcional: pósteres y estrellas)" value="${esc(cfg.tmdb)}" autocapitalize="off" autocorrect="off"><input id="f-x" placeholder="Proxy (opcional) https://…workers.dev/?url=" value="${esc(cfg.proxy)}" autocapitalize="off" autocorrect="off"><button class="btn w full" data-save>Guardar y conectar</button>${cfg.server?'<button class="btn glass full" data-out>Cerrar sesión</button>':''}</div>`)}
function play(u,t){const v=$('#vid');$('#pt').textContent=t;$('#player').classList.add('open');v.src=u;v.play().catch(()=>{})}
function stop(){const v=$('#vid');v.pause();v.removeAttribute('src');v.load();$('#player').classList.remove('open')}
$('#vid').addEventListener('error',async()=>{const v=$('#vid'),s=v.currentSrc||v.src;if(!s)return;let d='';try{const r=await fetch(s,{headers:{Range:'bytes=0-0'}});d=' ['+r.status+' '+(r.headers.get('content-type')||'sin tipo').split(';')[0]+']'}catch(e){d=' [sin respuesta del proxy]'}toast('No se pudo reproducir'+d+'. iOS solo lee m3u8 y mp4.')});
document.addEventListener('click',e=>{const g=a=>e.target.closest(`[${a}]`);let el;
  if(el=g('data-v')){S.v=el.dataset.v;S.q='';$('#q').value='';S.lim=90;render();scrollTo(0,0)}
  else if(el=g('data-o'))open(el.dataset.o);
  else if(el=g('data-c')){const[t,id]=el.dataset.c.split('|'),same=S.v===t,sl=$('.chips')?.scrollLeft;S.sel[t]=id;S.v=t;S.lim=90;render();if(same){const c=$('.chips');if(c)c.scrollLeft=sl}else scrollTo(0,0)}
  else if(el=g('data-l')){const it=IDX[el.dataset.l];play(url('live',it.id,'m3u8'),it.name)}
  else if(el=g('data-play')){const it=IDX[el.dataset.play];play(url('movies',it.id,it.ext),clean(it.name).t)}
  else if(el=g('data-ep')){const e2=S.E[S.cs][+el.dataset.ep];play(url('series',e2.id,e2.container_extension||'mp4'),e2.title||'Episodio')}
  else if(el=g('data-s')){S.cs=el.dataset.s;$('#eps').innerHTML=epsV()}
  else if(g('data-more')){S.lim+=90;const y=scrollY;render();scrollTo(0,y)}
  else if(g('data-set'))setSheet();
  else if(g('data-save')){let s=$('#f-s').value.trim();if(s&&!/^https?:\/\//i.test(s))s='http://'+s;cfg={server:s,user:$('#f-u').value.trim(),pass:$('#f-p').value,tmdb:$('#f-t').value.trim(),proxy:$('#f-x').value.trim()};localStorage.vtv=JSON.stringify(cfg);shut();load()}
  else if(g('data-out')){localStorage.removeItem('vtv');cfg={};S.ready=false;shut();render()}
  else if(g('data-x'))shut();
  else if(g('data-pc'))stop();
  else if(g('data-ap')){const v=$('#vid');v.webkitShowPlaybackTargetPicker?v.webkitShowPlaybackTargetPicker():toast('AirPlay solo está disponible en Safari (iPhone/iPad/Mac).')}
  else if(g('#bs')||e.target.id==='bs'){$('#q').classList.toggle('hidden');if(!$('#q').classList.contains('hidden'))$('#q').focus()}});
let dt;$('#q').addEventListener('input',e=>{clearTimeout(dt);dt=setTimeout(()=>{S.q=e.target.value.trim();S.lim=90;render()},250)});
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
load();
