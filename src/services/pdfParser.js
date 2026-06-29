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
    pageTexts.push(sortedYs.map((y) => lineMap.get(y).join('\t')).join('\n'))
  }

  return pageTexts.join('\n')
}

function normalizePrice(raw) {
  const cleaned = raw.replace(/[Rr]s\.?\s*/g, '').replace(/,/g, '').trim()
  const num = Number.parseFloat(cleaned)
  return Number.isNaN(num) || num <= 0 ? null : Math.round(num)
}

function isHeaderRow(cells) {
  const joined = cells.join(' ').toLowerCase()
  return (
    joined.includes('product') ||
    joined.includes('brand') ||
    joined.includes('platform') ||
    joined.includes('base price') ||
    joined.includes('item')
  )
}

function isSeparatorRow(cells) {
  return cells.every((c) => /^[-─—\s]+$/.test(c))
}

function parseCartItemsFromText(text) {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const items = []
  const errors = []
  let itemCounter = 1

  for (const line of lines) {
    const cells = line.split('\t').map((c) => c.trim()).filter(Boolean)

    if (cells.length < 3) continue
    if (isHeaderRow(cells)) continue
    if (isSeparatorRow(cells)) continue

    if (cells.length === 3) {
      const [productOrBrand, brandOrPlatform, priceOrPlatform] = cells
      const price = normalizePrice(priceOrPlatform)
      if (price) {
        items.push({
          itemId: `PDF-ITEM-${String(itemCounter).padStart(2, '0')}`,
          product: productOrBrand,
          brand: brandOrPlatform,
          platform: 'Unknown',
          basePrice: price,
        })
        itemCounter++
        continue
      }
    }

    if (cells.length >= 4) {
      let product, brand, platform, rawPrice

      if (cells.length === 4) {
        [product, brand, platform, rawPrice] = cells
      } else {
        const lastCell = cells[cells.length - 1]
        const priceCandidate = normalizePrice(lastCell)
        if (priceCandidate) {
          rawPrice = lastCell
          const rest = cells.slice(0, cells.length - 1)
          if (rest.length === 3) {
            [product, brand, platform] = rest
          } else {
            product = rest[0]
            brand = rest[1]
            platform = rest.slice(2).join(' ')
          }
        } else {
          errors.push(`Could not parse row: "${line}"`)
          continue
        }
      }

      const basePrice = normalizePrice(rawPrice)
      if (!basePrice) {
        errors.push(`Invalid base price in row: "${line}"`)
        continue
      }

      items.push({
        itemId: `PDF-ITEM-${String(itemCounter).padStart(2, '0')}`,
        product: product.trim(),
        brand: brand.trim(),
        platform: platform.trim(),
        basePrice,
      })
      itemCounter++
    }
  }

  return { items, errors }
}

export async function parseCartPDF(file) {
  let text
  try {
    text = await extractTextFromPDF(file)
  } catch (err) {
    return { success: false, error: `Could not read PDF: ${err.message}` }
  }

  if (!text.trim()) {
    return { success: false, error: 'The PDF appears to be empty or unreadable.' }
  }

  const { items, errors } = parseCartItemsFromText(text)

  if (items.length === 0) {
    const detail = errors.length > 0 ? ` Issues: ${errors.join('; ')}` : ''
    return { success: false, error: `No cart items found in the PDF.${detail}` }
  }

  return { success: true, items, parseErrors: errors }
}
