// server.js
import express from "express";
import ComciganParser from "comcigan-parser";

const app = express();
const port = process.env.PORT || 8080;

// ✅ CORS 허용
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

// ✅ 메인 API
app.get("/timetable", async (req, res) => {
    try {
        const { code, grade, class: classNo } = req.query;

        if (!code || !grade || !classNo) {
            return res.status(400).json({
                ok: false,
                error: "Missing required query parameters (code, grade, class)"
            });
        }

        const parser = new ComciganParser();

        // ✅ 학교 코드 설정
        await parser.setSchool(Number(code));

        const timetable = await parser.getTimetable();

        const gradeNum = Number(grade);
        const classNum = Number(classNo);

        // ✅ 학년 데이터 체크
        if (!timetable[gradeNum]) {
            return res.status(404).json({
                ok: false,
                error: `No data for grade ${gradeNum}`
            });
        }

        // ✅ 반 데이터 체크
        if (!timetable[gradeNum][classNum]) {
            return res.status(404).json({
                ok: false,
                error: `No data for class ${classNum} in grade ${gradeNum}`
            });
        }

        const classTable = timetable[gradeNum][classNum];

        return res.json({
            ok: true,
            grade: gradeNum,
            class: classNum,
            timetable: classTable
        });

    } catch (err) {
        console.error("API ERROR:", err);
        return res.status(500).json({
            ok: false,
            error: String(err)
        });
    }
});

// ✅ 루트 페이지
app.get("/", (req, res) => {
    res.send("✅ COMCI Timetable API is running");
});

// ✅ 서버 시작
app.listen(port, () => {
    console.log(`✅ COMCI API server running on http://localhost:${port}`);
});
