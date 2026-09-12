const $ = (id) => document.getElementById(id);

const formatAge = (iso) => {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
};

async function getJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Feed failed');
  return data;
}

function sourceState(rows) {
  $('sourceTable').innerHTML = rows.map(r =>
    `<tr><td>${r.source}</td><td class="${r.ok ? 'good' : 'warn'}">${r.state}</td><td>${r.use}</td></tr>`
  ).join('');
}

async function refresh() {
  $('riskPosture').textContent = 'LOADING';
  $('transportList').innerHTML = '<div class="feed-row">Loading TfL...</div>';
  $('earthquakeList').innerHTML = '<div class="feed-row">Loading USGS...</div>';

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
    const data = eq.value;
    $('eqCount').textContent = data.count;
    $('eqFresh').textContent = `USGS · ${formatAge(data.retrievedAt)}`;
    const items = data.items.slice(0, 8);
    significantQuakes = data.items.filter(x => Number(x.magnitude || 0) >= 4.5).length;
    $('earthquakeList').innerHTML = items.map(item => {
      const mag = Number(item.magnitude ?? 0).toFixed(1);
      const when = item.time ? new Date(item.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'unknown';
      return `<div class="feed-row"><strong>M${mag} · ${item.title}</strong><div class="meta">${when} · ${item.source}</div></div>`;
    }).join('') || '<div class="feed-row">No events returned.</div>';
    states.push({source:'USGS',ok:true,state:'Live',use:'Earthquakes'});
  } else {
    $('eqCount').textContent = 'ERR';
    $('earthquakeList').innerHTML = `<div class="feed-row bad">${eq.reason.message}</div>`;
    states.push({source:'USGS',ok:false,state:'Unavailable',use:'Earthquakes'});
  }

  if (tfl.status === 'fulfilled') {
    const data = tfl.value;
    const issues = data.items.filter(x => Number(x.severity) !== 10);
    issueCount = issues.length;
    $('tflCount').textContent = issueCount;
    $('tflFresh').textContent = `TfL · ${formatAge(data.retrievedAt)}`;
    $('tflBadge').textContent = issueCount ? `${issueCount} issue${issueCount === 1 ? '' : 's'}` : 'good service';
    $('transportList').innerHTML = data.items.map(line => {
      const problematic = Number(line.severity) !== 10;
      return `<div class="feed-row"><strong class="${problematic ? 'warn' : 'good'}">${line.name}: ${line.status}</strong><div class="meta">${line.reason || 'No disruption reason reported.'}</div></div>`;
    }).join('');
    states.push({source:'TfL',ok:true,state:'Live',use:'Transport status'});
  } else {
    $('tflCount').textContent = 'ERR';
    $('transportList').innerHTML = `<div class="feed-row bad">${tfl.reason.message}</div>`;
    states.push({source:'TfL',ok:false,state:'Unavailable',use:'Transport status'});
  }

  if (weather.status === 'fulfilled') {
    const data = weather.value;
    const c = data.current || {};
    $('weatherTemp').textContent = Number.isFinite(c.temperature_2m) ? `${c.temperature_2m}°C` : 'N/A';
    $('weatherDetail').textContent = `Wind ${c.wind_speed_10m ?? '?'} km/h · gust ${c.wind_gusts_10m ?? '?'}`;
    states.push({source:'Open-Meteo',ok:true,state:'Live',use:'Current weather'});
  } else {
    $('weatherTemp').textContent = 'ERR';
    $('weatherDetail').textContent = weather.reason.message;
    states.push({source:'Open-Meteo',ok:false,state:'Unavailable',use:'Current weather'});
  }

  if (fires.status === 'fulfilled') {
    const data = fires.value;
    if (data.configured) {
      $('fireState').textContent = 'READY';
      $('fireDetail').textContent = data.message;
      states.push({source:'NASA FIRMS',ok:true,state:'Key detected',use:'Active fires'});
    } else {
      $('fireState').textContent = 'KEY';
      $('fireDetail').textContent = 'NASA FIRMS key needed';
      states.push({source:'NASA FIRMS',ok:false,state:'Needs API key',use:'Active fires'});
    }
  } else {
    $('fireState').textContent = 'ERR';
    $('fireDetail').textContent = fires.reason.message;
    states.push({source:'NASA FIRMS',ok:false,state:'Unavailable',use:'Active fires'});
  }

  sourceState(states);

  const score = issueCount + significantQuakes;
  $('riskPosture').textContent = score >= 5 ? 'ELEVATED' : score >= 2 ? 'WATCH' : 'NORMAL';

  const entries = [];
  entries.push(`<div><b>LIVE</b><span>${issueCount} London transport issue(s) detected from TfL.</span></div>`);
  entries.push(`<div><b>GLOBAL</b><span>${significantQuakes} earthquake(s) magnitude 4.5+ in the USGS daily feed.</span></div>`);
  entries.push(`<div><b>GOV</b><span>Automated collection complete. Human confirmation is still required before escalation.</span></div>`);
  $('incidentTimeline').innerHTML = entries.join('');
}

$('refreshBtn').addEventListener('click', refresh);
$('reviewBtn').addEventListener('click', () => {
  $('reviewState').textContent = `Human review recorded locally at ${new Date().toLocaleTimeString()} (demo only).`;
});

refresh();
setInterval(refresh, 120000);
