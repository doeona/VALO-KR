async function load() {
  const me = await fetch("/api/me");
  if (!me.ok) { location.href="/"; return; }
  const profile = await me.json();
  if (!profile.authenticated || !profile.user) { location.href="/"; return; }

  const u = profile.user;
  document.querySelector("#identity").textContent = `${u.gameName || "Riot Player"}#${u.tagLine || ""}`;
  document.querySelector("#greeting").textContent = `${u.gameName || "내"}님의 경기 기록`;
  document.querySelector("#connectionState").textContent = u.demo ? "DEMO" : "ON";
  document.querySelector("#connectionCaption").textContent = u.demo ? "예시 데이터 · 실제 계정 아님" : "계정 연결";

  await loadRank();
  const response = await fetch("/api/matches");
  const list = document.querySelector("#matches");
  if (!response.ok) {
    list.textContent = "경기 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
    list.className = "match-list error";
    return;
  }
  const data = await response.json();
  const matches = data.matches || [];
  document.querySelector("#matchCount").textContent = matches.length;
  document.querySelector("#cacheState").textContent = data.demo ? "DEMO DATA" : (data.cached ? "CACHE" : "LIVE");

  if (!matches.length) {
    list.innerHTML = `<div class="empty">최근 경기 기록이 없습니다.</div>`;
    return;
  }
  list.innerHTML = matches.map(m => `
    <a class="match-card" href="/match.html?id=${encodeURIComponent(m.matchId)}">
      <span class="match-dot"></span>
      <div><b>${escapeHtml(m.map || m.matchId)} · ${escapeHtml(m.mode || "경기 기록")}</b><small>${m.playedAt ? new Date(m.playedAt).toLocaleString("ko-KR") : "경기 기록"}${m.result ? " · " + escapeHtml(m.result) : ""}</small></div>
      <span class="arrow">→</span>
    </a>
  `).join("");
}

async function loadRank() {
  const notice = document.querySelector("#rankNotice");
  try {
    const response = await fetch("/api/rank");
    const data = await response.json();
    if (!response.ok || !data.available) {
      setText("currentRankName", "연동 대기");
      setText("currentRankRR", "실제 랭크 데이터 없음");
      setText("peakRankName", "연동 대기");
      setText("peakRankSeason", "시즌 기록 없음");
      setText("rankSource", "RIOT API 연동 대기");
      notice.textContent = data.notice || "실제 현재·최고 랭크는 승인된 Riot API 연동 후 표시됩니다.";
      return;
    }
    const current = data.current || {};
    const peak = data.peak || {};
    setText("currentRankName", current.tierName || "정보 없음");
    setText("currentRankRR", current.rr == null ? "RR 정보 없음" : `${current.rr} RR`);
    setText("currentRankSeason", current.season || "현재 시즌");
    setText("currentRankUpdated", current.updatedAt || "업데이트 정보 없음");
    setText("peakRankName", peak.tierName || "정보 없음");
    setText("peakRankSeason", peak.season ? `달성 시즌: ${peak.season}` : "달성 시즌 정보 없음");
    setText("peakRankNote", peak.updatedAt || "기록 확인됨");
    setText("rankSource", data.demo ? "예시 데이터" : "연동 데이터");
    if (data.demo) {
      notice.textContent = "미리보기용 예시 데이터입니다. 실제 플레이어의 랭크가 아니며 Riot API 연동 전까지 실제 기록으로 사용할 수 없습니다.";
      notice.classList.add("demo");
    } else {
      notice.textContent = "계정에서 확인 가능한 경쟁전 기록 기준입니다. 최고 랭크의 시즌별 기록은 제공 데이터 범위에 따라 달라질 수 있습니다.";
    }
  } catch {
    setText("currentRankName", "불러오기 실패");
    setText("currentRankRR", "잠시 후 다시 시도해 주세요");
    setText("peakRankName", "불러오기 실패");
    setText("peakRankSeason", "시즌 기록 확인 불가");
    setText("rankSource", "연결 오류");
    notice.textContent = "랭크 정보를 불러오지 못했습니다. 서버 연결을 확인해 주세요.";
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[char]);
}

document.querySelector("#logout").addEventListener("click", async()=>{
  await fetch("/auth/logout",{method:"GET"});
  location.href="/";
});
load();
