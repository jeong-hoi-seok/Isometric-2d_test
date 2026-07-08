// Vercel Serverless Function — POST /api/place
// 얇은 프록시: 클라이언트 씬 요약을 OpenAI에 전달, 구조화 좌표 JSON 반환
// 검증은 클라이언트(repairPlacements)에서 수행. 여기선 프록시만.

export default async function handler(
  req: { method: string; body: unknown },
  res: {
    status: (code: number) => {
      json: (data: unknown) => void;
      end: () => void;
    };
  },
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
    return;
  }

  const model = process.env.OPENAI_MODEL ?? 'gpt-5-mini';

  const systemPrompt = `당신은 아이소메트릭 2D 섬 꾸미기 배치 전문 디자이너입니다.
사용자가 제공하는 씬(grid, mask, placeable 칸 목록, assets 요청, fixed 고정 오브젝트)을 바탕으로,
각 에셋의 최적 배치 좌표를 결정합니다.

배치 원칙:
- fixed 오브젝트(캐릭터 등)가 점유한 칸은 절대 사용하지 않습니다.
- footprint 전체가 placeable 칸 안에 있어야 합니다 (col~col+w-1, row~row+h-1 모두 포함).
- 집(home)은 가장자리 링 영역(타원 가장자리 쪽)에 배치합니다.
- 나무/식물류는 2~4개씩 군집으로 모아 배치합니다.
- 중앙은 캐릭터를 위해 비워둡니다.
- 에셋끼리 겹치지 않도록 합니다.
- assets 목록의 count만큼만 배치합니다 (초과 배치 금지).
- 깊이는 col+row가 클수록 화면 앞. 어떤 에셋을 다른 에셋 앞에 보이게 하려면 더 큰 col+row 칸을 골라라. 겹쳐 보이는 연출(나무 뒤 벤치 등)은 인접 칸 + col+row 차이로 만든다.

각 배치의 reason에 왜 그 위치인지 한국어로 아주 짧게(20자 이내, 예: "가장자리 링, 군집 뒤쪽") 쓰고,
rationale에 전체 배치 컨셉을 한국어 한 문장으로 요약하세요. 서술이 길면 안 됩니다.

요청한 모든 에셋의 좌표를 JSON으로 반환하세요.`;

  const userContent = JSON.stringify(req.body);

  const requestBody = {
    model,
    // gpt-5 계열은 추론 시간이 배치 UX를 해쳐 최소로 고정
    ...(model.startsWith('gpt-5') ? { reasoning_effort: 'low' } : {}),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'placements',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            placements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  assetId: { type: 'string' },
                  col: { type: 'integer' },
                  row: { type: 'integer' },
                  reason: { type: 'string' },
                },
                required: ['assetId', 'col', 'row', 'reason'],
                additionalProperties: false,
              },
            },
            rationale: { type: 'string' },
          },
          required: ['placements', 'rationale'],
          additionalProperties: false,
        },
      },
    },
  };

  let openAiResponse: Response;
  const t0 = Date.now();
  try {
    openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('OpenAI request failed:', message);
    res.status(502).json({ error: 'OpenAI request failed' });
    return;
  }

  console.log(`[place] OpenAI latency: ${Date.now() - t0}ms`);

  if (!openAiResponse.ok) {
    const detail = await openAiResponse.text().catch(() => '');
    console.error(`OpenAI returned ${openAiResponse.status}:`, detail);
    res.status(502).json({ error: `OpenAI returned ${openAiResponse.status}` });
    return;
  }

  let data: { choices: { message: { content: string } }[] };
  try {
    data = (await openAiResponse.json()) as typeof data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Failed to parse OpenAI response:', message);
    res.status(502).json({ error: 'Failed to parse OpenAI response' });
    return;
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    res.status(502).json({ error: 'Empty content from OpenAI' });
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('OpenAI content is not valid JSON:', message);
    res.status(502).json({ error: 'OpenAI content is not valid JSON' });
    return;
  }

  res.status(200).json(parsed);
}
