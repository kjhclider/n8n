// ============================================
// ✅ File Polyfill (Node 18/20용) - 의존성 로드 전에 반드시 실행
// ============================================
if (typeof global.File === 'undefined') {
  global.File = class File extends Blob {
    constructor(bits, name, opts = {}) {
      super(bits, opts);
      this.name = String(name ?? '');
      this.lastModified = opts.lastModified ?? Date.now();
      this.webkitRelativePath = '';
    }
    get [Symbol.toStringTag]() {
      return 'File';
    }
  };
}

// ============================================
// ✅ CommonJS 방식으로 의존성 로드 (폴리필 이후)
// ============================================
const express = require('express');
const Timetable = require('comcigan-parser');

const app = express();
const PORT = process.env.PORT || 8080;

// 헬스 체크
app.get('/', (_req, res) => {
  res.status(200).send('✅ COMCI Timetable API is running');
});

// 실제 시간표 API
app.get('/timetable', async (req, res) => {
  try {
    const code = Number(req.query.code);
    const grade = Number(req.query.grade);
    const klass = Number(req.query.class);

    if (!code || !grade || !klass) {
      return res.status(400).json({
        ok: false,
        error: 'Missing query parameters: code, grade, class',
      });
    }

    const comci = new Timetable();
    await comci.init();
    comci.setSchool(code);

    const table = await comci.getTimetable();
    const days = table?.[grade]?.[klass];

    if (!days) {
      return res.status(404).json({
        ok: false,
        error: 'No timetable data found for the given grade/class',
      });
    }

    res.json({
      ok: true,
      schoolCode: code,
      grade,
      class: klass,
      timetable: days,
    });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`✅ COMCI API server running on http://localhost:${PORT}`);
});
