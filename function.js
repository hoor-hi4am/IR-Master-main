/* =================================================================
   FLOATING BACKGROUND PARTICLES
   ================================================================= */
/* ===== FLOATING PARTICLES ===== */

const particles = document.getElementById("particles");

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

for(let i = 0; i < 120; i++){

    const span = document.createElement("span");

    span.innerText =
        chars[Math.floor(Math.random() * chars.length)];

    span.style.left = Math.random() * 100 + "vw";

    span.style.animationDuration =
        (8 + Math.random() * 15) + "s";

    span.style.fontSize =
        (12 + Math.random() * 30) + "px";

    span.style.animationDelay =
        Math.random() * 5 + "s";

    particles.appendChild(span);
}

/* =================================================================
   SIDEBAR NAV
   ================================================================= */
const NAV={
  processing:[
    ['tokenize','Tokenization','Split text into individual tokens visually.'],
    ['stopwords','Stop Words','Remove low-information words.'],
    ['stem','Stemming','Strip suffixes to find word stems.'],
    ['norm','Normalization','Lowercase + clean punctuation.'],
    ['lemma','Lemmatization','Map words to dictionary form.'],
    ['spell','Spelling Correction','Find and fix typos automatically.'],
  ],
  ir:[
    ['boolean','Boolean Retrieval','Query with AND/OR/NOT.'],
    ['inverted','Inverted Index','Term → posting lists.'],
    ['bow','Bag of Words','Vectorize documents by word counts.'],
    ['tfidf','TF-IDF + Cosine','Rank documents by relevance.'],
  ],
  sim:[
    ['edit','Edit Distance','Levenshtein DP visualization.'],
    ['jaccard','Jaccard','Set-based similarity.'],
    ['soundex','Soundex','Phonetic encoding.'],
  ],
  data:[
    ['dataset','Dataset Manager','Upload your text corpus.'],
  ]
};
function renderNav(id,items){
  const el=document.getElementById(id);
  items.forEach(([k,n,d])=>{
    const a=document.createElement('a');
    a.innerHTML='<span class="dot"></span> '+n;
    a.dataset.algo=k;
    a.dataset.subtitle=d;
    a.dataset.title=n;
    a.onclick=()=>activate(k);
    el.appendChild(a);
  });
}
renderNav('navProcessing',NAV.processing);
renderNav('navIR',NAV.ir);
renderNav('navSim',NAV.sim);
renderNav('navData',NAV.data);

function activate(key){
  document.querySelectorAll('section.algo').forEach(s=>s.classList.toggle('active',s.dataset.algo===key));
  document.querySelectorAll('.nav a').forEach(a=>a.classList.toggle('active',a.dataset.algo===key));
  const a=document.querySelector('.nav a[data-algo="'+key+'"]');
  if(a){
    document.getElementById('pageTitle').textContent=a.dataset.title;
    document.getElementById('pageSubtitle').textContent=a.dataset.subtitle;
  }
  window.scrollTo({top:0,behavior:'smooth'});
}
activate('tokenize');

/* =================================================================
   HELPERS
   ================================================================= */
function setSample(id,txt){document.getElementById(id).value=txt}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1600)}
function switchTab(btn,id){
  btn.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['boolMatrix','boolSteps','boolDocs'].forEach(x=>document.getElementById(x).style.display=x===id?'block':'none');
}

/* =================================================================
   CORE NLP UTILITIES
   ================================================================= */
const STOPWORDS=new Set("a an and are as at be by for from has have he her his i in is it its of on or that the their they this to was were will with you your we our us am if but not no so do does did about into over under above below also which who whom whose what when where why how".split(/\s+/));

