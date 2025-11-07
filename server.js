const express = require("express");
const Timetable = require("./index");  // comcigan-parser
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// ✅ 학교 검색 API
app.get("/search", async (req, res) => {
  try {
    const keyword = req.query.keyword;
    if (!keyword) {
      return res.status(400).json({ ok: false, error: "keyword is required" });
    }

    const ttb = new Timetable();
    await ttb.init();
    const result = await ttb.search(keyword);

    return res.json({ ok: true, result });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// ✅ 시간표 조회 API
app.get("/timetable", async (req, res) => {
  try {
    const code = Number(req.query.code);
    const grade = Number(req.query.grade);
    const klass = Number(req.query.class);

    if (!code || !grade || !klass) {
      return res.status(400).json({ ok: false, error: "code, grade, class are required" });
    }

    const ttb = new Timetable();
    await ttb.init();
    ttb.setSchool(code);

    const data = await ttb.getTimetable();

    return res.json({
      ok: true,
      code,
      grade,
      class: klass,
      timetable: data[grade][klass]
    });

  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(port, () => {
  console.log(`✅ COMCI API server running on http://localhost:${port}`);
});
