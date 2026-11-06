const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = __dirname;
const CUSTOM_LEVELS_PATH = path.join(ROOT, 'js', 'custom_levels.js');
const SCOREBOARD_PATH = path.join(ROOT, 'scoreboard.json');

// --- Helpers ---------------------------------------------------------------

function decodedPath(pathname) {
    try {
        return decodeURIComponent(pathname);
    } catch (err) {
        return pathname;
    }
}

function sendJSON(res, status, body) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify(body));
}

function readJSON(file, fallback) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
        return fallback;
    }
}

function writeJSON(file, value) {
    fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf8');
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 10_000_000) {
                reject(new Error('body too large'));
                req.destroy();
            }
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                reject(err);
            }
        });
        req.on('error', reject);
    });
}

// --- Levels ----------------------------------------------------------------

function loadLevels() {
    const empty = { levels: [] };
    let raw;
    try {
        raw = fs.readFileSync(CUSTOM_LEVELS_PATH, 'utf8');
    } catch (err) {
        if (err.code === 'ENOENT') {
            fs.writeFileSync(CUSTOM_LEVELS_PATH, 'window.levels = [];', 'utf8');
        }
        return empty;
    }

    // Extract JSON from the JS file: strip "window.levels = ...;".
    let jsonStr = raw.trim();
    jsonStr = jsonStr.replace(/^window\.levels\s*/i, '');
    jsonStr = jsonStr.replace(/^=/, '').trim();
    jsonStr = jsonStr.replace(/;$/, '').trim();

    if (jsonStr === '') return empty;

    try {
        const levels = JSON.parse(jsonStr);
        if (Array.isArray(levels)) {
            return { levels };
        }
        if (levels && Array.isArray(levels.levels)) {
            return levels;
        }
        return empty;
    } catch (err) {
        // Reset the corrupt file and return empty, matching the Go behavior.
        fs.writeFileSync(CUSTOM_LEVELS_PATH, 'window.levels = [];', 'utf8');
        return empty;
    }
}

function saveLevel(level) {
    const existing = loadLevels();
    existing.levels.push(level);
    const jsContent = 'window.levels = ' + JSON.stringify(existing.levels, null, 4) + ';';
    fs.writeFileSync(CUSTOM_LEVELS_PATH, jsContent, 'utf8');
}

// --- Scoreboard ------------------------------------------------------------

function loadScoreboard() {
    return readJSON(SCOREBOARD_PATH, { scores: [] });
}

function saveScoreboard(sb) {
    writeJSON(SCOREBOARD_PATH, sb);
}

// --- Static files ----------------------------------------------------------

const MIME = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

function serveStatic(res, pathname) {
    let filePath = path.normalize(path.join(ROOT, pathname === '/' ? 'bananoid.html' : pathname));
    if (!filePath.startsWith(ROOT)) {
        return sendJSON(res, 403, { error: 'Forbidden' });
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        filePath = path.join(ROOT, 'bananoid.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('Not found');
        }
        res.writeHead(200, {
            'Content-Type': mime,
            'Access-Control-Allow-Origin': '*',
        });
        res.end(data);
    });
}

// --- Server ----------------------------------------------------------------

const server = http.createServer(async (req, res) => {
    const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = decodedPath(parsed.pathname);

    try {
        if (pathname === '/api/levels' && req.method === 'GET') {
            return sendJSON(res, 200, loadLevels());
        }

        if (pathname === '/api/levels/save') {
            if (req.method !== 'POST') {
                return sendJSON(res, 405, { error: 'Method not allowed' });
            }
            const level = await readBody(req);
            if (level == null || !Array.isArray(level.data)) {
                return sendJSON(res, 400, { error: 'Missing required field: data' });
            }
            saveLevel(level);
            return sendJSON(res, 200, { status: 'success' });
        }

        if (pathname === '/api/scoreboard' && req.method === 'GET') {
            const page = Math.max(1, parseInt(parsed.searchParams.get('page'), 10) || 1);
            const pageSize = Math.max(1, parseInt(parsed.searchParams.get('pageSize'), 10) || 5);
            const sb = loadScoreboard();
            const scores = sb.scores.slice().sort((a, b) => b.score - a.score);
            const total = scores.length;
            const totalPages = Math.max(1, Math.ceil(total / pageSize));
            const p = Math.min(page, totalPages);
            const start = (p - 1) * pageSize;
            return sendJSON(res, 200, {
                scores: scores.slice(start, start + pageSize),
                page: p,
                totalPages,
                total,
            });
        }

        if (pathname === '/api/scoreboard' && req.method === 'POST') {
            const entry = await readBody(req);
            if (!entry || !entry.name || entry.score < 0 || entry.time < 0) {
                return sendJSON(res, 400, { error: 'Missing required fields' });
            }
            const sb = loadScoreboard();
            entry.timestamp = Math.floor(Date.now() / 1000);
            sb.scores.push(entry);
            sb.scores.sort((a, b) => b.score - a.score);
            if (sb.scores.length > 1000) {
                sb.scores = sb.scores.slice(0, 1000);
            }
            saveScoreboard(sb);

            const rank = sb.scores.findIndex(
                (s) => s.score === entry.score && s.timestamp === entry.timestamp
            ) + 1;
            const total = sb.scores.length;
            const percentile = 100 - Math.round((rank * 100) / total);

            return sendJSON(res, 200, {
                status: 'success',
                rank,
                total,
                percentile,
            });
        }

        return serveStatic(res, pathname);
    } catch (err) {
        console.error(err);
        sendJSON(res, 500, { error: 'Internal server error' });
    }
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
