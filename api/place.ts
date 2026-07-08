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

요청한 모든 에셋의 좌표를 JSON으로 반환하세요.`;

  const userContent = JSON.stringify(req.body);

  const requestBody = {
    model,
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
                },
                required: ['assetId', 'col', 'row'],
                additionalProperties: false,
              },
            },
          },
          required: ['placements'],
          additionalProperties: false,
        },
      },
    },
  };

  let openAiResponse: Response;
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
    res.status(502).json({ error: 'OpenAI request failed', detail: message });
    return;
  }

  if (!openAiResponse.ok) {
    const detail = await openAiResponse.text().catch(() => '');
    res.status(502).json({
      error: `OpenAI returned ${openAiResponse.status}`,
      detail,
    });
    return;
  }

  let data: { choices: { message: { content: string } }[] };
  try {
    data = (await openAiResponse.json()) as typeof data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: 'Failed to parse OpenAI response', detail: message });
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
    res.status(502).json({ error: 'OpenAI content is not valid JSON', detail: message });
    return;
  }

  res.status(200).json(parsed);
}
