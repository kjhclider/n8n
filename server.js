// File 폴리필
if (typeof global.File === 'undefined') {
  global.File = class File extends Blob {
    constructor(bits, name, opts = {}) {
      super(bits, opts);
      this.name = String(name ?? '');
      this.lastModified = opts.lastModified ?? Date.now();
      this.webkitRelativePath = '';
    }
    get [Symbol.toStringTag]() { return 'File'; }
  };
}

const express = require('express');
const Timetable = require('comcigan-parser');

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (_req, res) => {
  res.status(200).send('✅ COMCI Timetable API is running');
});

/** 학교 검색 (코드 확인용)
 *  GET /search?keyword=경기북과학고
 */
app.get('/search', async (req, res) => {
  try {
    const keyword = (req.query.keyword || '').trim();
    if (!keyword) return res.status(400).json({ ok:false, error:'Missing keyword' });

    const comci = new Timetable();
    await comci.init();
    const list = await comci.search(keyword);
    res.json({ ok:true, result:list });
  } catch (e) {
    console.error('❌ /search error', e);
    res.status(500).json({ ok:false, error:String(e?.message || e) });
  }
});

/** 시간표 조회
 *  GET /timetable?code=1373&grade=1&class=4
 */
app.get('/timetable', async (req, res) => {
  try {
    const code  = Number(req.query.code);
    const grade = Number(req.query.grade);
    const klass = Number(req.query.class);

    if (!code || !grade || !klass) {
      return res.status(400).json({ ok:false, error:'Missing: code, grade, class' });
    }

    const comci = new Timetable();
    await comci.init({ maxGrade: 3 }); // 필요시 조정
    comci.setSchool(code);

    const table = await comci.getTimetable();

    // 디버그: 상위 키가 뭔지 확인
    const tableKeys = table ? Object.keys(table) : [];
    console.log('🔎 table keys:', tableKeys);

    // 숫자/문자 키 모두 안전 접근
    const gradeObj = table && (table[grade] || table[String(grade)]);
    const classObj = gradeObj && (gradeObj[klass] || gradeObj[String(klass)]);

    if (!table) {
      return res.status(502).json({
        ok:false,
        error:'Failed to load timetable (table undefined). Upstream may have changed.',
      });
    }
    if (!gradeObj) {
      return res.status(404).json({
        ok:false,
        error:`No data for grade=${grade}. Available grades: ${JSON.stringify(Object.keys(table))}`
      });
    }
    if (!classObj) {
      return res.status(404).json({
        ok:false,
        error:`No data for class=${klass}. Available classes: ${JSON.stringify(Object.keys(gradeObj))}`
      });
    }

    return res.json({
      ok:true,
      schoolCode: code,
      grade,
      class: klass,
      timetable: classObj
    });
  } catch (err) {
    console.error('❌ /timetable error:', err);
    res.status(500).json({ ok:false, error:String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`✅ COMCI API server running on http://localhost:${PORT}`);
});
