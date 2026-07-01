// api/kakao-search.js
// Kakao Local Search API 서버 프록시
// 브라우저에서 직접 호출 시 CORS 차단 → 이 서버 함수를 통해 우회

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'query 파라미터 필요' });

  const KAKAO_KEY = process.env.KAKAO_REST_KEY;
  if (!KAKAO_KEY) return res.status(500).json({ error: 'KAKAO_REST_KEY 환경변수 미설정' });

  try {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=1`;
    const resp = await fetch(url, {
      headers: { 'Authorization': `KakaoAK ${KAKAO_KEY}` }
    });
    if (!resp.ok) return res.status(resp.status).json({ error: `Kakao 오류: ${resp.status}` });
    const data = await resp.json();
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
