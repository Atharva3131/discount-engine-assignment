import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pageTexts = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    const lineMap = new Map()
    for (const item of content.items) {
      const y = Math.round(item.transform[5])
      if (!lineMap.has(y)) lineMap.set(y, [])
      lineMap.get(y).push(item.str)
    }

    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a)
    pageTexts.push(sortedYs.map((y) => lineMap.get(y).join(' ')).join('\n'))
  }

  return pageTexts.join('\n')
}

const LABEL_KEYWORDS = [
  'Platform:', 'Brand:', 'Discount:', 'Stackable:',
  'Cart Discount', 'Minimum Cart Value:', 'Min Cart Value:',
]

function normalizeText(raw) {
  let text = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')

  for (const label of LABEL_KEYWORDS) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    text = text.replace(new RegExp(`(?<!\n)(${escaped})`, 'g'), '\n$1')
  }

  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

function buildRuleBlocks(lines) {
  const blocks = []
  let current = null

  for (const line of lines) {
    const isEntityStart =
      /^(platform|brand)\s*:/i.test(line) ||
      /^cart\s+discount/i.test(line)

    if (isEntityStart) {
      if (current) blocks.push(current)
      current = { lines: [line] }
    } else if (current) {
      current.lines.push(line)
    } else {
      blocks.push({ lines: [line] })
    }
  }

  if (current) blocks.push(current)
  return blocks
}