function tokenize(text){
  return (text||'').toLowerCase().match(/[a-zA-Z']+/g)||[];
}
function rawTokenize(text){
  return (text||'').match(/\S+/g)||[];
}
function normalize(text){
  return (text||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}

/* simple Porter-ish stemmer */
function stem(w){
  w=w.toLowerCase();
  if(w.length<4)return w;
  const rules=[
    [/(.+)(ied|ies)$/,'$1y'],
    [/(.+)(sses)$/,'$1ss'],
    [/(.+)(ied)$/,'$1y'],
    [/(.+)(ying)$/,'$1y'],
    [/(.+)(ingly|edly|ously|fully)$/,'$1'],
    [/(.+)(ational)$/,'$1ate'],
    [/(.+[aeiou].+)(ing)$/,'$1'],
    [/(.+[aeiou].+)(ed)$/,'$1'],
    [/(.+)(ness|ment|tion|able|ible|ship|hood|ly|er|or|al|ic|ous|ive|ful|less|ize|ise)$/,'$1'],
    [/(.+)(es|s)$/,'$1'],
  ];
  for(const [re,rep] of rules){
    const m=w.match(re);
    if(m){const r=w.replace(re,rep);if(r.length>=3)return r}
  }
  return w;
}

/* tiny lemma dictionary + fallback */
const LEMMA={
  children:'child',mice:'mouse',geese:'goose',men:'man',women:'woman',feet:'foot',teeth:'tooth',people:'person',
  ran:'run',running:'run',runs:'run',ate:'eat',eaten:'eat',eating:'eat',eats:'eat',
  was:'be',were:'be',is:'be',are:'be',am:'be',being:'be',been:'be',
  better:'good',best:'good',worse:'bad',worst:'bad',
  studies:'study',studying:'study',studied:'study',
  leaves:'leaf',knives:'knife',wolves:'wolf',
  went:'go',gone:'go',going:'go',goes:'go'
};
function lemma(w){
  w=w.toLowerCase();
  if(LEMMA[w])return LEMMA[w];
  return stem(w);
}

/* Levenshtein with matrix */
function levenshtein(a,b){
  const m=a.length,n=b.length;
  const dp=Array.from({length:m+1},()=>new Array(n+1).fill(0));
  for(let i=0;i<=m;i++)dp[i][0]=i;
  for(let j=0;j<=n;j++)dp[0][j]=j;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){
    const c=a[i-1]===b[j-1]?0:1;
    dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+c);
  }
  return {distance:dp[m][n],matrix:dp};
}

/* Soundex */
function soundex(w){
  if(!w)return '';
  w=w.toUpperCase().replace(/[^A-Z]/g,'');
  if(!w)return '';
  const map={B:1,F:1,P:1,V:1,C:2,G:2,J:2,K:2,Q:2,S:2,X:2,Z:2,D:3,T:3,L:4,M:5,N:5,R:6};
  let code=w[0];
  let prev=map[w[0]]||0;
  for(let i=1;i<w.length;i++){
    const d=map[w[i]];
    if(d&&d!==prev)code+=d;
    if(d!==undefined)prev=d;else if(!'HW'.includes(w[i]))prev=0;
  }
  return (code+'000').slice(0,4);
}

/* =================================================================
   GLOBAL CORPUS
   ================================================================= */
let DOCS=[]; // [{id, raw, tokens}]
function refreshDataset(){
  document.getElementById('datasetPill').textContent='📂 '+DOCS.length+' document'+(DOCS.length===1?'':'s')+' indexed';
  const out=document.getElementById('dsOut');
  if(!DOCS.length){out.innerHTML='<div class="empty">No documents loaded</div>';return}
  out.innerHTML='<table class="tbl"><thead><tr><th>ID</th><th>Document</th><th>Tokens</th></tr></thead><tbody>'+
    DOCS.map(d=>`<tr><td>D${d.id}</td><td>${escapeHTML(d.raw)}</td><td style="color:var(--neon)">${d.tokens.length}</td></tr>`).join('')+'</tbody></table>';
}
function escapeHTML(s){return (s+'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function loadDocs(lines){
  DOCS=lines.map(l=>l.trim()).filter(Boolean).map((raw,i)=>({id:i+1,raw,tokens:tokenize(raw)}));
  refreshDataset();
  toast('Loaded '+DOCS.length+' documents');
}
function loadFromTextarea(){
  const v=document.getElementById('docInput').value;
  loadDocs(v.split(/\r?\n/));
}
function clearDocs(){DOCS=[];refreshDataset();toast('Corpus cleared')}
function loadDemoCorpus(){
  const demo=[
    'The quick brown fox jumps over the lazy dog',
    'Information retrieval is the science of searching for information in documents',
    'A cat and a dog are common household pets',
    'Apple and orange are fruits rich in vitamins',
    'Data mining and information retrieval are related fields',
    'Search engines use inverted index and tf-idf for ranking documents',
    'Machine learning helps improve modern search and retrieval systems'
  ];
  document.getElementById('docInput').value=demo.join('\n');
  loadDocs(demo);
}
document.getElementById('fileIn').addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=()=>{document.getElementById('docInput').value=r.result;loadDocs(r.result.split(/\r?\n/))};
  r.readAsText(f);
});

/* =================================================================
   ALGORITHMS
   ================================================================= */

