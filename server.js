//
// Simple Node.js API for Comcigan (컴시간 알리미) timetable
// Usage examples:
//   GET /school?name=경기북과학고등학교
//   GET /timetable?code=1373&grade=1&class=4
//   GET /classtime?code=1373
//
const express = require('express');
const Timetable = require('comcigan-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Very small CORS helper (so n8n can call it easily)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Health check
app.get('/', (_req, res) => {
  res.json({ ok: true, name: 'comci-api', endpoints: ['/school', '/timetable', '/classtime'] });
});

// 1) Search schools by name
//    /school?name=경기북과학고등학교
app.get('/school', async (req, res) => {
  try {
    const keyword = (req.query.name || '').trim();
    if (!keyword) return res.status(400).json({ ok: false, error: 'Missing query: name' });

    const tt = new Timetable();
    await tt.init(); // load site entry & keys
    const list = await tt.search(keyword);
    return res.json({ ok: true, count: list.length, results: list });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
});

// 2) Get today's timetable for a class
//    /timetable?code=1373&grade=1&class=4
app.get('/timetable', async (req, res) => {
  try {
    const code = parseInt(req.query.code, 10);
    const grade = parseInt(req.query.grade, 10);
    const klass = parseInt(req.query.class, 10);

    if (!code || !grade || !klass) {
      return res.status(400).json({ ok: false, error: 'Missing query: code, grade, class' });
    }

    const day = new Date().getDay(); // 0=Sun ... 6=Sat
    if (day === 0 || day === 6) {
      return res.json({ ok: true, weekend: true, date: new Date().toISOString().slice(0, 10), periods: [] });
    }

    const tt = new Timetable();
    await tt.init();
    tt.setSchool(code);
    const data = await tt.getTimetable();

    const oneWeek = data?.[grade]?.[klass];
    if (!oneWeek) return res.status(404).json({ ok: false, error: 'Timetable not found for given grade/class' });

    const todayIdx = day - 1; // Mon=0..Fri=4
    const periods = (oneWeek[todayIdx] || []).map((p, i) => ({
      period: (p?.classTime) || (i + 1),
      subject: p?.subject || '',
      teacher: p?.teacher || ''
    }));

    return res.json({
      ok: true,
      date: new Date().toISOString().slice(0, 10),
      grade,
      class: klass,
      periods
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
});

// 3) Get class time table (start/end time per period)
//    /classtime?code=1373
app.get('/classtime', async (req, res) => {
  try {
    const code = parseInt(req.query.code, 10);
    if (!code) return res.status(400).json({ ok: false, error: 'Missing query: code' });

    const tt = new Timetable();
    await tt.init();
    tt.setSchool(code);
    const times = await tt.getClassTime();
    return res.json({ ok: true, results: times });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
});

app.listen(PORT, () => {
  console.log(`comci-api running on :${PORT}`);
});
