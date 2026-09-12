const $ = id => document.getElementById(id);

const state = {
  layers: { incidents:true, infrastructure:true, earthquakes:true, weather:true, transport:true, fires:false },
  data: { earthquakes:null, weather:null, transport:null, infrastructure:null, fires:null },
  incidents: [],
  selectedIncidentId: null,
  audit: JSON.parse(localStorage.getItem('palm92-audit') || '[]'),
  scenes: JSON.parse(localStorage.getItem('palm92-scenes') || '[]')
};

const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const age = iso => {
  const s=Math.max(0,Math.round((Date.now()-new Date(iso).getTime())/1000));
  if(s<60)return s+'s ago'; const m=Math.round(s/60); if(m<60)return m+'m ago'; return Math.round(m/60)+'h ago';
};
async function getJson(path){ const r=await fetch(path,{cache:'no-store'}); const d=await r.json(); if(!r.ok) throw new Error(d.error||'Feed failed'); return d; }

const map=L.map('map',{zoomControl:true,worldCopyJump:true}).setView([51.5074,-0.1278],6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);

const groups={};
for(const name of Object.keys(state.layers)){ groups[name]=L.layerGroup(); if(state.layers[name]) groups[name].addTo(map); }

function icon(kind,label,severity=''){
  return L.divIcon({className:'',html:'<div class="marker-dot marker-'+kind+' '+severity+'">'+esc(label)+'</div>',iconSize:[32,32],iconAnchor:[16,16]});
}
function clear(name){groups[name].clearLayers();}
function sourceRows(rows){$('sourceTable').innerHTML=rows.map(r=>'<tr><td>'+esc(r.source)+'</td><td class="'+(r.ok?'good':'warn')+'">'+esc(r.state)+'</td><td>'+esc(r.use)+'</td></tr>').join('');}
function log(action,detail=''){
  const entry={time:new Date().toISOString(),action,detail};
  state.audit.unshift(entry); state.audit=state.audit.slice(0,30);
  localStorage.setItem('palm92-audit',JSON.stringify(state.audit)); renderAudit();
}
function renderAudit(){
  $('auditLog').innerHTML=state.audit.length?state.audit.map(a=>'<div class="audit-entry"><b>'+esc(a.action)+'</b><small>'+new Date(a.time).toLocaleString()+' · '+esc(a.detail)+'</small></div>').join(''):'<div class="selected-empty">No local audit events yet.</div>';
}
function confidenceLabel(v){return v>=80?'High':v>=60?'Medium':'Low';}
function affectedAssets(incident){
  if(!state.data.infrastructure || !incident?.lineId) return [];
  return state.data.infrastructure.items.filter(s=>s.lines.some(l=>l.id===incident.lineId));
}

