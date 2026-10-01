async function load() {
  const me = await fetch("/api/me");
  if (!me.ok) { location.href="/"; return; }
  const profile = await me.json();
  const u = profile.user;
  document.querySelector("#identity").textContent = `${u.gameName || "Riot Player"}#${u.tagLine || ""}`;
  document.querySelector("#greeting").textContent = `${u.gameName || "내"}님의 경기 기록`;

  const response = await fetch("/api/matches");
  const list = document.querySelector("#matches");
  if (!response.ok) {
    list.innerHTML = `<div class="error">경기 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>`;
    return;
  }
  const data = await response.json();
  const matches = data.matches || [];
  document.querySelector("#matchCount").textContent = matches.length;
  document.querySelector("#cacheState").textContent = data.cached ? "CACHE" : "LIVE";

  if (!matches.length) {
    list.innerHTML = `<div class="empty">최근 경기 기록이 없습니다.</div>`;
    return;
  }
  list.innerHTML = matches.map(m => `
    <a class="match-card" href="/match.html?id=${encodeURIComponent(m.matchId)}">
      <span class="match-dot"></span>
      <div><b>${m.matchId}</b><small>${m.gameStartMillis ? new Date(m.gameStartMillis).toLocaleString("ko-KR") : "경기 기록"}</small></div>
      <span class="arrow">→</span>
    </a>
  `).join("");
}
document.querySelector("#logout").addEventListener("click", async()=>{
  await fetch("/auth/logout",{method:"POST"});
  location.href="/";
});
load();