/* --- Tokenization --- */
function runTokenize(){
  const txt=document.getElementById('tokInput').value;
  const tokens=rawTokenize(txt);
  const cleanTokens=tokenize(txt);
  const out=document.getElementById('tokOut');
  if(!tokens.length){out.innerHTML='<div class="empty">No tokens</div>';document.getElementById('tokStats').style.display='none';return}
  out.innerHTML='<div class="chips">'+cleanTokens.map(t=>`<span class="chip">${escapeHTML(t)}</span>`).join('')+'</div>';
  const stats=document.getElementById('tokStats');
  stats.style.display='flex';
  stats.innerHTML=`
    <div class="stat"><div class="v">${tokens.length}</div><div class="k">Raw Words</div></div>
    <div class="stat"><div class="v">${cleanTokens.length}</div><div class="k">Clean Tokens</div></div>
    <div class="stat"><div class="v">${new Set(cleanTokens).size}</div><div class="k">Unique</div></div>
    <div class="stat"><div class="v">${txt.length}</div><div class="k">Characters</div></div>`;
}
document.getElementById('tokInput').addEventListener('input',()=>{if(document.getElementById('tokInput').value.length>2)runTokenize()});

/* --- Stop words --- */
function runStopwords(){
  const txt=document.getElementById('swInput').value;
  const toks=tokenize(txt);
  document.getElementById('swBefore').innerHTML='<div class="chips">'+toks.map(t=>`<span class="chip">${escapeHTML(t)}</span>`).join('')+'</div>';
  document.getElementById('swAfter').innerHTML='<div class="chips">'+toks.map(t=>STOPWORDS.has(t)?`<span class="chip removed">${t}</span>`:`<span class="chip kept">${t}</span>`).join('')+'</div>';
}
document.getElementById('swInput').addEventListener('input',runStopwords);

/* --- Stemming --- */
function runStem(){
  const toks=tokenize(document.getElementById('stInput').value);
  if(!toks.length){document.getElementById('stOut').innerHTML='<div class="empty">No words</div>';return}
  document.getElementById('stOut').innerHTML='<table class="tbl"><thead><tr><th>Original</th><th>→</th><th>Stem</th></tr></thead><tbody>'+
    toks.map(w=>`<tr><td>${w}</td><td style="color:var(--neon)">→</td><td style="color:var(--accent)">${stem(w)}</td></tr>`).join('')+'</tbody></table>';
}

/* --- Normalization --- */
function runNorm(){
  const before=document.getElementById('nmInput').value;
  const after=normalize(before);
  document.getElementById('nmOut').innerHTML=`<div style="font-family:var(--mono);font-size:13px"><div style="margin-bottom:10px"><b style="color:var(--muted)">Before:</b><br>${escapeHTML(before)}</div><div><b style="color:var(--neon)">After:</b><br><span style="color:var(--accent)">${escapeHTML(after)}</span></div></div>`;
}
document.getElementById('nmInput').addEventListener('input',runNorm);

/* --- Lemmatization --- */
function runLemma(){
  const toks=tokenize(document.getElementById('lmInput').value);
  if(!toks.length){document.getElementById('lmOut').innerHTML='<div class="empty">No words</div>';return}
  document.getElementById('lmOut').innerHTML='<table class="tbl"><thead><tr><th>Word</th><th>→</th><th>Lemma</th></tr></thead><tbody>'+
    toks.map(w=>`<tr><td>${w}</td><td style="color:var(--neon)">→</td><td style="color:var(--accent)">${lemma(w)}</td></tr>`).join('')+'</tbody></table>';
}

