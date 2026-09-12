const $ = (id) => document.getElementById(id);

const state = {
  layers: { incidents: true, earthquakes: true, weather: true, transport: true },
  data: { earthquakes: null, weather: null, transport: null, fires: null },
  incidents: [],
  selectedIncidentId: null,
  markers: { incidents: [], earthquakes: [], weather: [], transport: [] }
};

const formatAge = (iso) => {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
};

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

async function getJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Feed failed');
  return data;
}

const map = L.map('map', { zoomControl: true, worldCopyJump: true }).setView([51.5074, -0.1278], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const layerGroups = {
  incidents: L.layerGroup().addTo(map),
  earthquakes: L.layerGroup().addTo(map),
  weather: L.layerGroup().addTo(map),
  transport: L.layerGroup().addTo(map)
};

function icon(kind, label, severity = '') {
  return L.divIcon({
    className: '',
    html: `<div class="marker-dot marker-${kind} ${severity}">${escapeHtml(label)}</div>`,
    iconSize: [32,32],
    iconAnchor: [16,16]
  });
}

function clearGroup(name) {
  layerGroups[name].clearLayers();
  state.markers[name] = [];
}

function selectIntel(type, payload) {
  $('selectedType').textContent = type;
  const rows = Object.entries(payload).map(([k,v]) =>
    `<div class="intel-meta"><b>${escapeHtml(k)}</b><span>${escapeHtml(v)}</span></div>`
  ).join('');
  $('selectedPanel').innerHTML = `<div class="intel-title">${escapeHtml(payload.Title || payload.Location || payload.Name || type)}</div>${rows}`;
}

function confidenceLabel(score) {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  return 'Low';
}

function buildIncidents() {
  const incidents = [];
  const tfl = state.data.transport;
  const wx = state.data.weather;
  const eq = state.data.earthquakes;

  if (tfl) {
    const issues = tfl.items.filter(x => Number(x.severity) !== 10);
    issues.forEach((issue, index) => {
      const c = wx?.current || {};
      const weatherStress = Number(c.wind_gusts_10m || 0) >= 45 || Number(c.precipitation || 0) > 0;
      const evidence = [
        {
          kind: 'observed',
          source: 'Transport for London',
          claim: `${issue.name}: ${issue.status}`,
          freshness: formatAge(tfl.retrievedAt)
        }
      ];
      let confidence = 72;
      if (issue.reason) confidence += 8;
      if (wx) {
        evidence.push({
          kind: 'observed',
          source: 'Open-Meteo',
          claim: `London weather: ${c.temperature_2m ?? '?'}°C, wind ${c.wind_speed_10m ?? '?'} km/h, gusts ${c.wind_gusts_10m ?? '?'} km/h`,
          freshness: formatAge(wx.retrievedAt)
        });
        confidence += 5;
      }
      if (weatherStress) {
        evidence.push({
          kind: 'inferred',
          source: 'Palm92 correlation rule',
          claim: 'Current weather may increase operational pressure. This is an inference, not confirmed causation.',
          freshness: 'computed now'
        });
        confidence += 5;
      }
      confidence = Math.min(confidence, 92);

      const severity = Number(issue.severity) <= 5 ? 'high' : 'medium';
      incidents.push({
        id: `tfl-${issue.id}-${index}`,
        type: 'Transport disruption',
        title: `${issue.name} disruption`,
        location: 'London transport network',
        lat: 51.515 + (index * 0.01),
        lng: -0.10 + (index * 0.015),
        severity,
        confidence,
        status: 'Unconfirmed incident object',
        summary: issue.reason || `${issue.status} reported on the ${issue.name} line.`,
        evidence,
        impact: [
          ['Signal', `${issue.name}: ${issue.status}`],
          ['Asset', 'Affected line / stations'],
          ['Service', 'Journey reliability'],
          ['People', 'Passengers'],
          ['Mitigation', 'Review alternatives and communications'],
          ['Recovery', 'Return to normal service']
        ],
        recommendation: 'Review the reported disruption, verify any high-impact claims with additional sources, and prepare a passenger-impact brief if disruption persists.'
      });
    });
  }

  if (eq) {
    eq.items.filter(x => Number(x.magnitude || 0) >= 5).slice(0, 4).forEach((item, index) => {
      const [lng, lat, depth] = item.coordinates || [];
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const magnitude = Number(item.magnitude || 0);
      incidents.push({
        id: `eq-${item.id}`,
        type: 'Earthquake',
        title: `M${magnitude.toFixed(1)} earthquake`,
        location: item.title,
        lat,
        lng,
        severity: magnitude >= 6.5 ? 'high' : 'medium',
        confidence: 94,
        status: 'Observed event',
        summary: `USGS reported a magnitude ${magnitude.toFixed(1)} earthquake at ${item.title}.`,
        evidence: [{
          kind: 'observed',
          source: 'USGS',
          claim: `Magnitude ${magnitude.toFixed(1)}, depth ${Number.isFinite(depth) ? depth + ' km' : 'unknown'}`,
          freshness: formatAge(eq.retrievedAt)
        }],
        impact: [
          ['Hazard', `M${magnitude.toFixed(1)} earthquake`],
          ['Location', item.title],
          ['Infrastructure', 'Potentially exposed local assets'],
          ['Services', 'Transport / utilities may require checks'],
          ['People', 'Local population'],
          ['Action', 'Verify official impact reports']
        ],
        recommendation: 'Monitor official local reports and infrastructure-status sources before making any impact conclusion.'
      });
    });
  }

  state.incidents = incidents.sort((a,b) => b.confidence - a.confidence);
}

function renderIncidents() {
  clearGroup('incidents');
  $('incidentCount').textContent = state.incidents.length;
  $('incidentFresh').textContent = `built ${new Date().toLocaleTimeString()}`;
  $('incidentBadge').textContent = `${state.incidents.length} open`;

  $('incidentList').innerHTML = state.incidents.length
    ? state.incidents.map(i => `
      <div class="feed-row incident-card ${i.severity}" data-incident-id="${escapeHtml(i.id)}">
        <strong>${escapeHtml(i.title)}</strong>
        <div class="meta">${escapeHtml(i.location)} · ${escapeHtml(i.severity.toUpperCase())}</div>
        <span class="confidence">${i.confidence}% confidence · ${confidenceLabel(i.confidence)}</span>
      </div>`).join('')
    : '<div class="feed-row">No incident objects generated from current feeds.</div>';

  document.querySelectorAll('[data-incident-id]').forEach(el => {
    el.addEventListener('click', () => selectIncident(el.dataset.incidentId, true));
  });

  state.incidents.forEach(i => {
    const marker = L.marker([i.lat,i.lng], { icon: icon('incident', '!', i.severity) });
    marker.on('click', () => selectIncident(i.id, false));
    marker.addTo(layerGroups.incidents);
    state.markers.incidents.push(marker);
  });
}

function selectIncident(id, fly) {
  const i = state.incidents.find(x => x.id === id);
  if (!i) return;
  state.selectedIncidentId = id;
  $('selectedType').textContent = i.type;
  $('selectedPanel').innerHTML = `
    <div class="intel-title">${escapeHtml(i.title)}</div>
    <div class="intel-meta"><b>Status</b><span>${escapeHtml(i.status)}</span></div>
    <div class="intel-meta"><b>Severity</b><span>${escapeHtml(i.severity.toUpperCase())}</span></div>
    <div class="intel-meta"><b>Confidence</b><span>${i.confidence}% · ${confidenceLabel(i.confidence)}</span></div>
    <div class="intel-meta"><b>Location</b><span>${escapeHtml(i.location)}</span></div>
    <div class="intel-meta"><b>Summary</b><span>${escapeHtml(i.summary)}</span></div>
    <div class="intel-meta"><b>Authority</b><span>Decision support only. Human confirmation required.</span></div>
  `;

  $('impactPath').innerHTML = `<div class="impact-path">${i.impact.map((step,index) =>
    `${index ? '<div class="impact-arrow">→</div>' : ''}<div class="impact-node"><b>${escapeHtml(step[0])}</b><span>${escapeHtml(step[1])}</span></div>`
  ).join('')}</div>`;

  $('evidenceBundle').innerHTML = i.evidence.map(e => `
    <div class="evidence-item">
      <div class="evidence-head">
        <strong>${escapeHtml(e.source)}</strong>
        <span class="evidence-tag ${e.kind}">${escapeHtml(e.kind)}</span>
      </div>
      <p>${escapeHtml(e.claim)}</p>
      <small>Freshness: ${escapeHtml(e.freshness)}</small>
    </div>
  `).join('');

  $('recommendationPanel').innerHTML = `
    <div class="recommendation">
      <strong>AI-prepared recommendation</strong>
      <p>${escapeHtml(i.recommendation)}</p>
      <small>This is a proposal, not an executed action.</small>
    </div>
  `;

  $('incidentTimeline').innerHTML = [
    `<div><b>OBS</b><span>${escapeHtml(i.evidence[0]?.claim || 'Source evidence received')}</span></div>`,
    `<div><b>CORR</b><span>Palm92 grouped the evidence into incident ${escapeHtml(i.id)}.</span></div>`,
    `<div><b>RISK</b><span>Severity ${escapeHtml(i.severity)} with ${i.confidence}% confidence.</span></div>`,
    `<div><b>HUMAN</b><span>Awaiting human review before any escalation.</span></div>`
  ].join('');

  if (fly) map.flyTo([i.lat,i.lng], i.type === 'Earthquake' ? 6 : 11, { duration: 0.8 });
}

function renderEarthquakes() {
  clearGroup('earthquakes');
  const data = state.data.earthquakes;
  if (!data) return;
  data.items.forEach(item => {
    const [lng, lat, depth] = item.coordinates || [];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const mag = Number(item.magnitude ?? 0);
    const marker = L.marker([lat,lng], { icon: icon('eq', mag.toFixed(1)) });
    marker.on('click', () => selectIntel('Earthquake observation', {
      Title: item.title,
      Magnitude: mag.toFixed(1),
      Depth: Number.isFinite(depth) ? `${depth} km` : 'Unknown',
      Time: item.time ? new Date(item.time).toLocaleString() : 'Unknown',
      Source: item.source,
      Freshness: formatAge(data.retrievedAt),
      Confidence: 'Observed source data'
    }));
    marker.addTo(layerGroups.earthquakes);
    state.markers.earthquakes.push(marker);
  });
}

function renderWeather() {
  clearGroup('weather');
  const data = state.data.weather;
  if (!data) return;
  const c = data.current || {};
  const marker = L.marker([51.5074,-0.1278], { icon: icon('wx', 'WX') });
  marker.on('click', () => selectIntel('Weather observation', {
    Location: 'London',
    Temperature: Number.isFinite(c.temperature_2m) ? `${c.temperature_2m} °C` : 'Unknown',
    'Feels like': Number.isFinite(c.apparent_temperature) ? `${c.apparent_temperature} °C` : 'Unknown',
    Wind: Number.isFinite(c.wind_speed_10m) ? `${c.wind_speed_10m} km/h` : 'Unknown',
    Gusts: Number.isFinite(c.wind_gusts_10m) ? `${c.wind_gusts_10m} km/h` : 'Unknown',
    Precipitation: Number.isFinite(c.precipitation) ? `${c.precipitation} mm` : 'Unknown',
    Source: data.source,
    Freshness: formatAge(data.retrievedAt)
  }));
  marker.addTo(layerGroups.weather);
  state.markers.weather.push(marker);
}

function renderTransport() {
  clearGroup('transport');
  const data = state.data.transport;
  if (!data) return;
  const issues = data.items.filter(x => Number(x.severity) !== 10);
  const marker = L.marker([51.515,-0.10], { icon: icon('tfl', issues.length ? String(issues.length) : 'OK') });
  marker.on('click', () => selectIntel('Transport observation', {
    Location: 'London network',
    Issues: issues.length,
    Status: issues.length ? 'Disruption reported' : 'Good service on monitored lines',
    'Affected lines': issues.length ? issues.map(x => x.name).join(', ') : 'None',
    Source: data.source,
    Freshness: formatAge(data.retrievedAt)
  }));
  marker.addTo(layerGroups.transport);
  state.markers.transport.push(marker);
}

function syncLayerVisibility() {
  Object.entries(state.layers).forEach(([name,enabled]) => {
    if (enabled && !map.hasLayer(layerGroups[name])) layerGroups[name].addTo(map);
    if (!enabled && map.hasLayer(layerGroups[name])) map.removeLayer(layerGroups[name]);
  });
}

document.querySelectorAll('[data-layer]').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.layer;
    state.layers[name] = !state.layers[name];
    btn.classList.toggle('active', state.layers[name]);
    syncLayerVisibility();
  });
});

