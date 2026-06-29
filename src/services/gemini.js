const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

const SYSTEM_PROMPT = `You are a discount rule parser for an e-commerce discount engine.
Parse the user's natural language rule and return ONLY a valid JSON object. No explanation, no markdown, no code fences — just raw JSON.

The JSON must match this exact shape:
{
  "scope": "brand" | "platform" | "cart",
  "appliesTo": "<string, omit for cart rules>",
  "type": "percentage" | "flat",
  "value": <positive number>,
  "stackable": <true | false>,
  "minCartValue": <positive number, only for cart rules>
}

Rules:
- scope must be one of: brand, platform, cart
- type must be one of: percentage, flat
- value must be a positive number
- stackable defaults to false if not mentioned
- For cart scope, minCartValue is required
- For brand or platform scope, appliesTo is required
- If the input is ambiguous or cannot be parsed, return: {"error": "Rule is ambiguous"}`

export async function parseRule(input) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Add VITE_OPENAI_API_KEY to your .env file.')
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: input },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const raw = data?.choices?.[0]?.message?.content

  if (!raw) {
    throw new Error('Empty response from OpenAI.')
  }

  let parsed
  try {
    parsed = JSON.parse(raw.trim())
  } catch {
    throw new Error('OpenAI returned invalid JSON.')
  }

  if (parsed.error) {
    throw new Error(parsed.error)
  }

  const validScopes = ['brand', 'platform', 'cart']
  const validTypes  = ['percentage', 'flat']

  if (!validScopes.includes(parsed.scope)) {
    throw new Error(`Invalid scope: "${parsed.scope}". Must be brand, platform, or cart.`)
  }
  if (!validTypes.includes(parsed.type)) {
    throw new Error(`Invalid type: "${parsed.type}". Must be percentage or flat.`)
  }
  if (typeof parsed.value !== 'number' || parsed.value <= 0) {
    throw new Error(`Invalid value: "${parsed.value}". Must be a positive number.`)
  }
  if (parsed.scope !== 'cart' && !parsed.appliesTo) {
    throw new Error(`Missing appliesTo for scope "${parsed.scope}".`)
  }
  if (parsed.scope === 'cart') {
    if (typeof parsed.minCartValue !== 'number' || parsed.minCartValue <= 0) {
      throw new Error('Cart rules require a valid minCartValue.')
    }
  }

  return {
    scope:        parsed.scope,
    appliesTo:    parsed.appliesTo ?? '',
    type:         parsed.type,
    value:        parsed.value,
    stackable:    parsed.stackable === true,
    minCartValue: parsed.scope === 'cart' ? parsed.minCartValue : null,
  }
}