function parseBlock(lines) {
  let scope = null
  let appliesTo = ''
  let type = null
  let value = null
  let stackable = false
  let minCartValue = null

  const fullText = lines.join(' ')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineLower = line.toLowerCase()

    if (/^platform\s*:$/i.test(line.trim())) {
      scope = 'platform'
      if (i + 1 < lines.length && !/^(brand|platform|discount|stackable|minimum|min|cart)\s*:/i.test(lines[i + 1])) {
        appliesTo = lines[i + 1].trim()
        i++
      }
      continue
    }
    if (/^platform\s*:/i.test(line)) {
      scope = 'platform'
      appliesTo = line.replace(/^platform\s*:\s*/i, '').trim()
      continue
    }

    if (/^brand\s*:$/i.test(line.trim())) {
      scope = 'brand'
      if (i + 1 < lines.length && !/^(brand|platform|discount|stackable|minimum|min|cart)\s*:/i.test(lines[i + 1])) {
        appliesTo = lines[i + 1].trim()
        i++
      }
      continue
    }
    if (/^brand\s*:/i.test(line)) {
      scope = 'brand'
      appliesTo = line.replace(/^brand\s*:\s*/i, '').trim()
      continue
    }

    if (/^cart\s+discount/i.test(line)) {
      scope = 'cart'
      continue
    }

    if (/^discount\s*:/i.test(line)) {
      const discountText = line.replace(/^discount\s*:\s*/i, '').trim()
      const pct = discountText.match(/(\d+(?:\.\d+)?)\s*%/)
      const flat = discountText.match(/flat\s+rs\.?\s*(\d+(?:\.\d+)?)|rs\.?\s*(\d+(?:\.\d+)?)\s*(?:off)?/i)
      if (pct) {
        type = 'percentage'
        value = Number.parseFloat(pct[1])
      } else if (flat) {
        type = 'flat'
        value = Number.parseFloat(flat[1] ?? flat[2])
      }
      continue
    }

    if (/^stackable\s*:/i.test(line)) {
      const val = line.replace(/^stackable\s*:\s*/i, '').trim().toLowerCase()
      stackable = val === 'yes' || val === 'true' || val === '1'
      continue
    }

    if (/^(minimum\s+cart\s+value|min\s+cart\s+value)\s*:/i.test(line)) {
      const m = line.match(/rs\.?\s*(\d+(?:\.\d+)?)/i)
      if (m) minCartValue = Number.parseFloat(m[1])
      continue
    }

    if (type === null) {
      const pct = line.match(/(\d+(?:\.\d+)?)\s*%/)
      const flat = line.match(/flat\s+rs\.?\s*(\d+(?:\.\d+)?)|rs\.?\s*(\d+(?:\.\d+)?)\s*off/i)
      if (pct) { type = 'percentage'; value = Number.parseFloat(pct[1]) }
      else if (flat) { type = 'flat'; value = Number.parseFloat(flat[1] ?? flat[2]) }
    }

    if (/\bstackable\b/i.test(lineLower) && !/^stackable\s*:/i.test(line)) {
      stackable = true
    }

    if (scope === null) {
      if (/\bcart\b/.test(lineLower)) {
        scope = 'cart'
      } else {
        const platformKeywords = ['amazon india', 'amazon', 'flipkart', 'myntra', 'meesho', 'ajio', 'nykaa', 'snapdeal', 'tata cliq', 'jiomart']
        const hit = platformKeywords.find((p) => lineLower.includes(p))
        if (hit) {
          scope = 'platform'
          appliesTo = line.match(new RegExp(hit.split(' ').map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+'), 'i'))?.[0] ?? hit
        }
      }
    }
  }

  if (scope === 'cart' && !minCartValue) {
    const m = fullText.match(/(?:minimum\s+cart\s+(?:value\s+)?|above\s+|min\.?\s+|over\s+)rs\.?\s*(\d+(?:\.\d+)?)/i)
      || fullText.match(/rs\.?\s*(\d+(?:\.\d+)?)/i)
    if (m) minCartValue = Number.parseFloat(m[1])
  }

  return { scope, appliesTo, type, value, stackable, minCartValue }
}

function parseRulesFromText(text) {
  const lines = normalizeText(text)
  const blocks = buildRuleBlocks(lines)
  const rules = []
  const errors = []

  for (const block of blocks) {
    const { scope, appliesTo, type, value, stackable, minCartValue } = parseBlock(block.lines)

    if (!scope) {
      errors.push(`Could not determine scope for: "${block.lines.join(' ')}"`)
      continue
    }
    if (!type || !value || value <= 0) {
      errors.push(`Could not determine discount type/value for: "${block.lines.join(' ')}"`)
      continue
    }
    if (scope !== 'cart' && !appliesTo) {
      errors.push(`Missing appliesTo for scope "${scope}" in: "${block.lines.join(' ')}"`)
      continue
    }
    if (scope === 'cart') {
      if (!minCartValue || minCartValue <= 0) {
        errors.push(`Cart rule missing valid minimum cart value for: "${block.lines.join(' ')}"`)
        continue
      }
    }

    rules.push({ scope, appliesTo, type, value, stackable, minCartValue })
  }

  return { rules, errors }
}

function isDuplicate(newRule, existing) {
  const norm = (v) => (v ?? '').toString().trim().toLowerCase()
  return existing.some(
    (r) =>
      norm(r.scope) === norm(newRule.scope) &&
      norm(r.appliesTo) === norm(newRule.appliesTo) &&
      norm(r.type) === norm(newRule.type) &&
      Number(r.value) === Number(newRule.value) &&
      Boolean(r.stackable) === Boolean(newRule.stackable) &&
      (r.minCartValue ?? null) === (newRule.minCartValue ?? null)
  )
}

export async function parsePDF(file, existingRules = []) {
  let text
  try {
    text = await extractTextFromPDF(file)
  } catch (err) {
    return { success: false, error: `Could not read PDF: ${err.message}` }
  }

  if (!text.trim()) {
    return { success: false, error: 'The PDF appears to be empty or unreadable.' }
  }

  const { rules, errors } = parseRulesFromText(text)

  if (rules.length === 0) {
    const detail = errors.length > 0 ? ` Issues: ${errors.join('; ')}` : ''
    return { success: false, error: `No valid discount rules found in the PDF.${detail}` }
  }

  const unique = rules.filter((r) => !isDuplicate(r, existingRules))
  const duplicateCount = rules.length - unique.length

  return {
    success: true,
    rules: unique,
    duplicateCount,
    parseErrors: errors,
  }
}