function buildIncidents(){
  const out=[], t=state.data.transport, w=state.data.weather, e=state.data.earthquakes;
  if(t){
    const issues=t.items.filter(x=>Number(x.severity)!==10);
    issues.forEach((x,i)=>{
      const assets=state.data.infrastructure?state.data.infrastructure.items.filter(s=>s.lines.some(l=>l.id===x.id)):[];
      const c=w?.current||{};
      const weatherStress=Number(c.wind_gusts_10m||0)>=45||Number(c.precipitation||0)>0;
      const evidence=[{kind:'observed',source:'Transport for London',claim:x.name+': '+x.status,freshness:age(t.retrievedAt)}];
      let confidence=72+(x.reason?8:0);
      if(w){evidence.push({kind:'observed',source:'Open-Meteo',claim:'London weather '+(c.temperature_2m??'?')+'°C, wind '+(c.wind_speed_10m??'?')+' km/h',freshness:age(w.retrievedAt)});confidence+=5;}
      if(weatherStress){evidence.push({kind:'inferred',source:'Palm92 rule',claim:'Weather may add operational pressure. This does not establish causation.',freshness:'computed now'});confidence+=5;}
      if(assets.length){evidence.push({kind:'observed',source:'TfL StopPoint',claim:assets.length+' mapped stops depend on this line.',freshness:age(state.data.infrastructure.retrievedAt)});confidence+=5;}
      out.push({
        id:'tfl-'+x.id,type:'Transport disruption',title:x.name+' disruption',location:'London transport network',
        lat:assets[0]?.lat||51.515+i*.008,lng:assets[0]?.lng||-0.10+i*.012,lineId:x.id,severity:Number(x.severity)<=5?'high':'medium',
        confidence:Math.min(confidence,94),status:'Unconfirmed incident object',summary:x.reason||x.status,
        evidence,assets,recommendation:'Verify persistence and passenger impact, review affected stops, then prepare communications or escalation if operational thresholds are met.',
        impact:[['Signal',x.name+': '+x.status],['Assets',assets.length?assets.length+' mapped stops':'Affected line/stations'],['Service','Journey reliability'],['People','Passengers'],['Mitigation','Alternatives and communications'],['Recovery','Normal service']]
      });
    });
  }
  if(e){
    e.items.filter(x=>Number(x.magnitude||0)>=5).slice(0,4).forEach(x=>{
      const vals=x.coordinates||[], lng=vals[0], lat=vals[1], depth=vals[2]; if(!Number.isFinite(lat)||!Number.isFinite(lng))return;
      const mag=Number(x.magnitude||0);
      out.push({
        id:'eq-'+x.id,type:'Earthquake',title:'M'+mag.toFixed(1)+' earthquake',location:x.title,lat,lng,severity:mag>=6.5?'high':'medium',
        confidence:94,status:'Observed event',summary:'USGS reported a magnitude '+mag.toFixed(1)+' earthquake.',
        evidence:[{kind:'observed',source:'USGS',claim:'Magnitude '+mag.toFixed(1)+', depth '+(Number.isFinite(depth)?depth+' km':'unknown'),freshness:age(e.retrievedAt)}],
        assets:[],recommendation:'Monitor authoritative local impact reports before drawing conclusions about damage or service disruption.',
        impact:[['Hazard','M'+mag.toFixed(1)+' earthquake'],['Location',x.title],['Infrastructure','Exposure unknown'],['Services','Verify disruption'],['People','Local population'],['Action','Check official reports']]
      });
    });
  }
  state.incidents=out.sort((a,b)=>b.confidence-a.confidence);
}

function renderIncidents(){
  clear('incidents');
  $('incidentCount').textContent=state.incidents.length;
  $('incidentFresh').textContent='built '+new Date().toLocaleTimeString();
  $('incidentBadge').textContent=state.incidents.length+' open';
  $('incidentList').innerHTML=state.incidents.length?state.incidents.map(i=>'<div class="feed-row incident-card '+i.severity+'" data-id="'+esc(i.id)+'"><strong>'+esc(i.title)+'</strong><div class="meta">'+esc(i.location)+' · '+esc(i.severity.toUpperCase())+'</div><span class="confidence">'+i.confidence+'% confidence · '+confidenceLabel(i.confidence)+'</span></div>').join(''):'<div class="selected-empty">No current incident objects.</div>';
  document.querySelectorAll('[data-id]').forEach(el=>el.onclick=()=>selectIncident(el.dataset.id,true));
  state.incidents.forEach(i=>L.marker([i.lat,i.lng],{icon:icon('incident','!',i.severity)}).on('click',()=>selectIncident(i.id,false)).addTo(groups.incidents));
}