/* --- Boolean Retrieval --- */
function buildIncidence(){
  const vocab=Array.from(new Set(DOCS.flatMap(d=>d.tokens))).sort();
  const matrix={};
  vocab.forEach(t=>{matrix[t]=DOCS.map(d=>d.tokens.includes(t)?1:0)});
  return {vocab,matrix};
}
function runBoolean(){
  if(!DOCS.length){toast('Load documents first');return}
  const {vocab,matrix}=buildIncidence();
  // Render matrix (limit terms shown)
  const showTerms=vocab.slice(0,40);
  let html='<div class="matrix"><table><thead><tr><th>Term</th>'+DOCS.map(d=>`<th>D${d.id}</th>`).join('')+'</tr></thead><tbody>';
  showTerms.forEach(t=>{
    html+=`<tr><th style="text-align:left">${t}</th>`+matrix[t].map(v=>`<td class="${v?'hit':''}">${v}</td>`).join('')+'</tr>';
  });
  html+='</tbody></table></div>';
  if(vocab.length>40)html+=`<p style="color:var(--muted);font-size:12px;margin-top:8px">Showing first 40 / ${vocab.length} terms</p>`;
  document.getElementById('boolMatrix').innerHTML=html;

  const q=document.getElementById('boolQ').value.trim();
  if(!q){
    document.getElementById('boolSteps').innerHTML='<div class="empty">No query</div>';
    document.getElementById('boolDocs').innerHTML='<div class="empty">No matches</div>';
    return;
  }
  const tokens=q.toLowerCase().split(/\s+/);
  const all=new Set(DOCS.map(d=>d.id));
  let result=null,op='OR',steps=[];
  for(let tk of tokens){
    if(['and','or','not'].includes(tk)){op=tk.toUpperCase();continue}
    let post=new Set();
    DOCS.forEach(d=>{if(d.tokens.includes(tk))post.add(d.id)});
    steps.push(`Term <b style="color:var(--neon)">${tk}</b> → posting list {${[...post].map(x=>'D'+x).join(', ')||'∅'}}`);
    if(result===null){result=post;continue}
    if(op==='AND'){result=new Set([...result].filter(x=>post.has(x)));steps.push(`AND → {${[...result].map(x=>'D'+x).join(', ')||'∅'}}`)}
    else if(op==='OR'){result=new Set([...result,...post]);steps.push(`OR → {${[...result].map(x=>'D'+x).join(', ')||'∅'}}`)}
    else if(op==='NOT'){const neg=new Set([...all].filter(x=>!post.has(x)));result=new Set([...result].filter(x=>neg.has(x)));steps.push(`NOT → {${[...result].map(x=>'D'+x).join(', ')||'∅'}}`)}
  }
  document.getElementById('boolSteps').innerHTML='<ol style="font-family:var(--mono);font-size:13px;line-height:1.9">'+steps.map(s=>'<li>'+s+'</li>').join('')+'</ol>';
  const matched=result?[...result]:[];
  document.getElementById('boolDocs').innerHTML=matched.length?
    matched.map(id=>{const d=DOCS.find(x=>x.id===id);return `<div class="search-card"><div class="doc-head"><b>D${d.id}</b><span class="score">MATCH</span></div>${escapeHTML(d.raw)}</div>`}).join('')
    :'<div class="empty">No documents matched</div>';
}

/* --- Inverted Index --- */
function runInverted(){
  if(!DOCS.length){toast('Load documents first');return}
  const idx={};
  DOCS.forEach(d=>{const seen=new Set();d.tokens.forEach(t=>{if(!seen.has(t)){seen.add(t);(idx[t]=idx[t]||[]).push(d.id)}})});
  const terms=Object.keys(idx).sort();
  document.getElementById('invOut').innerHTML=
    '<table class="tbl"><thead><tr><th>Term</th><th>DF</th><th>Posting List</th></tr></thead><tbody>'+
    terms.map(t=>`<tr><td>${t}</td><td style="color:var(--neon)">${idx[t].length}</td><td>${idx[t].map(x=>`<span class="chip" style="margin:2px">D${x}</span>`).join('')}</td></tr>`).join('')+
    '</tbody></table>';
}

/* --- Bag of Words --- */
function runBoW(){
  if(!DOCS.length){toast('Load documents first');return}
  const vocab=Array.from(new Set(DOCS.flatMap(d=>d.tokens))).sort();
  let html='<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Doc</th>'+vocab.map(v=>`<th>${v}</th>`).join('')+'</tr></thead><tbody>';
  DOCS.forEach(d=>{
    const counts=vocab.map(v=>d.tokens.filter(t=>t===v).length);
    html+=`<tr><td><b>D${d.id}</b></td>`+counts.map(c=>`<td style="color:${c?'var(--neon)':'var(--muted)'}">${c}</td>`).join('')+'</tr>';
  });
  html+='</tbody></table></div>';
  document.getElementById('bowOut').innerHTML=html;
}

