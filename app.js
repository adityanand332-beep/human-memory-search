const seed = [
  {id:1,date:"2026-09-28",category:"Learning",text:"Started exploring MongoDB Vector Search and learned how embeddings can make semantic search possible.",tags:["mongodb","vector-search","ai"]},
  {id:2,date:"2026-09-22",category:"Project",text:"Had an idea for Human Memory Search — a private search engine for personal memories and notes.",tags:["idea","memory-search","ai"]},
  {id:3,date:"2026-09-15",category:"Learning",text:"Built a small JavaScript experiment using Local Storage to persist application data between sessions.",tags:["javascript","local-storage","web"]},
  {id:4,date:"2026-09-07",category:"Personal",text:"Realized that the best project ideas usually come from problems I personally experience.",tags:["reflection","ideas"]},
  {id:5,date:"2026-08-30",category:"Project",text:"Improved CareerTrack with cleaner status tracking and a more polished dashboard experience.",tags:["careertrack","javascript","ui"]},
  {id:6,date:"2026-08-19",category:"Learning",text:"Practiced responsive web design and refined mobile layouts for a personal portfolio.",tags:["css","responsive","portfolio"]},
  {id:7,date:"2026-08-03",category:"Idea",text:"Thought about building an AI assistant that can explain a developer's own GitHub repository.",tags:["ai","github","developer-tools"]},
];

const storedMemories = localStorage.getItem("hms_memories");
let memories = storedMemories ? JSON.parse(storedMemories) : seed;
memories = memories.map(memory => ({...memory, favorite: Boolean(memory.favorite)}));

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const state = {view:"search",query:"",category:"all",sort:"recent"};
const categories = ["Learning","Idea","Project","Personal","Work","Event"];

function save(){
  localStorage.setItem("hms_memories",JSON.stringify(memories));
  updateCounts();
}

function localDateString(date=new Date()){
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0,10);
}

function formatDate(value){
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}

function escapeHTML(value){
  return String(value).replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[character]));
}

function scoreMemory(memory,query){
  const normalized = query.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu," ").trim();
  const terms = normalized.split(/\s+/).filter(term=>term.length>2&&!["when","what","where","have","with","from","that","this","show","recently","about"].includes(term));
  if(!terms.length) return 0;

  const text = memory.text.toLowerCase();
  const category = memory.category.toLowerCase();
  const tags = memory.tags.join(" ").toLowerCase();
  const haystack = `${text} ${category} ${tags} ${memory.date}`.toLowerCase();
  let score = text.includes(normalized) ? 4 : 0;

  terms.forEach(term=>{
    if(text.includes(term)) score+=2;
    if(tags.includes(term)) score+=3;
    if(category.includes(term)) score+=3;
    if(memory.date.includes(term)) score+=2;
  });
  if(normalized.includes("mongo") && haystack.includes("mongodb")) score+=3;
  if(/\blearn/.test(normalized) && memory.category==="Learning") score+=2;
  if(/\bproject/.test(normalized) && memory.category==="Project") score+=2;
  if(/\bidea/.test(normalized) && memory.category==="Idea") score+=2;
  return score;
}

function sortedMemories(items,query=""){
  return items.sort((a,b)=>{
    if(state.sort==="relevance"&&query){
      const difference = scoreMemory(b,query)-scoreMemory(a,query);
      if(difference) return difference;
    }
    return b.date.localeCompare(a.date);
  });
}

