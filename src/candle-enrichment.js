// Static candle enrichment data.
// Key format: "brand|name" (both lowercased and trimmed).

export const CANDLE_ENRICHMENT = {
  'le labo|santal 26': {
    scentnotes: 'Sandalwood, Cedar, Amber, Vanilla, Musks',
    scentfamily: 'Woody Amber',
    throwstrength: 'Strong',
    burntime: '~60 hours',
  },
  'le labo|palo santo 14': {
    scentnotes: 'Palo Santo, Peru Balsam, Vetiver, Cedar, Sandalwood',
    scentfamily: 'Woody Resinous',
    throwstrength: 'Moderate',
    burntime: '~60 hours',
  },
  'diptyque|cotton': {
    scentnotes: 'Cotton, White Musk, White Tea, Orris',
    scentfamily: 'Fresh Floral',
    throwstrength: 'Moderate',
    burntime: '~60 hours',
  },
  'diptyque|figuier': {
    scentnotes: 'Fig Leaves, Fig Sap, Fig Wood, Ivy',
    scentfamily: 'Green Woody',
    throwstrength: 'Moderate',
    burntime: '~60 hours',
  },
  'aesop|ptolomy': {
    scentnotes: 'Galbanum, Cedarwood, Sandalwood, Benzoin, Leather',
    scentfamily: 'Woody Resinous',
    throwstrength: 'Moderate',
    burntime: '~60 hours',
  },
  'aesop|callippus': {
    scentnotes: 'Frankincense, Cardamom, Patchouli, Vetiver, Amber',
    scentfamily: 'Oriental Woody',
    throwstrength: 'Moderate',
    burntime: '~60 hours',
  },
  'aseop|callippus': {
    scentnotes: 'Frankincense, Cardamom, Patchouli, Vetiver, Amber',
    scentfamily: 'Oriental Woody',
    throwstrength: 'Moderate',
    burntime: '~60 hours',
  },
  'aesop|aganice': {
    scentnotes: 'Rose, Geranium, Sandalwood, Amber, Musks',
    scentfamily: 'Floral Woody',
    throwstrength: 'Moderate',
    burntime: '~60 hours',
  },
  'aseop|aganice': {
    scentnotes: 'Rose, Geranium, Sandalwood, Amber, Musks',
    scentfamily: 'Floral Woody',
    throwstrength: 'Moderate',
    burntime: '~60 hours',
  },
  'jo malone|wood sage & sea salt': {
    scentnotes: 'Sea Salt, Sage, Driftwood, Ambrette Seeds',
    scentfamily: 'Aromatic Aquatic',
    throwstrength: 'Moderate',
    burntime: '~45 hours',
  },
  'jo malone|english pear & freesia': {
    scentnotes: 'Pear, Freesia, Patchouli, White Wood, Musks',
    scentfamily: 'Floral Fruity',
    throwstrength: 'Moderate',
    burntime: '~45 hours',
  },
}

export function applyCandleEnrichment(items) {
  return items.map(item => {
    const key = `${(item['Brand'] || item['brand'] || '').toLowerCase().trim()}|${(item['Name'] || item['name'] || '').toLowerCase().trim()}`
    const patch = CANDLE_ENRICHMENT[key]
    if (!patch) return item

    const enriched = { ...item }
    const FIELD_MAP = {
      scentnotes:    ['scentnotes', 'Scent Notes'],
      scentfamily:   ['scentfamily', 'Scent Family'],
      throwstrength: ['throwstrength', 'Throw Strength'],
      burntime:      ['burntime', 'Burn Time'],
    }
    for (const [patchKey, colNames] of Object.entries(FIELD_MAP)) {
      if (patch[patchKey] && !enriched[colNames[0]]) {
        enriched[colNames[0]] = patch[patchKey]
        enriched[colNames[1]] = patch[patchKey]
      }
    }
    return enriched
  })
}
