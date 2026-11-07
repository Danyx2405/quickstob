const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws');
const L='ABCDEFGILMNOPRSTUVZ'.split(''),T=['Un animale','Qualcosa che si trova in cucina','Un lavoro','Una città','Un cibo che ami','Una cosa da portare in vacanza','Un frutto','Un cantante o un gruppo','Qualcosa di rotondo','Un personaggio dei cartoni','Una parte del corpo','Un mezzo di trasporto','Una cosa che si trova in bagno','Un film','Uno sport','Qualcosa che fa rumore','Un colore','Un paese','Una cosa che si trova a scuola','Qualcosa di freddo','Una bevanda','Un capo d’abbigliamento','Una scusa per arrivare in ritardo','Uno strumento musicale','Qualcosa che si rompe facilmente','Un nome proprio','Un oggetto nella borsa','Una cosa che si trova in spiaggia','Una verdura','Una marca famosa','Qualcosa che fa paura','Una cosa che si trova in ufficio','Qualcosa che si compra al supermercato','Un fiore o una pianta','Un posto dove nascondersi'];
const rid=()=>Math.random().toString(36).slice(2,9),rl=()=>L[Math.random()*L.length|0];
const fl=w=>(w||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').charAt(0).toUpperCase();
const page=fs.readFileSync(path.join(__dirname,'index.html'));
const srv=http.createServer((q,r)=>{if(q.url==='/health')return r.end('ok');r.writeHead(200,{'content-type':'text/html; charset=utf-8'});r.end(page)});
const wss=new WebSocketServer({server:srv,maxPayload:2048});
const rooms=new Map();
const pl=(R,id)=>R.S.players.find(p=>p.id===id);
function newTheme(S){S.theme=T[Math.random()*T.length|0];S.claims=[];S.round++;S.endAt=0}
function view(R,pid){const S=R.S;return{host:S.host,phase:S.phase,theme:S.theme,round:S.round,winner:S.winner,
  players:S.players.map(p=>({id:p.id,name:p.name,n:p.hand.length,hand:p.id===pid?p.hand:undefined})),
  claims:S.claims.map(c=>({k:c.k,pid:c.pid,letter:c.letter,word:c.word,votes:c.votes}))}}
function bc(R){for(const [id,ws] of R.socks)if(ws.readyState===1)ws.send(JSON.stringify(view(R,id)))}
function handle(ws,d){
  if(!d||typeof d.id!=='string'||d.id.length>20)return;
  if(d.t==='join'){
    const code=String(d.room||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,12);let R=rooms.get(code);
    if(!R){if(!d.create||!code)return ws.send(JSON.stringify({error:'Stanza non trovata. Controlla il codice.'}));
      R={S:{host:d.id,phase:'lobby',players:[],theme:'',claims:[],round:0,endAt:0,winner:null},socks:new Map(),seen:Date.now()};rooms.set(code,R)}
    ws.room=code;ws.pid=d.id;R.socks.set(d.id,ws);R.seen=Date.now();
    if(!pl(R,d.id)){if(R.S.phase!=='lobby')return ws.send(JSON.stringify({error:'Partita già iniziata.'}));
      if(R.S.players.length>=7)return ws.send(JSON.stringify({error:'Stanza piena (max 7).'}));
      R.S.players.push({id:d.id,name:String(d.name||'Giocatore').slice(0,16),hand:[]})}
    return bc(R)}
  const R=rooms.get(ws.room);if(!R||ws.pid!==d.id)return;const S=R.S,p=pl(R,d.id);if(!p)return;R.seen=Date.now();
  const isH=d.id===S.host;
  if(d.t==='start'&&isH&&S.phase==='lobby'&&S.players.length>1){S.players.forEach(q=>q.hand=Array.from({length:5},rl));S.phase='play';S.round=0;newTheme(S)}
  else if(d.t==='skip'&&isH&&S.phase==='play')newTheme(S);
  else if(d.t==='again'&&isH&&S.phase==='over'){S.phase='lobby';S.winner=null;S.players.forEach(q=>q.hand=[])}
  else if(d.t==='claim'&&S.phase==='play'&&S.claims.length<3&&!S.claims.some(c=>c.pid===p.id)){
    const w=String(d.word||'').slice(0,30),i=p.hand.indexOf(d.letter);
    if(i>=0&&fl(w)===d.letter&&w.trim().length>1){p.hand.splice(i,1);S.claims.push({k:rid(),pid:p.id,letter:d.letter,word:w,votes:[]});if(S.claims.length===3)S.endAt=Date.now()+6000}}
  else if(d.t==='contest'&&S.phase==='play'){const c=S.claims.find(x=>x.k===d.k);
    if(c&&c.pid!==p.id&&!c.votes.includes(p.id)){c.votes.push(p.id);
      if(c.votes.length>(S.players.length-1)/2){S.claims=S.claims.filter(x=>x!==c);const o=pl(R,c.pid);o&&o.hand.push(c.letter);if(S.claims.length<3)S.endAt=0}}}
  bc(R)}
wss.on('connection',ws=>{ws.on('message',m=>{try{handle(ws,JSON.parse(m))}catch(e){}});
  ws.on('close',()=>{const R=rooms.get(ws.room);if(!R)return;if(R.socks.get(ws.pid)===ws)R.socks.delete(ws.pid);
    if(R.S.phase==='lobby'&&!R.socks.has(ws.pid)){R.S.players=R.S.players.filter(p=>p.id!==ws.pid);bc(R)}})});
setInterval(()=>{const now=Date.now();for(const [c,R] of rooms){
  if(R.socks.size===0&&now-R.seen>600000){rooms.delete(c);continue}
  const S=R.S;if(S.phase==='play'&&S.endAt&&now>S.endAt){
    const w=S.claims.find(c=>{const p=pl(R,c.pid);return p&&p.hand.length===0});
    if(w){S.phase='over';S.winner=pl(R,w.pid).name}else newTheme(S);bc(R)}}},1000);
srv.listen(process.env.PORT||3000,()=>console.log('Quick Stop su porta',process.env.PORT||3000));