function renderInfrastructure(){
  clear('infrastructure'); const d=state.data.infrastructure; if(!d)return;
  d.items.slice(0,180).forEach(s=>L.marker([s.lat,s.lng],{icon:icon('infra','I')}).on('click',()=>selectIntel('Infrastructure',{Name:s.name,Lines:s.lines.map(l=>l.name).join(', ')||'Unknown',Modes:s.modes.join(', '),Source:s.source,Freshness:age(d.retrievedAt)})).addTo(groups.infrastructure));
}
function renderEarthquakes(){
  clear('earthquakes'); const d=state.data.earthquakes;if(!d)return;
  d.items.forEach(x=>{const vals=x.coordinates||[],lng=vals[0],lat=vals[1],depth=vals[2];if(!Number.isFinite(lat)||!Number.isFinite(lng))return;
    L.marker([lat,lng],{icon:icon('eq',Number(x.magnitude??0).toFixed(1))}).on('click',()=>selectIntel('Earthquake',{Title:x.title,Magnitude:Number(x.magnitude??0).toFixed(1),Depth:Number.isFinite(depth)?depth+' km':'Unknown',Source:x.source,Freshness:age(d.retrievedAt)})).addTo(groups.earthquakes);
  });
}
function renderWeather(){
  clear('weather'); const d=state.data.weather;if(!d)return;const c=d.current||{};
  L.marker([51.5074,-0.1278],{icon:icon('wx','WX')}).on('click',()=>selectIntel('Weather',{Location:'London',Temperature:(c.temperature_2m??'?')+' °C',Wind:(c.wind_speed_10m??'?')+' km/h',Gusts:(c.wind_gusts_10m??'?')+' km/h',Source:d.source,Freshness:age(d.retrievedAt)})).addTo(groups.weather);
}
function renderTransport(){
  clear('transport'); const d=state.data.transport;if(!d)return;const issues=d.items.filter(x=>Number(x.severity)!==10);
  L.marker([51.515,-0.10],{icon:icon('tfl',issues.length?String(issues.length):'OK')}).on('click',()=>selectIntel('Transport',{Location:'London network',Issues:issues.length,'Affected lines':issues.map(x=>x.name).join(', ')||'None',Source:d.source,Freshness:age(d.retrievedAt)})).addTo(groups.transport);
}
function renderFires(){
  clear('fires'); const d=state.data.fires;if(!d?.configured)return;
  d.items.slice(0,200).forEach(x=>L.marker([x.lat,x.lng],{icon:icon('fire','F')}).on('click',()=>selectIntel('Active fire',{Location:x.lat.toFixed(3)+', '+x.lng.toFixed(3),Confidence:x.confidence,Satellite:x.satellite,Source:x.source,Freshness:age(d.retrievedAt)})).addTo(groups.fires));
}
function selectIntel(type,payload){
  $('selectedType').textContent=type;
  $('selectedPanel').innerHTML='<div class="intel-title">'+esc(payload.Title||payload.Name||payload.Location||type)+'</div>'+Object.entries(payload).map(([k,v])=>'<div class="intel-meta"><b>'+esc(k)+'</b><span>'+esc(v)+'</span></div>').join('');
}
function selectIncident(id,fly){
  const i=state.incidents.find(x=>x.id===id); if(!i)return; state.selectedIncidentId=id;
  $('selectedType').textContent=i.type;
  $('selectedPanel').innerHTML='<div class="intel-title">'+esc(i.title)+'</div><div class="intel-meta"><b>Status</b><span>'+esc(i.status)+'</span></div><div class="intel-meta"><b>Severity</b><span>'+esc(i.severity.toUpperCase())+'</span></div><div class="intel-meta"><b>Confidence</b><span>'+i.confidence+'% · '+confidenceLabel(i.confidence)+'</span></div><div class="intel-meta"><b>Location</b><span>'+esc(i.location)+'</span></div><div class="intel-meta"><b>Summary</b><span>'+esc(i.summary)+'</span></div>';
  $('impactPath').innerHTML='<div class="impact-path">'+i.impact.map((s,n)=>(n?'<div class="impact-arrow">→</div>':'')+'<div class="impact-node"><b>'+esc(s[0])+'</b><span>'+esc(s[1])+'</span></div>').join('')+'</div>';
  $('evidenceBundle').innerHTML=i.evidence.map(e=>'<div class="evidence-item"><div class="evidence-head"><strong>'+esc(e.source)+'</strong><span class="evidence-tag '+e.kind+'">'+esc(e.kind)+'</span></div><p>'+esc(e.claim)+'</p><small>Freshness: '+esc(e.freshness)+'</small></div>').join('');
  $('recommendationPanel').innerHTML='<div class="recommendation"><strong>Prepared recommendation</strong><p>'+esc(i.recommendation)+'</p><small>Proposal only. No action executed.</small></div>';
  const assets=affectedAssets(i);
  $('dependencyGraph').innerHTML=assets.length?'<div class="dependency-list"><div class="dependency-item"><b>'+esc(i.title)+'</b><br>maps to '+assets.length+' dependent stops</div>'+assets.slice(0,10).map(a=>'<div class="dependency-item"><b>'+esc(a.name)+'</b><br><small>'+esc(a.lines.map(l=>l.name).join(', '))+'</small></div>').join('')+'</div>':'<div class="selected-empty">No mapped infrastructure dependencies for this incident.</div>';
  $('assetCount').textContent=assets.length;
  $('incidentTimeline').innerHTML='<div><b>OBS</b><span>'+esc(i.evidence[0]?.claim||'Observation received')+'</span></div><div><b>CORR</b><span>Evidence grouped into '+esc(i.id)+'.</span></div><div><b>IMPACT</b><span>'+assets.length+' mapped dependencies found.</span></div><div><b>HUMAN</b><span>Awaiting human review before escalation.</span></div>';
  if(fly)map.flyTo([i.lat,i.lng],i.type==='Earthquake'?6:11,{duration:.8});
}

