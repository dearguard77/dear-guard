// supabase/functions/send-admin-push/index.ts
// ────────────────────────────────────────────────────────────────────────────
// OneSignal 관리자 푸시 1차 구현 — staff_1(강성주), staff_2(전수연)에게
// 동시에 푸시를 보내는 공통 함수.
//
// 이번 단계에서는 관리자 2명 고정 발송만 처리합니다.
// 직원별 발송, 배정 자동 감지, DB Webhook, Cron 등은 다음 단계로 미룹니다.
// ────────────────────────────────────────────────────────────────────────────

const ADMIN_EXTERNAL_IDS = ["staff_1", "staff_2"]; // 강성주, 전수연 고정
const DEFAULT_URL = "https://dear-guard.vercel.app/";
const ONESIGNAL_ENDPOINT = "https://api.onesignal.com/notifications";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

interface RequestBody {
  title?: string;
  message?: string;
  url?: string;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "허용되지 않은 메서드입니다. POST만 지원합니다." }, 405);
  }

  // 요청 body 파싱
  let body: RequestBody;
  try {
    body = await req.json();
  } catch (_e) {
    return jsonResponse({ error: "요청 본문이 올바른 JSON 형식이 아닙니다." }, 400);
  }

  const title = (body.title ?? "").trim();
  const message = (body.message ?? "").trim();
  const url = (body.url ?? "").trim();

  // title 또는 message 없으면 400
  if (!title || !message) {
    return jsonResponse({ error: "title과 message는 필수입니다." }, 400);
  }

  // 환경변수(Secret)에서만 읽음 — 코드에 직접 넣지 않음
  const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
  const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error(
      "[send-admin-push] ONESIGNAL_APP_ID 또는 ONESIGNAL_REST_API_KEY Secret이 설정되지 않았습니다."
    );
    // 실패해도 디어가드 기존 데이터는 건드리지 않음 — 여기서는 아무 DB 작업도 하지 않으므로 그대로 오류만 반환
    return jsonResponse({ error: "서버 설정 오류입니다. 관리자에게 문의해주세요." }, 500);
  }

  const targetUrl = url !== "" ? url : DEFAULT_URL;

  const oneSignalPayload = {
    app_id: ONESIGNAL_APP_ID,
    include_aliases: {
      external_id: ADMIN_EXTERNAL_IDS,
    },
    target_channel: "push",
    headings: { en: title },
    contents: { en: message },
    url: targetUrl,
  };

  try {
    const osRes = await fetch(ONESIGNAL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // OneSignal 최신 REST API 인증 형식: "Key {REST_API_KEY}"
        "Authorization": `Key ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(oneSignalPayload),
    });

    const osResultText = await osRes.text();

    if (!osRes.ok) {
      // OneSignal API 실패 시 상태코드와 오류 내용을 서버 로그에 기록 (기존 디어가드 DB는 건드리지 않음)
      console.error(
        `[send-admin-push] OneSignal API 실패 (status ${osRes.status}):`,
        osResultText
      );
      return jsonResponse(
        { error: "푸시 발송에 실패했습니다.", onesignal_status: osRes.status },
        502
      );
    }

    let osResult: unknown;
    try {
      osResult = JSON.parse(osResultText);
    } catch (_e) {
      osResult = osResultText;
    }

    return jsonResponse(
      { success: true, targets: ADMIN_EXTERNAL_IDS, onesignal_response: osResult },
      200
    );
  } catch (e) {
    console.error("[send-admin-push] OneSignal 요청 중 예외 발생:", e);
    return jsonResponse({ error: "푸시 발송 중 오류가 발생했습니다." }, 500);
  }
});
