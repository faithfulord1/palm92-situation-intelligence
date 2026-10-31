const AREAS = [
  {id:'flood',name:'Flood & drains',icon:'⌁',desc:'Blocked drains, rising water and local flood concerns'},
  {id:'road',name:'Road safety',icon:'↗',desc:'Crossings, visibility, hazards and pedestrian access'},
  {id:'waste',name:'Waste collection',icon:'♻',desc:'Overflowing bins, missed collections and dumping'},
  {id:'fire',name:'Fire risk',icon:'♨',desc:'Visible hazards in shared spaces and local venues'},
  {id:'health',name:'Health access',icon:'✚',desc:'Finding trusted local health services and information'},
  {id:'fraud',name:'Scam & fraud risk',icon:'⌕',desc:'Suspicious requests, offers or payment demands'}
];
const STORAGE_KEY='palm92-community-pulse-reports-v1';
const form=document.querySelector('#reportForm');
const category=document.querySelector('#category');
const description=document.querySelector('#description');
const dialog=document.querySelector('#contentDialog');
let reports=readReports();

function readReports(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch{return []}}
function saveReports(){localStorage.setItem(STORAGE_KEY,JSON.stringify(reports));renderReports()}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function areaName(id){return AREAS.find(a=>a.id===id)?.name||'Community issue'}
function renderAreas(){
  const grid=document.querySelector('#themeGrid');
  grid.innerHTML=AREAS.map(a=>`<button type="button" class="theme-card" data-area="${a.id}"><span class="theme-icon">${a.icon}</span><span class="theme-name">${a.name}</span><span class="theme-desc">${a.desc}</span></button>`).join('');
  category.innerHTML=AREAS.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  grid.addEventListener('click',e=>{const b=e.target.closest('[data-area]');if(!b)return;category.value=b.dataset.area;document.querySelector('#report').scrollIntoView({behavior:'smooth'});grid.querySelectorAll('.theme-card').forEach(x=>x.classList.toggle('active',x===b))});
}
function renderReports(){
  const list=document.querySelector('#reportList');
  document.querySelector('#reportCount').textContent=reports.length;
  document.querySelector('#areaCount').textContent=new Set(reports.map(r=>r.category)).size;
  document.querySelector('#emptyState').hidden=reports.length>0;
  list.innerHTML=reports.slice().reverse().map(r=>`<article class="report-item"><div><b>${escapeHtml(areaName(r.category))} · ${escapeHtml(r.location)}</b><p>${escapeHtml(r.description)}</p><small>${new Date(r.createdAt).toLocaleString()} · ${escapeHtml(r.source||'Resident report')}</small></div><span class="report-badge ${r.urgency==='urgent'?'urgent':''}">${escapeHtml(r.urgency)}</span></article>`).join('');
}
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2400)}
function showContent(title,body,linkedin=false){document.querySelector('#dialogTitle').textContent=title;document.querySelector('#dialogBody').textContent=body;document.querySelector('#linkedinCompose').href='https://www.linkedin.com/feed/';dialog.dataset.content=body;dialog.showModal()}
function floodScript(){return `A blocked drain can look like a small problem, until heavy rain turns the road into a river.\n\nImagine residents sending a photo and location when they spot a blocked drain or rising water. AI could group repeated reports, flag possible hotspots and help local responders see where to check first.\n\nA trained person would verify the report and decide what action to take. AI can help organise the warning, but it cannot clear the drain or replace emergency services.\n\nCould this help your community prepare sooner?`}
function makeLinkedInDraft(){
  const count=reports.length;
  const categories=[...new Set(reports.map(r=>areaName(r.category)))];
  const body=count?`What if local observations were easier to organise and act on?\n\nWe are shaping Palm92 Community Pulse, a human-led prototype for community reports about ${categories.join(', ').toLowerCase()}. The idea is simple: residents share what they observe, a transparent assistant helps group and prioritise reports, and a person checks the information before any action.\n\nThis is an early prototype. It does not verify incidents, contact authorities or replace emergency, health or council services. Reports stay in the browser in this demo.\n\nAI investigates. Humans decide. Evidence proves why.\n\nWhat local issue should a community reporting tool help people raise more clearly?\n\n#ResponsibleAI #CommunitySafety #CivicTech #Palm92`:`What if local observations were easier to organise and act on?\n\nWe are shaping Palm92 Community Pulse, a human-led prototype for community reports about flood and drainage concerns, road safety, waste collection, fire risks, access to trusted health information, and scam or fraud risks.\n\nThe idea is simple: residents share what they observe, a transparent assistant helps group and prioritise reports, and a person checks the information before any action.\n\nThis is an early prototype. It does not verify incidents, contact authorities or replace emergency, health or council services.\n\nAI investigates. Humans decide. Evidence proves why.\n\nWhat local issue should community AI help people raise more clearly?\n\n#ResponsibleAI #CommunitySafety #CivicTech #Palm92`;
  showContent('LinkedIn post draft',body,true)
}
renderAreas();renderReports();
description.addEventListener('input',()=>document.querySelector('#charCount').textContent=`${description.value.length} / 700`);
form.addEventListener('submit',e=>{e.preventDefault();reports.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),category:category.value,location:document.querySelector('#location').value.trim(),urgency:document.querySelector('#urgency').value,description:description.value.trim(),createdAt:new Date().toISOString(),source:'Resident report'});saveReports();form.reset();document.querySelector('#charCount').textContent='0 / 700';toast('Report added to this browser’s local demo.')});
document.querySelector('#exportButton').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),prototype:'Palm92 Community Pulse',reports},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='palm92-community-reports-demo.json';a.click();URL.revokeObjectURL(a.href);toast('Local report export downloaded.')});
document.querySelector('#clearButton').addEventListener('click',()=>{if(!reports.length){toast('There are no local reports to clear.');return}if(confirm('Clear all reports saved in this browser?')){reports=[];saveReports();toast('Local reports cleared.')}});
document.querySelector('#sampleButton').addEventListener('click',()=>{reports=[{id:'sample-1',category:'flood',location:'Fictional example: Willow Road',urgency:'soon',description:'Residents report standing water near a drain after heavy rain. No live incident data.',createdAt:new Date().toISOString(),source:'Fictional demo report'},{id:'sample-2',category:'waste',location:'Fictional example: Market Square',urgency:'routine',description:'A public bin appears full. Example only, not a verified report.',createdAt:new Date(Date.now()-3600000).toISOString(),source:'Fictional demo report'}];saveReports();toast('Fictional examples loaded. No real incident data.')});
document.querySelector('#linkedinButton').addEventListener('click',makeLinkedInDraft);
document.querySelector('#showScript').addEventListener('click',()=>showContent('30-second flood awareness video',floodScript()));
document.querySelector('#closeDialog').addEventListener('click',()=>dialog.close());
document.querySelector('#copyContent').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(dialog.dataset.content||'');toast('Text copied.')}catch{toast('Select and copy the text from the preview.')}});
