const express = require('express');
const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');
const { isSameWeek, isSameMonth, isSameYear } = require('date-fns');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const DATA_FILE = path.join(__dirname, 'sources.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readSources() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data).sources || [];
  } catch (err) {
    return [];
  }
}

function writeSources(sources) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ sources }, null, 2));
}

app.get('/api/sources', (req, res) => {
  res.json({ sources: readSources() });
});

app.post('/api/sources', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  const sources = readSources();
  sources.push(url);
  writeSources(sources);
  res.json({ sources });
});

app.put('/api/sources/:index', (req, res) => {
  const idx = parseInt(req.params.index, 10);
  const { url } = req.body;
  const sources = readSources();
  if (idx < 0 || idx >= sources.length) return res.status(404).json({ error: 'not found' });
  sources[idx] = url;
  writeSources(sources);
  res.json({ sources });
});

app.delete('/api/sources/:index', (req, res) => {
  const idx = parseInt(req.params.index, 10);
  const sources = readSources();
  if (idx < 0 || idx >= sources.length) return res.status(404).json({ error: 'not found' });
  sources.splice(idx, 1);
  writeSources(sources);
  res.json({ sources });
});

app.get('/api/stats', async (req, res) => {
  const sources = readSources();
  const results = [];
  const now = new Date();

  for (const url of sources) {
    try {
      const response = await fetch(url, {
        headers: API_KEY ? { 'X-API-Key': API_KEY } : undefined
      });
      const data = await response.json();
      const reports = Array.isArray(data.reports) ? data.reports : [];

      const stats = {
        source: url,
        total: reports.length,
        weekly: 0,
        monthly: 0,
        yearly: 0
      };

      for (const rpt of reports) {
        const created = new Date(rpt.created_at.replace(' ', 'T'));
        if (isSameYear(created, now)) stats.yearly++;
        if (isSameMonth(created, now)) stats.monthly++;
        if (isSameWeek(created, now, { weekStartsOn: 6 })) stats.weekly++; // week starts on Saturday
      }

      results.push(stats);
    } catch (err) {
      results.push({ source: url, error: 'fetch failed' });
    }
  }

  res.json({ results });
});

app.listen(PORT, () => {
  console.log('Server listening on port', PORT);
});

