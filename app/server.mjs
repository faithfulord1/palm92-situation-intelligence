import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const host = '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const root = new URL('./public/', import.meta.url).pathname;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetchWithTimeout(url, options);
  return response.json();
}

async function fetchText(url, options = {}) {
  const response = await fetchWithTimeout(url, options);
  return response.text();
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (c === '"' && quoted && n === '"') { field += '"'; i++; continue; }
    if (c === '"') { quoted = !quoted; continue; }
    if (c === ',' && !quoted) { row.push(field); field = ''; continue; }
    if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && n === '\n') i++;
      row.push(field); field = '';
      if (row.some(v => v !== '')) rows.push(row);
      row = [];
      continue;
    }
    field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows.shift().map(h => h.trim());
  return rows.map(values => Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ''])));
}

async function api(req, res, path) {
  if (path === '/api/health') {
    return json(res, 200, { ok: true, service: 'Palm92 Situation Intelligence', version: '1.0.0', time: new Date().toISOString() });
  }

  if (path === '/api/earthquakes') {
    try {
      const data = await fetchJson('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');
      const items = (data.features || []).slice(0, 80).map((f) => ({
        id: f.id,
        title: f.properties?.place || 'Unknown location',
        magnitude: f.properties?.mag,
        time: f.properties?.time,
        updated: f.properties?.updated,
        url: f.properties?.url,
        coordinates: f.geometry?.coordinates || [],
        source: 'USGS'
      }));
      return json(res, 200, { source: 'USGS', retrievedAt: new Date().toISOString(), count: items.length, items });
    } catch (error) {
      return json(res, 502, { error: 'Earthquake feed unavailable', detail: error.message });
    }
  }

  if (path === '/api/tfl') {
    try {
      const data = await fetchJson('https://api.tfl.gov.uk/Line/Mode/tube,overground,dlr,elizabeth-line/Status');
      const items = (data || []).map((line) => {
        const status = line.lineStatuses?.[0];
        return {
          id: line.id,
          name: line.name,
          severity: status?.statusSeverity ?? null,
          status: status?.statusSeverityDescription || 'Unknown',
          reason: status?.reason || null,
          source: 'TfL'
        };
      });
      return json(res, 200, { source: 'Transport for London', retrievedAt: new Date().toISOString(), count: items.length, items });
    } catch (error) {
      return json(res, 502, { error: 'TfL feed unavailable', detail: error.message });
    }
  }

  if (path === '/api/infrastructure') {
    try {
      const data = await fetchJson('https://api.tfl.gov.uk/StopPoint/Mode/tube,overground,dlr,elizabeth-line');
      const items = (data.stopPoints || []).filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lon)).slice(0, 220).map((s) => ({
        id: s.id,
        name: s.commonName,
        lat: s.lat,
        lng: s.lon,
        modes: s.modes || [],
        lines: (s.lines || []).map(l => ({ id: l.id, name: l.name })),
        source: 'TfL StopPoint'
      }));
      return json(res, 200, { source: 'Transport for London StopPoint', retrievedAt: new Date().toISOString(), count: items.length, items });
    } catch (error) {
      return json(res, 502, { error: 'Infrastructure feed unavailable', detail: error.message });
    }
  }

  if (path === '/api/weather') {
    try {
      const data = await fetchJson('https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m&hourly=precipitation_probability&timezone=Europe%2FLondon&forecast_days=1');
      return json(res, 200, {
        source: 'Open-Meteo',
        retrievedAt: new Date().toISOString(),
        location: 'London',
        current: data.current || {},
        hourly: {
          time: (data.hourly?.time || []).slice(0, 24),
          precipitationProbability: (data.hourly?.precipitation_probability || []).slice(0, 24)
        }
      });
    } catch (error) {
      return json(res, 502, { error: 'Weather feed unavailable', detail: error.message });
    }
  }

  if (path === '/api/fires') {
    const mapKey = process.env.NASA_FIRMS_MAP_KEY;
    if (!mapKey) {
      return json(res, 200, { source: 'NASA FIRMS', configured: false, message: 'Set NASA_FIRMS_MAP_KEY to enable live active-fire detections.', items: [] });
    }
    try {
      const csv = await fetchText(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(mapKey)}/VIIRS_SNPP_NRT/-12,48,4,61/1`);
      const items = parseCsv(csv).slice(0, 300).map((r, i) => ({
        id: `firms-${r.latitude}-${r.longitude}-${r.acq_date}-${r.acq_time}-${i}`,
        lat: Number(r.latitude),
        lng: Number(r.longitude),
        brightness: Number(r.bright_ti4 || r.brightness || 0),
        confidence: r.confidence || 'unknown',
        acqDate: r.acq_date,
        acqTime: r.acq_time,
        satellite: r.satellite || 'VIIRS',
        source: 'NASA FIRMS'
      })).filter(x => Number.isFinite(x.lat) && Number.isFinite(x.lng));
      return json(res, 200, { source: 'NASA FIRMS', configured: true, retrievedAt: new Date().toISOString(), count: items.length, items });
    } catch (error) {
      return json(res, 502, { error: 'NASA FIRMS feed unavailable', detail: error.message });
    }
  }

  return json(res, 404, { error: 'API route not found' });
}

const server = http.createServer(async (req, res) => {
  const path = (req.url || '/').split('?')[0];
  if (path.startsWith('/api/')) return api(req, res, path);

  try {
    const urlPath = path === '/' ? '/index.html' : path;
    const safePath = normalize(urlPath).replace(/^([.][.][/\\])+/, '');
    const filePath = join(root, safePath);
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': types[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(port, host, () => {
  console.log(`Palm92 Situation Intelligence v1.0 running at http://${host}:${port}`);
});
