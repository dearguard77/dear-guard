export default async function handler(req, res) {
  const url   = new URL(req.url, 'https://dear-guard.vercel.app');
  const token = url.searchParams.get('t') || '';

  const SUPABASE_URL = 'https://fmvomfjmkbklhaaapkbk.supabase.co';
  const ANON_KEY     = 'sb_publishable_3GWkLSDzMFw6FfA_839Ydw_C5F1paf2';

  let title = 'Dear Guard · 실시간 장부';
  let desc  = 'Dear Guard 실시간 축의금 접수 현황';

  if(token){
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/schedules?dashboard_token=eq.${encodeURIComponent(token)}&select=groom_name,bride_name`,
        { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
      );
      const rows = await r.json();
      if(rows && rows.length){
        const g = (rows[0].groom_name || '').trim();
        const b = (rows[0].bride_name || '').trim();
        const name = (g && b) ? `${g} ♥ ${b}`
                   : g        ? `${g} 신랑측`
                   : b        ? `${b} 신부측`
                   : '';
        if(name){
          title = `${name} 실시간 장부`;
          desc  = `${name} 실시간 축의금 접수 현황 · Dear Guard`;
        }
      }
    } catch(e){
      console.error('[DG] OG fetch 실패:', e);
    }
  }

  const pageUrl = `https://dear-guard.vercel.app/live-page.html?t=${encodeURIComponent(token)}`;

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<meta property="og:type"        content="website">
<meta property="og:title"       content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image"       content="https://dear-guard.vercel.app/icon.png">
<meta property="og:image:width" content="512">
<meta property="og:image:height"content="512">
<meta property="og:url"         content="${pageUrl}">
<meta name="twitter:card"       content="summary">
<meta name="twitter:title"      content="${title}">
<meta name="twitter:description"content="${desc}">
<meta name="twitter:image"      content="https://dear-guard.vercel.app/icon.png">
<meta http-equiv="refresh" content="0;url=${pageUrl}">
<script>location.replace('${pageUrl}');</script>
</head>
<body></body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.end(html);
}
