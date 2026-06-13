import { normalizeStatus, inferType } from './data.js'

// Maps an olfactory group string to one of five broad families.
export function getBroadCategory(group) {
  const g = (group || '').toLowerCase()
  if (g.includes('oud')) return 'Oud'
  if (/oriental|gourmand|vanilla/.test(g)) return 'Oriental'
  if (/citrus|aquatic|marine/.test(g)) return 'Fresh'
  if (/woody|spicy|chypre/.test(g)) return 'Woody'
  if (/floral|rose/.test(g)) return 'Floral'
  if (/aromatic|fruity|green/.test(g)) return 'Fresh'
  return null
}

export function filterFragrances(items, { search, type, olfactory, broadCategory, wearingOnly, forSaleOnly }) {
  const q = search.toLowerCase()
  return items.filter(item => {
    if (q && !item['brand'].toLowerCase().includes(q) && !item['name'].toLowerCase().includes(q)) return false
    const rawSize = item['size'] || item['volumeml'] || item['volume'] || ''
    const resolvedType = (item['type'] || inferType(rawSize)).toLowerCase()
    if (type !== 'all' && resolvedType && resolvedType !== type) return false
    if (olfactory) {
      if (item['olfactorygroup'] !== olfactory) return false
    } else if (broadCategory) {
      if (getBroadCategory(item['olfactorygroup']) !== broadCategory) return false
    }
    const inRotation = item['inrotation'] || item['currentlywearing'] || ''
    if (wearingOnly && inRotation.toLowerCase() !== 'yes') return false
    if (forSaleOnly && (item['status'] || '').toLowerCase() !== 'for sale') return false
    return true
  })
}

export function filterSkin(items, { search, category }) {
  const q = search.toLowerCase()
  return items.filter(item => {
    if (q && !item['brand'].toLowerCase().includes(q) && !item['name'].toLowerCase().includes(q)) return false
    if (category && item['category'] !== category) return false
    return true
  })
}

export function uniqueOlfactoryGroups(items) {
  return [...new Set(items.map(i => i['olfactorygroup']).filter(Boolean))].sort()
}

export function uniqueCategories(items) {
  return [...new Set(items.map(i => i['category']).filter(Boolean))].sort()
}

export function buildTasteProfile(items) {
  if (!items.length) return ''

  const broadCounts = {}
  const vibeCounts = {}
  let subtleCount = 0, strongCount = 0, moderateCount = 0
  let eveningCount = 0, casualCount = 0

  items.forEach(item => {
    const broad = getBroadCategory(item['olfactorygroup'] || '')
    if (broad) broadCounts[broad] = (broadCounts[broad] || 0) + 1

    ;(item['vibe'] || '').split(',').forEach(v => {
      const w = v.trim().toLowerCase()
      if (w) vibeCounts[w] = (vibeCounts[w] || 0) + 1
    })

    const sillage = (item['sillage'] || '').toLowerCase()
    if (sillage.includes('subtle')) subtleCount++
    else if (sillage.includes('strong')) strongCount++
    else if (sillage.includes('moderate')) moderateCount++

    const occasion = (item['occasion'] || '').toLowerCase()
    if (occasion.includes('evening')) eveningCount++
    if (occasion.includes('casual') || occasion.includes('daytime')) casualCount++
  })

  const topBroads = Object.entries(broadCounts).sort((a, b) => b[1] - a[1]).map(([k]) => k)
  const topVibes = Object.entries(vibeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k)

  const sentences = []

  if (topBroads.length >= 2) {
    sentences.push(`Tastes run ${topBroads[0].toLowerCase()} and ${topBroads[1].toLowerCase()}.`)
  } else if (topBroads.length === 1) {
    sentences.push(`Firmly in ${topBroads[0].toLowerCase()} territory.`)
  }

  if (topVibes.length >= 3) {
    const listed = topVibes.slice(0, -1).join(', ') + ' and ' + topVibes[topVibes.length - 1]
    sentences.push(`The through-line: ${listed}.`)
  }

  if (subtleCount > strongCount + moderateCount) {
    sentences.push('Wears close to the skin — not here to announce, here to reward.')
  } else if (strongCount > subtleCount + moderateCount) {
    sentences.push('Confident projection — these make an impression.')
  } else {
    sentences.push('Balanced between presence and restraint.')
  }

  return sentences.join(' ')
}