function sourceState(rows) {
  $('sourceTable').innerHTML = rows.map(r =>
    `<tr><td>${r.source}</td><td class="${r.ok ? 'good' : 'warn'}">${r.state}</td><td>${r.use}</td></tr>`
  ).join('');
}

async function refresh() {
  $('riskPosture').textContent = 'LOADING';
  $('incidentList').innerHTML = '<div class="feed-row">Building incident objects...</div>';
  $('transportList').innerHTML = '<div class="feed-row">Loading TfL...</div>';
  $('earthquakeList').innerHTML = '<div class="feed-row">Loading USGS...</div>';
  $('mapState').textContent = 'Refreshing live layers and correlations...';

  const states = [];
  const [eq, tfl, weather, fires] = await Promise.allSettled([
    getJson('/api/earthquakes'),
    getJson('/api/tfl'),
    getJson('/api/weather'),
    getJson('/api/fires')
  ]);

  if (eq.status === 'fulfilled') {
    state.data.earthquakes = eq.value;
    const data = eq.value;
    $('eqCount').textContent = data.count;
    $('eqFresh').textContent = `USGS · ${formatAge(data.retrievedAt)}`;
    $('earthquakeList').innerHTML = data.items.slice(0, 8).map(item => {
      const mag = Number(item.magnitude ?? 0).toFixed(1);
      return `<div class="feed-row"><strong>M${mag} · ${escapeHtml(item.title)}</strong><div class="meta">${item.time ? new Date(item.time).toLocaleString() : 'unknown'} · ${item.source}</div></div>`;
    }).join('') || '<div class="feed-row">No events returned.</div>';
    renderEarthquakes();
    states.push({source:'USGS',ok:true,state:'Live',use:'Earthquakes'});
  } else {
    $('eqCount').textContent = 'ERR';
    states.push({source:'USGS',ok:false,state:'Unavailable',use:'Earthquakes'});
  }

  if (tfl.status === 'fulfilled') {
    state.data.transport = tfl.value;
    const data = tfl.value;
    const issues = data.items.filter(x => Number(x.severity) !== 10);
    $('tflCount').textContent = issues.length;
    $('tflFresh').textContent = `TfL · ${formatAge(data.retrievedAt)}`;
    $('tflBadge').textContent = issues.length ? `${issues.length} issue${issues.length === 1 ? '' : 's'}` : 'good service';
    $('transportList').innerHTML = data.items.map(line => {
      const problematic = Number(line.severity) !== 10;
      return `<div class="feed-row"><strong class="${problematic ? 'warn' : 'good'}">${escapeHtml(line.name)}: ${escapeHtml(line.status)}</strong><div class="meta">${escapeHtml(line.reason || 'No disruption reason reported.')}</div></div>`;
    }).join('');
    renderTransport();
    states.push({source:'TfL',ok:true,state:'Live',use:'Transport status'});
  } else {
    $('tflCount').textContent = 'ERR';
    states.push({source:'TfL',ok:false,state:'Unavailable',use:'Transport status'});
  }

  if (weather.status === 'fulfilled') {
    state.data.weather = weather.value;
    const c = weather.value.current || {};
    $('weatherTemp').textContent = Number.isFinite(c.temperature_2m) ? `${c.temperature_2m}°C` : 'N/A';
    $('weatherDetail').textContent = `Wind ${c.wind_speed_10m ?? '?'} km/h · gust ${c.wind_gusts_10m ?? '?'}`;
    renderWeather();
    states.push({source:'Open-Meteo',ok:true,state:'Live',use:'Current weather'});
  } else {
    $('weatherTemp').textContent = 'ERR';
    states.push({source:'Open-Meteo',ok:false,state:'Unavailable',use:'Current weather'});
  }

  if (fires.status === 'fulfilled') {
    state.data.fires = fires.value;
    const data = fires.value;
    states.push({source:'NASA FIRMS',ok:!!data.configured,state:data.configured?'Key detected':'Needs API key',use:'Active fires'});
  } else {
    states.push({source:'NASA FIRMS',ok:false,state:'Unavailable',use:'Active fires'});
  }

  sourceState(states);
  buildIncidents();
  renderIncidents();
  syncLayerVisibility();

  const high = state.incidents.filter(x => x.severity === 'high').length;
  const medium = state.incidents.filter(x => x.severity === 'medium').length;
  $('riskPosture').textContent = high ? 'ELEVATED' : medium >= 2 ? 'WATCH' : 'NORMAL';
  $('mapState').textContent = `Updated ${new Date().toLocaleTimeString()} · ${state.incidents.length} incident objects`;

  if (state.selectedIncidentId && state.incidents.some(x => x.id === state.selectedIncidentId)) {
    selectIncident(state.selectedIncidentId, false);
  } else if (state.incidents[0]) {
    selectIncident(state.incidents[0].id, false);
  }
}

$('refreshBtn').addEventListener('click', refresh);
$('reviewBtn').addEventListener('click', () => {
  const incident = state.incidents.find(x => x.id === state.selectedIncidentId);
  $('reviewState').textContent = incident
    ? `Human review recorded locally for ${incident.id} at ${new Date().toLocaleTimeString()} (demo only).`
    : 'Select an incident first.';
});
$('escalateBtn').addEventListener('click', () => {
  const incident = state.incidents.find(x => x.id === state.selectedIncidentId);
  $('reviewState').textContent = incident
    ? `Escalation prepared for ${incident.id}. No external action has been executed. Human approval is still required.`
    : 'Select an incident first.';
});

refresh();
setInterval(refresh, 120000);
