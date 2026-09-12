const $ = (id) => document.getElementById(id);

const state = {
  layers: { earthquakes: true, weather: true, transport: true, fires: false },
  data: { earthquakes: null, weather: null, transport: null, fires: null },
  markers: { earthquakes: [], weather: [], transport: [], fires: [] }
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
  earthquakes: L.layerGroup().addTo(map),
  weather: L.layerGroup().addTo(map),
  transport: L.layerGroup().addTo(map),
  fires: L.layerGroup()
};

function icon(kind, label) {
  return L.divIcon({
    className: '',
    html: `<div class="marker-dot marker-${kind}">${label}</div>`,
    iconSize: [30,30],
    iconAnchor: [15,15]
  });
}

function selectIntel(type, payload) {
  $('selectedType').textContent = type;
  const rows = Object.entries(payload).map(([k,v]) =>
    `<div class="intel-meta"><b>${escapeHtml(k)}</b><span>${escapeHtml(v)}</span></div>`
  ).join('');
  $('selectedPanel').innerHTML = `<div class="intel-title">${escapeHtml(payload.Title || payload.Location || payload.Name || type)}</div>${rows}`;
}

function clearGroup(name) {
  layerGroups[name].clearLayers();
  state.markers[name] = [];
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
    marker.on('click', () => selectIntel('Earthquake', {
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
  marker.on('click', () => selectIntel('Weather', {
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
  marker.on('click', () => selectIntel('Transport', {
    Location: 'London network',
    Issues: issues.length,
    Status: issues.length ? 'Disruption reported' : 'Good service on monitored lines',
    'Affected lines': issues.length ? issues.map(x => x.name).join(', ') : 'None',
    Source: data.source,
    Freshness: formatAge(data.retrievedAt),
    Authority: 'Operational status only. Human review required for escalation.'
  }));
  marker.addTo(layerGroups.transport);
  state.markers.transport.push(marker);
}

function renderFires() {
  clearGroup('fires');
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
    if (name === 'fires' && !state.data.fires?.configured) {
      $('mapState').textContent = 'NASA FIRMS needs a MAP_KEY before the fire layer can be enabled.';
      return;
    }
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
  $('transportList').innerHTML = '<div class="feed-row">Loading TfL...</div>';
  $('earthquakeList').innerHTML = '<div class="feed-row">Loading USGS...</div>';
  $('mapState').textContent = 'Refreshing live layers...';

  const states = [];
  let issueCount = 0;
  let significantQuakes = 0;

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
    significantQuakes = data.items.filter(x => Number(x.magnitude || 0) >= 4.5).length;
    $('earthquakeList').innerHTML = data.items.slice(0, 8).map(item => {
      const mag = Number(item.magnitude ?? 0).toFixed(1);
      const when = item.time ? new Date(item.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'unknown';
      return `<div class="feed-row"><strong>M${mag} · ${escapeHtml(item.title)}</strong><div class="meta">${when} · ${item.source}</div></div>`;
    }).join('') || '<div class="feed-row">No events returned.</div>';
    renderEarthquakes();
    states.push({source:'USGS',ok:true,state:'Live',use:'Earthquakes'});
  } else {
    $('eqCount').textContent = 'ERR';
    $('earthquakeList').innerHTML = `<div class="feed-row bad">${escapeHtml(eq.reason.message)}</div>`;
    states.push({source:'USGS',ok:false,state:'Unavailable',use:'Earthquakes'});
  }

  if (tfl.status === 'fulfilled') {
    state.data.transport = tfl.value;
    const data = tfl.value;
    const issues = data.items.filter(x => Number(x.severity) !== 10);
    issueCount = issues.length;
    $('tflCount').textContent = issueCount;
    $('tflFresh').textContent = `TfL · ${formatAge(data.retrievedAt)}`;
    $('tflBadge').textContent = issueCount ? `${issueCount} issue${issueCount === 1 ? '' : 's'}` : 'good service';
    $('transportList').innerHTML = data.items.map(line => {
      const problematic = Number(line.severity) !== 10;
      return `<div class="feed-row"><strong class="${problematic ? 'warn' : 'good'}">${escapeHtml(line.name)}: ${escapeHtml(line.status)}</strong><div class="meta">${escapeHtml(line.reason || 'No disruption reason reported.')}</div></div>`;
    }).join('');
    renderTransport();
    states.push({source:'TfL',ok:true,state:'Live',use:'Transport status'});
  } else {
    $('tflCount').textContent = 'ERR';
    $('transportList').innerHTML = `<div class="feed-row bad">${escapeHtml(tfl.reason.message)}</div>`;
    states.push({source:'TfL',ok:false,state:'Unavailable',use:'Transport status'});
  }

  if (weather.status === 'fulfilled') {
    state.data.weather = weather.value;
    const data = weather.value;
    const c = data.current || {};
    $('weatherTemp').textContent = Number.isFinite(c.temperature_2m) ? `${c.temperature_2m}°C` : 'N/A';
    $('weatherDetail').textContent = `Wind ${c.wind_speed_10m ?? '?'} km/h · gust ${c.wind_gusts_10m ?? '?'}`;
    renderWeather();
    states.push({source:'Open-Meteo',ok:true,state:'Live',use:'Current weather'});
  } else {
    $('weatherTemp').textContent = 'ERR';
    $('weatherDetail').textContent = weather.reason.message;
    states.push({source:'Open-Meteo',ok:false,state:'Unavailable',use:'Current weather'});
  }

  if (fires.status === 'fulfilled') {
    state.data.fires = fires.value;
    const data = fires.value;
    const fireBtn = document.querySelector('[data-layer="fires"]');
    if (data.configured) {
      $('fireState').textContent = 'READY';
      $('fireDetail').textContent = data.message;
      fireBtn.disabled = false;
      states.push({source:'NASA FIRMS',ok:true,state:'Key detected',use:'Active fires'});
    } else {
      $('fireState').textContent = 'KEY';
      $('fireDetail').textContent = 'NASA FIRMS key needed';
      fireBtn.disabled = false;
      states.push({source:'NASA FIRMS',ok:false,state:'Needs API key',use:'Active fires'});
    }
  } else {
    $('fireState').textContent = 'ERR';
    $('fireDetail').textContent = fires.reason.message;
    states.push({source:'NASA FIRMS',ok:false,state:'Unavailable',use:'Active fires'});
  }

  sourceState(states);
  syncLayerVisibility();

  const score = issueCount + significantQuakes;
  $('riskPosture').textContent = score >= 5 ? 'ELEVATED' : score >= 2 ? 'WATCH' : 'NORMAL';

  $('incidentTimeline').innerHTML = [
    `<div><b>LIVE</b><span>${issueCount} London transport issue(s) detected from TfL.</span></div>`,
    `<div><b>GLOBAL</b><span>${significantQuakes} earthquake(s) magnitude 4.5+ in the USGS daily feed.</span></div>`,
    `<div><b>MAP</b><span>Geospatial layers refreshed and ready for inspection.</span></div>`,
    `<div><b>GOV</b><span>Human confirmation is still required before escalation.</span></div>`
  ].join('');

  $('mapState').textContent = `Updated ${new Date().toLocaleTimeString()}`;
}

$('refreshBtn').addEventListener('click', refresh);
$('reviewBtn').addEventListener('click', () => {
  $('reviewState').textContent = `Human review recorded locally at ${new Date().toLocaleTimeString()} (demo only).`;
});

refresh();
setInterval(refresh, 120000);
