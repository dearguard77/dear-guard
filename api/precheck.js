const SUPABASE_URL      = 'https://fmvomfjmkbklhaaapkbk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3GWkLSDzMFw6FfA_839Ydw_C5F1paf2';
const LOGO_URL          = 'https://dear-guard.vercel.app/logo.png';
const BASE_URL          = 'https://dear-guard.vercel.app';

async function fetchSchedule(token) {
  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };
  const select = 'select=groom_name,bride_name,hall,wedding_mode,date&limit=1';
  const t = encodeURIComponent(token);

  for (const col of ['dashboard_token', 'groom_token', 'bride_token']) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/schedules?${col}=eq.${t}&${select}`,
      { headers }
    );
    if (!res.ok) continue;
    const rows = await res.json();
    if (rows.length) return rows[0];
  }
  return null;
}

function buildTitle(s) {
  const g = (s.groom_name || '').trim();
  const b = (s.bride_name  || '').trim();
  const mode = s.wedding_mode || '양측';

  // D-day 계산
  let dStr = '';
  if (s.date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weddingDay = new Date(s.date + 'T00:00:00');
    const diff = Math.round((weddingDay - today) / (1000 * 60 * 60 * 24));
    dStr = diff === 0 ? ' · D-Day' : diff > 0 ? ` · D-${diff}` : ` · D+${Math.abs(diff)}`;
  }

  if (mode === '단측') {
    if (g) return `💍 ${g} 신랑측 본식${dStr}`;
    if (b) return `💍 ${b} 신부측 본식${dStr}`;
    return 'Dear Guard · 본식 준비 체크';
  }
  if (g && b) return `💍 ${g} ♥ ${b} 본식${dStr}`;
  if (g || b) return `💍 ${g || b} 본식${dStr}`;
  return 'Dear Guard · 본식 준비 체크';
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('t') || '';

  const schedule = token ? await fetchSchedule(token) : null;
  const ogTitle  = schedule ? buildTitle(schedule) : 'Dear Guard · 본식 준비 체크';
  const ogDesc   = '디어가드 본식 준비 체크리스트';
  const pageUrl  = `${BASE_URL}/api/precheck?t=${encodeURIComponent(token)}`;

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
