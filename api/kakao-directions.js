// Vercel Serverless Function
// Kakao Mobility 길찾기 API 서버 프록시
// 환경변수: KAKAO_REST_API_KEY (Vercel 프로젝트 설정에서 추가)

export default async function handler(req, res) {
  // CORS 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const KAKAO_KEY = process.env.KAKAO_REST_API_KEY;
  if (!KAKAO_KEY) {
    return res.status(500).json({ error: 'KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다' });
  }

  const { origin_lng, origin_lat, dest_lng, dest_lat, departure_time } = req.query;

  if (!origin_lng || !origin_lat || !dest_lng || !dest_lat) {
    return res.status(400).json({ error: '출발지/도착지 좌표가 누락되었습니다' });
  }

  const url = `https://apis-navi.kakaomobility.com/v1/directions` +
    `?origin=${origin_lng},${origin_lat}` +
    `&destination=${dest_lng},${dest_lat}` +
    `${departure_time ? `&departure_time=${departure_time}` : ''}` +
    `&priority=RECOMMEND`;

  try {
    const r = await fetch(url, {
      headers: { Authorization: `KakaoAK ${KAKAO_KEY}` }
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({
        error: `Kakao API ${r.status}`,
        kakao_message: data?.msg || data?.message || '',
        raw: data
      });
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: `서버 오류: ${e.message}` });
  }
}