/* --- TF-IDF + cosine --- */
function computeTFIDF(){
  const vocab=Array.from(new Set(DOCS.flatMap(d=>d.tokens))).sort();
  const N=DOCS.length;
  const df={};vocab.forEach(t=>{df[t]=DOCS.filter(d=>d.tokens.includes(t)).length});
  const idf={};vocab.forEach(t=>{idf[t]=Math.log((N+1)/(df[t]+1))+1});
  const vectors=DOCS.map(d=>{
    const v={};vocab.forEach(t=>v[t]=0);
    d.tokens.forEach(t=>v[t]++);
    vocab.forEach(t=>{v[t]=(v[t]/d.tokens.length)*idf[t]});
    return v;
  });
  return {vocab,idf,vectors};
}
function cosine(a,b){let dot=0,na=0,nb=0;for(let k in a){dot+=a[k]*(b[k]||0);na+=a[k]*a[k]}for(let k in b)nb+=b[k]*b[k];return (na&&nb)?dot/(Math.sqrt(na)*Math.sqrt(nb)):0}
function runTFIDF(){
  if(!DOCS.length){toast('Load documents first');return}
  const q=document.getElementById('tfQ').value.trim();
  if(!q){document.getElementById('tfOut').innerHTML='<div class="empty">Enter a query</div>';return}
  const {vocab,idf,vectors}=computeTFIDF();
  const qTok=tokenize(q);
  const qv={};vocab.forEach(t=>qv[t]=0);
  qTok.forEach(t=>{if(qv[t]!==undefined)qv[t]++});
  vocab.forEach(t=>{qv[t]=(qv[t]/Math.max(qTok.length,1))*(idf[t]||0)});
  const ranked=DOCS.map((d,i)=>({d,score:cosine(qv,vectors[i])})).sort((a,b)=>b.score-a.score);
  const max=ranked[0]?.score||1;
  document.getElementById('tfOut').innerHTML=
    '<div style="margin-bottom:14px;font-size:12px;color:var(--muted)">Query tokens: '+qTok.map(t=>`<span class="chip" style="display:inline-block">${t}</span>`).join(' ')+'</div>'+
    ranked.map(r=>{
      const pct=max?(r.score/max*100).toFixed(1):0;
      let highlighted=escapeHTML(r.d.raw);
      qTok.forEach(t=>{highlighted=highlighted.replace(new RegExp('\\b('+t+')\\b','gi'),'<mark>$1</mark>')});
      return `<div class="search-card">
        <div class="doc-head"><b>D${r.d.id}</b><span class="score">cos = ${r.score.toFixed(4)}</span></div>
        <div style="margin:6px 0">${highlighted}</div>
        <div class="bar"><span style="width:${pct}%"></span></div>
      </div>`;
    }).join('');
}