function renderMemoryCard(memory,query=""){
  const score = query ? scoreMemory(memory,query) : 0;
  return `<article class="result-card">
    <div class="result-top"><span class="category category-${escapeHTML(memory.category.toLowerCase())}">${escapeHTML(memory.category)}</span><time class="date" datetime="${escapeHTML(memory.date)}">${formatDate(memory.date)}</time></div>
    <h3>${escapeHTML(memory.text)}</h3>
    <div class="card-footer"><div class="tags">${memory.tags.map(tag=>`<span class="tag">#${escapeHTML(tag.trim())}</span>`).join("")}</div>
      <div class="card-actions">
        ${score?`<span class="score">${score} match points</span>`:""}
        <button class="card-action favorite-action ${memory.favorite?"is-favorite":""}" data-action="favorite" data-id="${escapeHTML(memory.id)}" aria-label="${memory.favorite?"Remove from":"Add to"} favorites" title="${memory.favorite?"Remove from":"Add to"} favorites">${memory.favorite?"★":"☆"}</button>
        <button class="card-action delete-action" data-action="delete" data-id="${escapeHTML(memory.id)}" aria-label="Delete memory" title="Delete memory">×</button>
      </div>
    </div>
  </article>`;
}

function renderSearch(query=state.query){
  state.query = query;
  const box = $("#searchResults");
  const favoriteOnly = state.view==="favorites";
  const trimmedQuery = query.trim();
  let results = memories.filter(memory=>!favoriteOnly||memory.favorite);
  if(state.category!=="all") results = results.filter(memory=>memory.category===state.category);
  if(trimmedQuery) results = results.map(memory=>({...memory,_score:scoreMemory(memory,trimmedQuery)})).filter(memory=>memory._score>0);
  sortedMemories(results,trimmedQuery);

  const title = favoriteOnly ? "Your favorites" : trimmedQuery ? "Search results" : "Recently captured";
  const description = favoriteOnly ? "The moments you want to keep close." : trimmedQuery ? `Matches for “${escapeHTML(trimmedQuery)}”` : "A few moments from your memory archive.";
  const emptyMessage = favoriteOnly ? "No favorites yet. Star a memory to keep it close." : trimmedQuery ? "No matching memories yet. Try another phrase or capture a new moment." : "Your memory space is ready. Add the first moment you want to remember.";
  box.innerHTML = `<div class="collection-heading"><div><div class="section-kicker">${favoriteOnly?"YOUR COLLECTION":"YOUR ARCHIVE"}</div><h2>${title}</h2><p>${description}</p></div><span class="result-count">${results.length} ${results.length===1?"memory":"memories"}</span></div>
    <div class="collection-toolbar"><label class="filter-select"><span>Category</span><select id="categoryFilter" aria-label="Filter by category"><option value="all">All categories</option>${categories.map(category=>`<option value="${category}" ${state.category===category?"selected":""}>${category}</option>`).join("")}</select></label><label class="filter-select"><span>Sort</span><select id="sortSelect" aria-label="Sort memories"><option value="recent" ${state.sort==="recent"?"selected":""}>Most recent</option><option value="relevance" ${state.sort==="relevance"?"selected":""}>Best match</option></select></label></div>
    ${results.length?results.map(memory=>renderMemoryCard(memory,trimmedQuery)).join(""):`<div class="empty-state"><span class="empty-icon">${favoriteOnly?"☆":"⌕"}</span><h3>${trimmedQuery||favoriteOnly?"Nothing here just yet":"Start with a moment"}</h3><p>${emptyMessage}</p>${!favoriteOnly&&!trimmedQuery?'<button class="empty-cta" data-action="new-memory">＋ Capture your first memory</button>':""}</div>`}`;
}

function renderTimeline(){
  const sorted = memories.slice().sort((a,b)=>b.date.localeCompare(a.date));
  $("#timelineView").innerHTML = `<div class="page-intro"><span class="section-kicker">YOUR STORY, OVER TIME</span><h2>A timeline of you.</h2><p>Every captured moment, in chronological order.</p></div>
    ${sorted.length?`<div class="timeline">${sorted.map(memory=>`<article class="timeline-item"><div class="timeline-dot"></div><div class="timeline-date">${formatDate(memory.date)} <span>·</span> ${escapeHTML(memory.category)}</div><div class="timeline-card"><h3>${escapeHTML(memory.text)}</h3><div class="timeline-bottom"><div class="tags">${memory.tags.map(tag=>`<span class="tag">#${escapeHTML(tag)}</span>`).join("")}</div><div class="card-actions"><button class="card-action favorite-action ${memory.favorite?"is-favorite":""}" data-action="favorite" data-id="${escapeHTML(memory.id)}" aria-label="${memory.favorite?"Remove from":"Add to"} favorites">${memory.favorite?"★":"☆"}</button><button class="card-action delete-action" data-action="delete" data-id="${escapeHTML(memory.id)}" aria-label="Delete memory">×</button></div></div></div></article>`).join("")}</div>`:`<div class="empty-state"><span class="empty-icon">◷</span><h3>Your story starts here</h3><p>Save a moment and it will find its place on your timeline.</p><button class="empty-cta" data-action="new-memory">＋ Capture a memory</button></div>`}`;
}

function renderInsights(){
  const counts = categories.map(category=>[category,memories.filter(memory=>memory.category===category).length]).filter(([,count])=>count>0).sort((a,b)=>b[1]-a[1]);
  const tagCounts = {};
  memories.forEach(memory=>memory.tags.forEach(tag=>tagCounts[tag]=(tagCounts[tag]||0)+1));
  const topTags = Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const topCategory = counts[0]?.[0]||"—";
  const currentMonth = localDateString().slice(0,7);
  const thisMonth = memories.filter(memory=>memory.date.startsWith(currentMonth)).length;
  const maxCount = Math.max(1,...counts.map(([,count])=>count));

  $("#insightsView").innerHTML = `<div class="page-intro"><span class="section-kicker">PATTERNS IN YOUR PAST</span><h2>Your memory, at a glance.</h2><p>A little perspective on what you have been learning, thinking and doing.</p></div>
    <div class="stats"><article class="stat stat-dark"><span>Total memories</span><strong>${memories.length}</strong><small>Moments in your archive</small><i>✳</i></article><article class="stat"><span>Captured this month</span><strong>${thisMonth}</strong><small>Keep the momentum going</small><i>↗</i></article><article class="stat"><span>Top category</span><strong class="stat-category">${escapeHTML(topCategory)}</strong><small>${counts[0]?.[1]||0} memories captured</small><i>◈</i></article></div>
    <div class="insight-grid"><section class="insight-panel"><div class="panel-heading"><div><span class="section-kicker">BY CATEGORY</span><h3>What you capture</h3></div><span class="panel-icon">◫</span></div>
      ${counts.length?counts.map(([category,count])=>`<div class="bar-row"><div><span>${escapeHTML(category)}</span><strong>${count}</strong></div><div class="bar-track"><span style="width:${Math.round(count/maxCount*100)}%"></span></div></div>`).join(""):'<p class="muted-copy">Your category patterns will appear as you add memories.</p>'}</section>
      <section class="insight-panel"><div class="panel-heading"><div><span class="section-kicker">REPEATED THEMES</span><h3>Words that come up</h3></div><span class="panel-icon">⌗</span></div><div class="theme-list">${topTags.length?topTags.map(([tag,count])=>`<span class="theme-chip">#${escapeHTML(tag)} <b>${count}</b></span>`).join(""):'<p class="muted-copy">Add tags to your memories to spot recurring themes.</p>'}</div><div class="insight-note"><span>✳</span><p>Your archive gets more useful with small, consistent moments — lessons, decisions and ideas count too.</p></div></section></div>`;
}

function updateCounts(){
  $("#memoryCount").textContent = memories.length;
  $("#favoriteCount").textContent = memories.filter(memory=>memory.favorite).length;
}

function refreshViews(){
  renderSearch();
  renderTimeline();
  renderInsights();
}

function switchView(view){
  state.view = view;
  $$(".nav-item[data-view]").forEach(button=>button.classList.toggle("active",button.dataset.view===view));
  $("#searchHero").classList.toggle("hidden",view!=="search");
  $("#searchResults").classList.toggle("hidden",view!=="search"&&view!=="favorites");
  $("#timelineView").classList.toggle("hidden",view!=="timeline");
  $("#insightsView").classList.toggle("hidden",view!=="insights");
  $("#pageTitle").textContent = ({search:"Search",timeline:"Timeline",insights:"Insights",favorites:"Favorites"})[view];
  if(view==="search"||view==="favorites") renderSearch();
  if(view==="timeline") renderTimeline();
  if(view==="insights") renderInsights();
}

function openModal(){
  $("#memoryDate").value = localDateString();
  $("#modalBackdrop").classList.remove("hidden");
  $("#memoryText").focus();
}

function closeModal(){
  $("#modalBackdrop").classList.add("hidden");
  $("#memoryForm").reset();
  $("#newMemoryBtn").focus();
}

$$(".nav-item[data-view]").forEach(button=>button.addEventListener("click",()=>{
  switchView(button.dataset.view);
  $("#sidebar").classList.remove("open");
  $("#mobileMenu").setAttribute("aria-expanded","false");
}));

$("#searchInput").addEventListener("input",event=>{
  renderSearch(event.target.value);
  $("#clearSearch").classList.toggle("visible",Boolean(event.target.value));
});

$("#clearSearch").addEventListener("click",()=>{
  $("#searchInput").value="";
  $("#clearSearch").classList.remove("visible");
  renderSearch("");
  $("#searchInput").focus();
});

$(".suggestions").addEventListener("click",event=>{
  const button = event.target.closest("[data-query]");
  if(!button) return;
  $("#searchInput").value=button.dataset.query;
  $("#clearSearch").classList.add("visible");
  renderSearch(button.dataset.query);
});

$("#searchResults").addEventListener("change",event=>{
  if(event.target.id==="categoryFilter") state.category=event.target.value;
  if(event.target.id==="sortSelect") state.sort=event.target.value;
  renderSearch();
});

document.addEventListener("keydown",event=>{
  if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){
    event.preventDefault();
    switchView("search");
    $("#searchInput").focus();
  }
  if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="n"){
    event.preventDefault();
    openModal();
  }
  if(event.key==="Escape"&&!$("#modalBackdrop").classList.contains("hidden")) closeModal();
});

$("#mobileMenu").addEventListener("click",()=>{
  const isOpen=$("#sidebar").classList.toggle("open");
  $("#mobileMenu").setAttribute("aria-expanded",String(isOpen));
});

const modal=$("#modalBackdrop");
$("#newMemoryBtn").addEventListener("click",openModal);
$("#closeModal").addEventListener("click",closeModal);
modal.addEventListener("click",event=>{if(event.target===modal) closeModal();});

$("#memoryForm").addEventListener("submit",event=>{
  event.preventDefault();
  const text=$("#memoryText").value.trim();
  const tags=[...new Set($("#memoryTags").value.split(",").map(tag=>tag.trim().replace(/^#/,"")).filter(Boolean))];
  memories.unshift({id:Date.now(),date:$("#memoryDate").value,category:$("#memoryCategory").value,text,tags,favorite:false});
  save();
  closeModal();
  state.query="";
  $("#searchInput").value="";
  $("#clearSearch").classList.remove("visible");
  switchView("search");
  $("#searchInput").focus();
});

document.addEventListener("click",event=>{
  const action=event.target.closest("[data-action]");
  if(!action) return;
  if(action.dataset.action==="new-memory") openModal();
  if(action.dataset.action==="favorite"){
    const memory=memories.find(item=>String(item.id)===action.dataset.id);
    if(!memory) return;
    memory.favorite=!memory.favorite;
    save();
    refreshViews();
  }
  if(action.dataset.action==="delete"){
    if(!confirm("Delete this memory? This cannot be undone.")) return;
    memories=memories.filter(item=>String(item.id)!==action.dataset.id);
    save();
    refreshViews();
  }
});

$("#exportBtn").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(memories,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download="memorysearch-export.json";
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),0);
});

$("#clearBtn").addEventListener("click",()=>{
  if(!confirm("Delete all saved memories from this browser? This cannot be undone.")) return;
  memories=[];
  save();
  refreshViews();
});

updateCounts();
renderSearch();
