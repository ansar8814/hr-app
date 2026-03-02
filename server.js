const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const PORT = process.env.PORT || 3000;
const rootDir = __dirname;
const messagesFile = path.join(rootDir, 'data', 'messages.json');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const sendJson = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};

const serveFile = async (res, reqPath) => {
  const safePath = path.normalize(reqPath).replace(/^\.+/, '');
  const filePath = path.join(rootDir, safePath === '/' ? 'index.html' : safePath);

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
};

const readMessages = async () => {
  try {
    const raw = await fs.readFile(messagesFile, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveMessages = async (messages) => {
  await fs.writeFile(messagesFile, JSON.stringify(messages, null, 2));
};

const collectBody = (req) => new Promise((resolve, reject) => {
  let data = '';
  req.on('data', (chunk) => {
    data += chunk;
    if (data.length > 1e6) {
      reject(new Error('Payload too large'));
      req.destroy();
    }
  });
  req.on('end', () => resolve(data));
  req.on('error', reject);
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/contact') {
    try {
      const rawBody = await collectBody(req);
      const { name, email, company, message } = JSON.parse(rawBody || '{}');

      if (!name || name.trim().length < 2) {
        return sendJson(res, 400, { error: 'Name is required (min 2 chars).' });
      }
      if (!isEmail(email || '')) {
        return sendJson(res, 400, { error: 'A valid email is required.' });
      }
      if (!company || company.trim().length < 2) {
        return sendJson(res, 400, { error: 'Company is required (min 2 chars).' });
      }
      if (!message || message.trim().length < 10) {
        return sendJson(res, 400, { error: 'Message is required (min 10 chars).' });
      }

      const entry = {
        id: Date.now().toString(),
        name: name.trim(),
        email: email.trim(),
        company: company.trim(),
        message: message.trim(),
        createdAt: new Date().toISOString(),
      };

      const messages = await readMessages();
      messages.push(entry);
      await saveMessages(messages);

      return sendJson(res, 201, { ok: true, message: 'Message received.' });
    } catch {
      return sendJson(res, 400, { error: 'Invalid request payload.' });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/contact') {
    const messages = await readMessages();
    return sendJson(res, 200, messages);
  }

  return serveFile(res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
