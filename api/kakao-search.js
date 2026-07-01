// api/kakao-search.js
// Kakao Local Search API 서버 프록시 (CORS 우회)
const KAKAO_KEY = process.env.KAKAO_REST_KEY || '0cbd7b57e9c56e3f85624145076f6b4c';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'query 파라미터 없음', documents: [] });

  try {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=1`;
    const r = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } });
    const text = await r.text();
    if (!r.ok) return res.status(r.status).json({ error: `Kakao ${r.status}`, detail: text, documents: [] });
    return res.send(text);
  } catch (e) {
    return res.status(500).json({ error: e.message, documents: [] });
  }
};