function syncLayers(){Object.entries(state.layers).forEach(([n,on])=>{if(on&&!map.hasLayer(groups[n]))groups[n].addTo(map);if(!on&&map.hasLayer(groups[n]))map.removeLayer(groups[n]);});}
document.querySelectorAll('[data-layer]').forEach(btn=>btn.onclick=()=>{const n=btn.dataset.layer;if(n==='fires'&&!state.data.fires?.configured){$('mapState').textContent='NASA FIRMS key required for fire layer.';return;}state.layers[n]=!state.layers[n];btn.classList.toggle('active',state.layers[n]);syncLayers();});

function runCopilot(query){
  const q=query.toLowerCase().trim(); const i=state.incidents.find(x=>x.id===state.selectedIncidentId)||state.incidents[0];
  let answer='I can explain the selected incident, show what needs attention, list evidence, show dependencies, focus London, or summarise weather.';
  if(/attention|highest|priority|risk/.test(q)){
    const top=state.incidents[0]; answer=top?'Highest current priority is '+top.title+', severity '+top.severity+', confidence '+top.confidence+'%.':'No current incident requires attention.'; if(top)selectIncident(top.id,true);
  }else if(/depend|infrastructure|asset/.test(q)&&i){
    const a=affectedAssets(i); answer=a.length?i.title+' is linked to '+a.length+' mapped TfL stops.':'No mapped dependency was found for the selected incident.'; selectIncident(i.id,false);
  }else if(/evidence|why|explain/.test(q)&&i){
    answer=i.title+': '+i.summary+' Confidence '+i.confidence+'%. Observed evidence: '+i.evidence.filter(e=>e.kind==='observed').length+'. Inferred evidence: '+i.evidence.filter(e=>e.kind==='inferred').length+'. '+i.recommendation;
  }else if(/earthquake/.test(q)){state.layers.earthquakes=true;document.querySelector('[data-layer="earthquakes"]').classList.add('active');syncLayers();answer='Earthquake layer enabled. USGS observations are shown globally.';}
  else if(/london|home|focus/.test(q)){map.flyTo([51.5074,-0.1278],10,{duration:.8});answer='Focused on London.';}
  else if(/weather/.test(q)){const c=state.data.weather?.current||{};answer='London weather: '+(c.temperature_2m??'?')+'°C, wind '+(c.wind_speed_10m??'?')+' km/h, gusts '+(c.wind_gusts_10m??'?')+' km/h.';}
  $('copilotAnswer').textContent=answer; log('Copilot query',query);
}
$('askBtn').onclick=()=>runCopilot($('copilotInput').value);
$('copilotInput').addEventListener('keydown',e=>{if(e.key==='Enter')runCopilot(e.target.value);});
$('voiceBtn').onclick=()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){$('copilotAnswer').textContent='Voice recognition is not available in this browser. Type the command instead.';return;}
  const r=new SR();r.lang='en-GB';r.interimResults=false;r.onresult=e=>{$('copilotInput').value=e.results[0][0].transcript;runCopilot($('copilotInput').value);};r.onerror=()=>{$('copilotAnswer').textContent='Voice input could not be captured.';};r.start();
};

