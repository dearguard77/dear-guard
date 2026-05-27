const SUPABASE_URL      = 'https://fmvomfjmkbklhaaapkbk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3GWkLSDzMFw6FfA_839Ydw_C5F1paf2';
const LOGO_URL          = 'https://dear-guard.vercel.app/logo.png';
const BASE_URL          = 'https://dear-guard.vercel.app';

async function fetchSchedule(col, token) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/schedules?${col}=eq.${encodeURIComponent(token)}&select=groom_name,bride_name,hall,date,time&limit=1`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows.length ? rows[0] : null;
}

function buildTitle(s, viewSide) {
  const g = (s.groom_name || '').trim();
  const b = (s.bride_name  || '').trim();
  if (viewSide === 'groom') return g ? `${g} 신랑측 실시간 장부`   : '신랑측 실시간 장부';
  if (viewSide === 'bride') return b ? `${b} 신부측 실시간 장부`   : '신부측 실시간 장부';
  if (g && b)               return `${g} ♥ ${b} · 실시간 장부`;
  return (g || b) ? `${g || b} · 실시간 장부` : 'Dear Guard · 실시간 장부';
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('t') || '';

  let schedule = null;
  let viewSide = 'both';

  if (token) {
    schedule = await fetchSchedule('dashboard_token', token);
    if (!schedule) { schedule = await fetchSchedule('groom_token', token); if (schedule) viewSide = 'groom'; }
    if (!schedule) { schedule = await fetchSchedule('bride_token',  token); if (schedule) viewSide = 'bride'; }
  }

  const ogTitle = schedule ? buildTitle(schedule, viewSide) : 'Dear Guard · 실시간 장부';
  const ogDesc  = '디어가드 스마트 축의 운영 시스템';
  const pageUrl = `${BASE_URL}/live.html?t=${encodeURIComponent(token)}`;

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${ogTitle}</title>
<meta property="og:type"         content="website">
<meta property="og:site_name"    content="Dear Guard">
<meta property="og:title"        content="${ogTitle}">
<meta property="og:description"  content="${ogDesc}">
<meta property="og:image"        content="${LOGO_URL}">
<meta property="og:image:width"  content="512">
<meta property="og:image:height" content="512">
<meta property="og:url"          content="${pageUrl}">
<meta name="twitter:card"        content="summary">
<meta name="twitter:title"       content="${ogTitle}">
<meta name="twitter:description" content="${ogDesc}">
<meta name="twitter:image"       content="${LOGO_URL}">
<meta http-equiv="refresh" content="0;url=${pageUrl}">
<script>location.replace("${pageUrl}");</script>
</head>
<body></body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export const config = { runtime: 'edge' };