/* --- Spelling --- */
const DICT=new Set("the is a an and or not of in on at to for with by this that these those be am are was were have has had do does did information retrieval search engine document index inverted query simple sample text some misspelled words computer science data mining machine learning natural language processing example boolean apple orange cat dog fox lazy quick brown jumps over".split(/\s+/));
function runSpell(){
  const txt=document.getElementById('spInput').value;
  const tokens=rawTokenize(txt);
  const corrections=[];
  const out=tokens.map(tok=>{
    const w=tok.toLowerCase().replace(/[^a-z']/g,'');
    if(!w||DICT.has(w))return escapeHTML(tok);
    let best=w,bd=Infinity;
    DICT.forEach(d=>{if(Math.abs(d.length-w.length)>3)return;const dist=levenshtein(w,d).distance;if(dist<bd){bd=dist;best=d}});
    if(bd===0||bd>3)return `<span class="chip removed">${escapeHTML(tok)}</span>`;
    corrections.push([w,best,bd]);
    return `<span class="chip corrected" data-tip="was: ${tok}">${best}</span>`;
  }).join(' ');
  document.getElementById('spOut').innerHTML=
    `<div style="line-height:2.4;margin-bottom:14px">${out}</div>`+
    (corrections.length?'<table class="tbl"><thead><tr><th>Original</th><th>Suggestion</th><th>Edit Dist</th></tr></thead><tbody>'+
      corrections.map(([a,b,d])=>`<tr><td style="color:#ffb1be">${a}</td><td style="color:var(--accent)">${b}</td><td>${d}</td></tr>`).join('')+'</tbody></table>'
      :'<div style="color:var(--muted);font-size:12px">No corrections needed.</div>');
}

/* --- Edit distance --- */
function runEdit(){
  const a=document.getElementById('ed1').value.trim();
  const b=document.getElementById('ed2').value.trim();
  if(!a||!b){document.getElementById('edOut').innerHTML='<div class="empty">Enter both words</div>';return}
  const {distance,matrix}=levenshtein(a,b);
  let html=`<div class="stats"><div class="stat"><div class="v">${distance}</div><div class="k">Edit Distance</div></div>
    <div class="stat"><div class="v">${a.length}×${b.length}</div><div class="k">Matrix</div></div></div>`;
  html+='<div class="matrix" style="margin-top:14px"><table><thead><tr><th></th><th>∅</th>'+b.split('').map(c=>`<th>${c}</th>`).join('')+'</tr></thead><tbody>';
  for(let i=0;i<=a.length;i++){
    html+='<tr><th>'+(i===0?'∅':a[i-1])+'</th>';
    for(let j=0;j<=b.length;j++){
      const isPath=(i===a.length&&j===b.length);
      html+=`<td class="${isPath?'hit':''}">${matrix[i][j]}</td>`;
    }
    html+='</tr>';
  }
  html+='</tbody></table></div>';
  document.getElementById('edOut').innerHTML=html;
}

/* --- Jaccard --- */
function runJaccard(){
  const a=new Set(tokenize(document.getElementById('jc1').value));
  const b=new Set(tokenize(document.getElementById('jc2').value));
  if(!a.size||!b.size){document.getElementById('jcOut').innerHTML='<div class="empty">Enter two sets</div>';return}
  const inter=[...a].filter(x=>b.has(x));
  const uni=new Set([...a,...b]);
  const j=inter.length/uni.size;
  const onlyA=[...a].filter(x=>!b.has(x));
  const onlyB=[...b].filter(x=>!a.has(x));
  document.getElementById('jcOut').innerHTML=`
    <div class="stats">
      <div class="stat"><div class="v">${inter.length}</div><div class="k">|A ∩ B|</div></div>
      <div class="stat"><div class="v">${uni.size}</div><div class="k">|A ∪ B|</div></div>
      <div class="stat"><div class="v">${j.toFixed(3)}</div><div class="k">Jaccard</div></div>
    </div>
    <div class="bar" style="margin-top:14px"><span style="width:${(j*100).toFixed(1)}%"></span></div>
    <div class="flex" style="margin-top:14px">
      <div><b style="color:var(--muted);font-size:12px">Only in A</b><div class="chips" style="margin-top:6px">${onlyA.map(x=>`<span class="chip">${x}</span>`).join('')||'<span style="color:var(--muted);font-size:12px">∅</span>'}</div></div>
      <div><b style="color:var(--neon);font-size:12px">Intersection</b><div class="chips" style="margin-top:6px">${inter.map(x=>`<span class="chip kept">${x}</span>`).join('')||'<span style="color:var(--muted);font-size:12px">∅</span>'}</div></div>
      <div><b style="color:var(--muted);font-size:12px">Only in B</b><div class="chips" style="margin-top:6px">${onlyB.map(x=>`<span class="chip">${x}</span>`).join('')||'<span style="color:var(--muted);font-size:12px">∅</span>'}</div></div>
    </div>`;
}

/* --- Soundex --- */
function runSoundex(){
  const w=document.getElementById('sxInput').value.trim();
  if(!w){document.getElementById('sxOut').innerHTML='<div class="empty">Enter a word</div>';return}
  const code=soundex(w);
  const candidates=['Robert','Rupert','Rubin','Ashcraft','Ashcroft','Tymczak','Pfister','Honeyman','Smith','Smyth','Smithe','Jackson','Jaxon','Catherine','Katherine','Kathryn'];
  const similar=candidates.filter(c=>soundex(c)===code&&c.toLowerCase()!==w.toLowerCase());
  document.getElementById('sxOut').innerHTML=`
    <div class="stats">
      <div class="stat"><div class="v">${code}</div><div class="k">Soundex Code</div></div>
      <div class="stat"><div class="v">${w.toUpperCase()}</div><div class="k">Input</div></div>
    </div>
    <div style="margin-top:14px"><b style="color:var(--muted);font-size:12px">Similar sounding words</b>
    <div class="chips" style="margin-top:6px">${similar.length?similar.map(s=>`<span class="chip kept">${s} <small style="opacity:.6">(${soundex(s)})</small></span>`).join(''):'<span style="color:var(--muted);font-size:12px">No matches in the demo dictionary</span>'}</div></div>
    <details class="collapsible" style="margin-top:14px"><summary>How Soundex works</summary>
    <p style="font-size:12px;color:var(--muted);line-height:1.6;margin-top:8px">Keep the first letter. Map the rest: B/F/P/V→1, C/G/J/K/Q/S/X/Z→2, D/T→3, L→4, M/N→5, R→6. Drop H,W and vowels. Collapse adjacent duplicates. Pad/trim to 4 chars.</p></details>`;
}
