// Published Google Sheet CSV URLs — append &gid=TAB_ID for each tab
const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGghLB-PaMt1jEZDhxb5NGhtxnBXgLAzuGqtUirigsSEwaCF70gvzCmeTFm0w0-4dWgpvNJ_K9jV1T/pub?output=csv'

// Tab GIDs — update if you add/reorder tabs in the Sheet
export const SHEET_URLS = {
  fragrances: `${BASE_URL}&gid=0`,
  skinBodyHair: `${BASE_URL}&gid=1571070935`,
  wishlist: `${BASE_URL}&gid=513636604`,
  candles: `${BASE_URL}&gid=540023937`,
}

function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const rawHeaders = splitCSVLine(lines[0]).map(h => h.trim())
  return lines.slice(1).map(line => {
    const values = splitCSVLine(line)
    const row = {}
    rawHeaders.forEach((h, i) => {
      const val = (values[i] || '').trim()
      row[h] = val
      // Also store under a normalised key (lowercase, no spaces/parens) for robust lookup
      row[normalizeKey(h)] = val
    })
    return row
  }).filter(row => row['Brand'] || row['brand'])
}

// e.g. "Volume (ml)" → "volumeml", "Top Notes" → "topnotes"
function normalizeKey(h) {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Handles quoted fields with commas inside
function splitCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

async function fetchTab(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  return parseCSV(text)
}

export async function loadData() {
  const [fragrances, skinBodyHair, wishlist, candles] = await Promise.all([
    fetchTab(SHEET_URLS.fragrances),
    fetchTab(SHEET_URLS.skinBodyHair).catch(() => []),
    fetchTab(SHEET_URLS.wishlist).catch(() => []),
    fetchTab(SHEET_URLS.candles).catch(() => []),
  ])
  return { fragrances, skinBodyHair, wishlist, candles }
}

// Infer sample/miniature/bottle from numeric ml value if Type column is blank
export function inferType(raw) {
  const ml = parseFloat(String(raw || '').replace(/[^\d.]/g, ''))
  if (isNaN(ml)) return ''
  if (ml <= 2) return 'sample'
  if (ml <= 20) return 'miniature'
  return 'bottle'
}

// Return size as "Xml" — handles bare numbers or values that already include ml/EDP etc.
export function formatSize(raw) {
  const s = String(raw || '').trim()
  if (!s) return ''
  // If it already contains a letter (ml, EDP, etc.) return as-is
  if (/[a-zA-Z]/.test(s)) return s
  return `${s}ml`
}

export function normalizeStatus(raw) {
  const s = (raw || '').toLowerCase().trim()
  if (s === 'for sale') return 'for-sale'
  if (s === 'not sharing') return 'not-sharing'
  return s || 'available'
}
