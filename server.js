require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "app-data.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let db = {
  users: {},
  sessions: {},
  matchCache: {}
};

try {
  if (fs.existsSync(DATA_FILE)) {
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    db = { ...db, ...saved };
  }
} catch (err) {
  console.warn("Could not read data file; starting with empty local store.");
}

function saveDb() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function now() {
  return Date.now();
}

app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "VALO.KR",
    version: "5.1.0",
    storage: "file",
    node: process.version
  });
});

// Local/demo identity. Real Riot RSO can be wired in after Production approval.
app.get("/api/me", (req, res) => {
  const token = req.cookies?.valo_session;
  if (!token) return res.json({ authenticated: false, user: null });

  const session = db.sessions[hash(token)];
  if (!session || session.expiresAt < now()) {
    if (session) {
      delete db.sessions[hash(token)];
      saveDb();
    }
    return res.json({ authenticated: false, user: null });
  }

  const user = db.users[session.userId];
  if (!user) return res.json({ authenticated: false, user: null });

  res.json({ authenticated: true, user });
});

// Rank data contract. Demo values are visibly marked and must never be treated as real Riot data.
app.get("/api/rank", (req, res) => {
  const token = req.cookies?.valo_session;
  const session = token ? db.sessions[hash(token)] : null;
  if (!session || session.expiresAt < now()) {
    return res.json({
      available: false,
      notice: "실제 현재 랭크와 역대 최고 랭크는 승인된 Riot API/RSO 연동 후 표시됩니다."
    });
  }
  const user = db.users[session.userId];
  if (!user) {
    return res.json({ available: false, notice: "플레이어 정보를 찾을 수 없습니다." });
  }
  if (user.demo) {
    return res.json({
      available: true,
      demo: true,
      current: user.rankPreview.current,
      peak: user.rankPreview.peak
    });
  }
  if (!user.rankData) {
    return res.json({
      available: false,
      notice: "이 계정의 랭크 데이터가 아직 연결되지 않았습니다. 승인된 Riot API 연동 후 표시됩니다."
    });
  }
  return res.json({ available: true, demo: false, ...user.rankData });
});

app.get("/auth/login", (req, res) => {
  res.status(501).send(`
    <html><body style="font-family:sans-serif;background:#0b0e14;color:#fff;padding:40px">
    <h1>Riot Login 준비 중</h1>
    <p>VALO.KR의 실제 Riot Sign On(Production RSO) 연결은 Riot 승인 후 환경변수를 설정해야 합니다.</p>
    <p>현재는 사이트 UI와 로컬 서버 동작을 테스트할 수 있습니다.</p>
    <p><a href="/" style="color:#8ab4ff">홈으로 돌아가기</a></p>
    </body></html>
  `);
});

app.get("/auth/callback", (req, res) => {
  res.redirect("/");
});

app.get("/auth/logout", (req, res) => {
  const token = req.cookies?.valo_session;
  if (token) {
    delete db.sessions[hash(token)];
    saveDb();
  }
  res.clearCookie("valo_session");
  res.redirect("/");
});

// Dev-only demo login. Disabled unless ENABLE_DEV_MODE=true.
app.post("/api/dev/login", (req, res) => {
  if (process.env.ENABLE_DEV_MODE !== "true") {
    return res.status(404).json({ error: "not_found" });
  }

  const gameName = String(req.body?.gameName || "Demo Player").slice(0, 40);
  const tagLine = String(req.body?.tagLine || "KR1").slice(0, 10);
  const userId = crypto.randomUUID();

  db.users[userId] = {
    id: userId,
    gameName,
    tagLine,
    region: "kr",
    demo: true,
    // Clearly labelled preview values for UI testing only; not sourced from Riot.
    rankPreview: {
      current: { tierName: "불멸 2", rr: 67, season: "현재 액트 (예시)", updatedAt: "예시 데이터" },
      peak: { tierName: "레디언트", season: "에피소드 8 · 액트 3 (예시)", updatedAt: "예시 기록" }
    },
    createdAt: new Date().toISOString()
  };

  const rawToken = crypto.randomBytes(32).toString("hex");
  db.sessions[hash(rawToken)] = {
    userId,
    expiresAt: now() + 1000 * 60 * 60 * 24 * 7
  };
  saveDb();

  res.cookie("valo_session", rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7
  });

  res.json({ ok: true });
});

// Demo match data for local UI testing.
app.get("/api/matches", (req, res) => {
  const token = req.cookies?.valo_session;
  const session = token ? db.sessions[hash(token)] : null;

  if (!session) {
    return res.json({ matches: [], demo: true });
  }

  const user = db.users[session.userId];
  if (!user) return res.json({ matches: [], demo: true });

  const matches = [
    {
      matchId: "demo-001",
      map: "Ascent",
      mode: "Competitive",
      result: "WIN",
      score: "13 : 9",
      agent: "Jett",
      kills: 21,
      deaths: 15,
      assists: 6,
      playedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
    },
    {
      matchId: "demo-002",
      map: "Lotus",
      mode: "Competitive",
      result: "LOSS",
      score: "8 : 13",
      agent: "Omen",
      kills: 17,
      deaths: 19,
      assists: 4,
      playedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
    },
    {
      matchId: "demo-003",
      map: "Haven",
      mode: "Competitive",
      result: "WIN",
      score: "13 : 11",
      agent: "Raze",
      kills: 24,
      deaths: 18,
      assists: 8,
      playedAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString()
    }
  ];

  res.json({ matches, demo: true });
});

app.get("/api/matches/:matchId", (req, res) => {
  const data = {
    "demo-001": {
      matchId: "demo-001", map: "Ascent", mode: "Competitive", result: "WIN",
      score: "13 : 9", agent: "Jett", kills: 21, deaths: 15, assists: 6,
      playedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
    },
    "demo-002": {
      matchId: "demo-002", map: "Lotus", mode: "Competitive", result: "LOSS",
      score: "8 : 13", agent: "Omen", kills: 17, deaths: 19, assists: 4,
      playedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
    },
    "demo-003": {
      matchId: "demo-003", map: "Haven", mode: "Competitive", result: "WIN",
      score: "13 : 11", agent: "Raze", kills: 24, deaths: 18, assists: 8,
      playedAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString()
    }
  };

  const match = data[req.params.matchId];
  if (!match) return res.status(404).json({ error: "match_not_found" });
  res.json(match);
});

app.use((req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "not_found" });
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`VALO.KR V5.1.0 listening on :${PORT}`);
});
