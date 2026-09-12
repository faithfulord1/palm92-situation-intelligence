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

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
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
  console.log(`Palm92 Situation Intelligence running at http://${host}:${port}`);
});