function exportIncident(){
  const i=state.incidents.find(x=>x.id===state.selectedIncidentId);if(!i){$('reviewState').textContent='Select an incident first.';return;}
  const report={exportedAt:new Date().toISOString(),product:'Palm92 Situation Intelligence',principle:'AI investigates. Humans decide.',incident:i,audit:state.audit.filter(a=>a.detail.includes(i.id))};
  const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='palm92-'+i.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);log('Incident exported',i.id);
}
function saveScene(){
  const c=map.getCenter(),scene={time:new Date().toISOString(),lat:c.lat,lng:c.lng,zoom:map.getZoom(),incidentId:state.selectedIncidentId,layers:{...state.layers}};
  state.scenes.push(scene);state.scenes=state.scenes.slice(-20);localStorage.setItem('palm92-scenes',JSON.stringify(state.scenes));$('reviewState').textContent='Scene saved. '+state.scenes.length+' scene(s) stored locally.';log('Scene saved',state.selectedIncidentId||'map view');
}

async function refresh(){
  $('mapState').textContent='Refreshing live feeds...'; const rows=[];
  const [eq,tfl,wx,infra,fires]=await Promise.allSettled([getJson('/api/earthquakes'),getJson('/api/tfl'),getJson('/api/weather'),getJson('/api/infrastructure'),getJson('/api/fires')]);
  if(eq.status==='fulfilled'){state.data.earthquakes=eq.value;$('eqCount').textContent=eq.value.count;$('eqFresh').textContent='USGS · '+age(eq.value.retrievedAt);renderEarthquakes();rows.push({source:'USGS',ok:true,state:'Live',use:'Earthquakes'});}else{$('eqCount').textContent='ERR';rows.push({source:'USGS',ok:false,state:'Unavailable',use:'Earthquakes'});}
  if(tfl.status==='fulfilled'){state.data.transport=tfl.value;const issues=tfl.value.items.filter(x=>Number(x.severity)!==10);$('tflCount').textContent=issues.length;$('tflFresh').textContent='TfL · '+age(tfl.value.retrievedAt);renderTransport();rows.push({source:'TfL',ok:true,state:'Live',use:'Transport'});}else{$('tflCount').textContent='ERR';rows.push({source:'TfL',ok:false,state:'Unavailable',use:'Transport'});}
  if(wx.status==='fulfilled'){state.data.weather=wx.value;renderWeather();rows.push({source:'Open-Meteo',ok:true,state:'Live',use:'Weather'});}else rows.push({source:'Open-Meteo',ok:false,state:'Unavailable',use:'Weather'});
  if(infra.status==='fulfilled'){state.data.infrastructure=infra.value;renderInfrastructure();rows.push({source:'TfL StopPoint',ok:true,state:'Live',use:'Infrastructure'});}else rows.push({source:'TfL StopPoint',ok:false,state:'Unavailable',use:'Infrastructure'});
  if(fires.status==='fulfilled'){state.data.fires=fires.value;renderFires();rows.push({source:'NASA FIRMS',ok:!!fires.value.configured,state:fires.value.configured?'Live':'Needs key',use:'Active fires'});}else rows.push({source:'NASA FIRMS',ok:false,state:'Unavailable',use:'Active fires'});
  buildIncidents();renderIncidents();sourceRows(rows);syncLayers();
  const high=state.incidents.filter(x=>x.severity==='high').length,med=state.incidents.filter(x=>x.severity==='medium').length;
  $('riskPosture').textContent=high?'ELEVATED':med>=2?'WATCH':'NORMAL';$('mapState').textContent='Updated '+new Date().toLocaleTimeString()+' · '+state.incidents.length+' incidents';
  if(state.incidents[0])selectIncident(state.selectedIncidentId&&state.incidents.some(x=>x.id===state.selectedIncidentId)?state.selectedIncidentId:state.incidents[0].id,false);
  log('Feeds refreshed',state.incidents.length+' incidents');
}
$('refreshBtn').onclick=refresh;
$('reviewBtn').onclick=()=>{const i=state.incidents.find(x=>x.id===state.selectedIncidentId);if(!i)return $('reviewState').textContent='Select an incident first.';log('Human review',i.id);$('reviewState').textContent='Human review recorded locally for '+i.id+'.';};
$('escalateBtn').onclick=()=>{const i=state.incidents.find(x=>x.id===state.selectedIncidentId);if(!i)return $('reviewState').textContent='Select an incident first.';log('Escalation prepared',i.id);$('reviewState').textContent='Escalation package prepared for '+i.id+'. No external action executed.';};
$('exportBtn').onclick=exportIncident;$('sceneBtn').onclick=saveScene;
renderAudit();refresh();setInterval(refresh,120000);
