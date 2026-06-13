import { normalizeStatus, inferType, formatSize } from './data.js'

const STATUS_LABELS = {
  available: 'Available',
  low: 'Low',
  'not-sharing': 'Not sharing',
  'for-sale': 'For sale',
  sold: 'Sold',
}

function skinBadgeHTML(status) {
  const key = normalizeStatus(status)
  const labels = {
    available: 'Free to take',
    low: 'Last one',
    'not-sharing': 'Not sharing',
    'for-sale': 'For sale',
    sold: 'Gone',
  }
  const label = labels[key] || key
  return `<span class="badge badge-${key}">${label}</span>`
}

function badgeHTML(status, type) {
  const key = normalizeStatus(status)
  let label = STATUS_LABELS[key] || key
  if (key === 'available') {
    if (type === 'sample') label = 'Sample available'
    else if (type === 'miniature' || type === 'bottle') label = 'Available — ask me'
  }
  if (key === 'low' && type === 'sample') label = 'Last few'
  return `<span class="badge badge-${key}">${label}</span>`
}

// Reads a field using the normalised key (robust to column name variations)
function f(item, normKey, fallbackNormKey) {
  return item[normKey] || (fallbackNormKey ? item[fallbackNormKey] : '') || ''
}

// Notes field: supports both old "jennysnote" and new "notes" column name
function getNote(item) {
  return f(item, 'notes') || f(item, 'jennysnote') || f(item, 'jennysnotes')
}

export function renderFragranceCard(item) {
  const status = normalizeStatus(f(item, 'status'))
  const isWearing = (f(item, 'inrotation') || f(item, 'currentlywearing')).toLowerCase() === 'yes'
  const olfactory = f(item, 'olfactorygroup')
  const note = getNote(item)
  const vibe = f(item, 'vibe')
  const rawSize = f(item, 'size') || f(item, 'volumeml') || f(item, 'volume')
  const type = (f(item, 'type') || inferType(rawSize)).toLowerCase()
  const qty = parseInt(f(item, 'quantity'), 10)

  return `
    <div class="card">
      <div class="card-brand">${escHtml(f(item, 'brand'))}</div>
      <div class="card-name">${escHtml(f(item, 'name'))}</div>
      <div class="card-meta">
        ${!isWearing ? badgeHTML(status, type) : ''}
        ${olfactory ? `<span class="olfactory-tag">${escHtml(olfactory)}</span>` : ''}
        ${isWearing ? `<span class="wearing-tag">✦ In rotation</span>` : ''}
        ${!isNaN(qty) && qty > 1 ? `<span class="qty-tag">${qty} available</span>` : ''}
      </div>
      ${vibe ? `<div class="card-vibes">${vibe.split(',').map(v => escHtml(v.trim())).join(' · ')}</div>` : ''}
      ${note ? `<div class="card-note">${escHtml(note)}</div>` : ''}
    </div>
  `
}

export function renderSkinCard(item) {
  const status = normalizeStatus(f(item, 'status'))
  const category = f(item, 'category')
  const note = getNote(item)

  return `
    <div class="card">
      <div class="card-brand">${escHtml(f(item, 'brand'))}</div>
      <div class="card-name">${escHtml(f(item, 'name'))}</div>
      <div class="card-meta">
        ${skinBadgeHTML(status)}
        ${category ? `<span class="olfactory-tag">${escHtml(category)}</span>` : ''}
      </div>
      ${note ? `<div class="card-note">${escHtml(note)}</div>` : ''}
    </div>
  `
}

export function renderFragranceDetail(item, allFragrances = []) {
  const status = normalizeStatus(f(item, 'status'))
  const isWearing = (f(item, 'inrotation') || f(item, 'currentlywearing')).toLowerCase() === 'yes'
  const top = f(item, 'topnotes')
  const heart = f(item, 'heartnotes')
  const base = f(item, 'basenotes')
  const longevity = f(item, 'longevity')
  const sillage = f(item, 'sillage')
  const occasion = f(item, 'occasion')
  const note = getNote(item)
  const vibe = f(item, 'vibe')
  const comparableto = f(item, 'comparableto')
  const olfactory = f(item, 'olfactorygroup')
  const rawSize = f(item, 'size') || f(item, 'volumeml') || f(item, 'volume')
  const size = formatSize(rawSize)
  const type = f(item, 'type') || inferType(rawSize)
  const qty = parseInt(f(item, 'quantity'), 10)
  const hasNotes = top || heart || base

  return `
    <div class="sheet-brand">${escHtml(f(item, 'brand'))}</div>
    <div class="sheet-name">${escHtml(f(item, 'name'))}</div>
    ${size || type ? `<div class="sheet-size">${escHtml(size)}${size && type ? ' · ' : ''}${escHtml(type)}${!isNaN(qty) && qty > 1 ? ` · ${qty} available` : ''}</div>` : ''}
    <div class="sheet-badges">
      ${!isWearing ? badgeHTML(status, type) : ''}
      ${isWearing ? `<span class="badge wearing-tag">✦ In rotation</span>` : ''}
      ${olfactory ? `<span class="olfactory-tag">${escHtml(olfactory)}</span>` : ''}
    </div>

    ${vibe ? `<div class="sheet-vibe">${vibePhrase(vibe)}</div>` : ''}

    ${hasNotes ? `
      <div class="sheet-divider"></div>
      <div class="notes-layers">
        ${top ? `
          <div class="notes-layer notes-layer--top">
            <span class="notes-layer-label">Top</span>
            <span class="notes-layer-value">${escHtml(top)}</span>
          </div>` : ''}
        ${heart ? `
          <div class="notes-layer notes-layer--heart">
            <span class="notes-layer-label">Heart</span>
            <span class="notes-layer-value">${escHtml(heart)}</span>
          </div>` : ''}
        ${base ? `
          <div class="notes-layer notes-layer--base">
            <span class="notes-layer-label">Base</span>
            <span class="notes-layer-value">${escHtml(base)}</span>
          </div>` : ''}
      </div>
    ` : ''}

    ${longevity || sillage ? `
      <div class="sheet-divider"></div>
      <div class="scent-bars">
        ${longevity ? `
          <div class="scent-bar-row">
            <span class="scent-bar-label">Longevity</span>
            <div class="scent-bar-track">
              <div class="scent-bar-fill" style="width:${longevityPct(longevity)}%"></div>
            </div>
            <span class="scent-bar-value">${escHtml(longevity)}</span>
          </div>` : ''}
        ${sillage ? `
          <div class="scent-bar-row">
            <span class="scent-bar-label">Sillage</span>
            <div class="scent-bar-track">
              <div class="scent-bar-fill" style="width:${sillagePct(sillage)}%"></div>
            </div>
            <span class="scent-bar-value">${escHtml(sillage)}</span>
          </div>
          <p class="projection-note">${projectionNote(sillage)}</p>
        ` : ''}
      </div>
    ` : ''}

    ${occasion ? `
      <div class="occasion-tags">
        ${occasion.split(',').map(o => `<span class="occasion-tag">${escHtml(o.trim())}</span>`).join('')}
      </div>
    ` : ''}

    ${comparableto ? `
      <div class="sheet-divider"></div>
      <div class="sheet-section-label">Matching profiles</div>
      <div class="comparable-to">${renderComparableTo(comparableto, allFragrances)}</div>
    ` : ''}

    ${note ? `
      <div class="sheet-divider"></div>
      <div class="sheet-section-label">Jenny's note</div>
      <div class="sheet-note">"${escHtml(note)}"</div>
    ` : ''}

    <div class="sheet-divider"></div>
    <div class="sheet-sources">
      <p>Notes, longevity &amp; sillage: <a href="https://www.fragrantica.com" target="_blank" rel="noopener">Fragrantica</a></p>
      ${(vibe || comparableto) ? `<p>Vibes &amp; matching profiles: AI-generated suggestions, not verified</p>` : ''}
    </div>
  `
}

export function renderSkinDetail(item) {
  const status = normalizeStatus(f(item, 'status'))
  const note = getNote(item)
  const rawSize = f(item, 'size') || f(item, 'volumeml')
  const size = formatSize(rawSize)
  const occasion = f(item, 'occasion')

  return `
    <div class="sheet-brand">${escHtml(f(item, 'brand'))}</div>
    <div class="sheet-name">${escHtml(f(item, 'name'))}</div>
    ${size ? `<div class="sheet-size">${escHtml(size)}</div>` : ''}
    <div class="sheet-badges">
      ${skinBadgeHTML(status)}
      ${f(item, 'category') ? `<span class="olfactory-tag">${escHtml(f(item, 'category'))}</span>` : ''}
    </div>
    ${occasion ? `
      <div class="pills">
        ${occasion.split(',').map(o => `<span class="pill">${escHtml(o.trim())}</span>`).join('')}
      </div>
      <div class="sheet-divider"></div>
    ` : ''}
    ${note ? `
      <div class="sheet-section-label">Jenny's note</div>
      <div class="sheet-note">"${escHtml(note)}"</div>
    ` : ''}
  `
}

export function renderWishlistCard(item) {
  const priority = (f(item, 'priority') || '').toLowerCase()
  const note = getNote(item)
  const vibe = f(item, 'vibe')
  const type = (f(item, 'type') || '').toLowerCase()

  return `
    <div class="card">
      <div class="card-brand">${escHtml(f(item, 'brand'))}</div>
      <div class="card-name">${escHtml(f(item, 'name'))}</div>
      <div class="card-meta">
        ${priority ? `<span class="priority-tag priority-${priority}">${escHtml(priority)}</span>` : ''}
        ${type ? `<span class="olfactory-tag">${escHtml(type)}</span>` : ''}
      </div>
      ${vibe ? `<div class="card-vibes">${vibe.split(',').map(v => escHtml(v.trim())).join(' · ')}</div>` : ''}
      ${note ? `<div class="card-note">${escHtml(note)}</div>` : ''}
    </div>
  `
}

export function renderWishlistDetail(item, allFragrances = []) {
  const note = getNote(item)
  const vibe = f(item, 'vibe')
  const comparableto = f(item, 'comparableto')
  const top = f(item, 'topnotes')
  const heart = f(item, 'heartnotes')
  const base = f(item, 'basenotes')
  const olfactory = f(item, 'olfactorygroup')
  const priority = (f(item, 'priority') || '').toLowerCase()
  const type = f(item, 'type')
  const hasNotes = top || heart || base

  return `
    <div class="sheet-brand">${escHtml(f(item, 'brand'))}</div>
    <div class="sheet-name">${escHtml(f(item, 'name'))}</div>
    ${type || priority ? `<div class="sheet-size">${escHtml(type)}${type && priority ? ' · ' : ''}${priority ? escHtml(priority) + ' priority' : ''}</div>` : ''}
    <div class="sheet-badges">
      ${olfactory ? `<span class="olfactory-tag">${escHtml(olfactory)}</span>` : ''}
    </div>

    ${vibe ? `<div class="sheet-vibe">${vibePhrase(vibe)}</div>` : ''}

    ${hasNotes ? `
      <div class="sheet-divider"></div>
      <div class="notes-layers">
        ${top ? `<div class="notes-layer notes-layer--top"><span class="notes-layer-label">Top</span><span class="notes-layer-value">${escHtml(top)}</span></div>` : ''}
        ${heart ? `<div class="notes-layer notes-layer--heart"><span class="notes-layer-label">Heart</span><span class="notes-layer-value">${escHtml(heart)}</span></div>` : ''}
        ${base ? `<div class="notes-layer notes-layer--base"><span class="notes-layer-label">Base</span><span class="notes-layer-value">${escHtml(base)}</span></div>` : ''}
      </div>
    ` : ''}

    ${comparableto ? `
      <div class="sheet-divider"></div>
      <div class="sheet-section-label">Matching profiles</div>
      <div class="comparable-to">${renderComparableTo(comparableto, allFragrances)}</div>
    ` : ''}

    ${note ? `
      <div class="sheet-divider"></div>
      <div class="sheet-section-label">Notes</div>
      <div class="sheet-note">"${escHtml(note)}"</div>
    ` : ''}

    ${hasNotes ? `
      <div class="sheet-divider"></div>
      <div class="sheet-sources">
        <p>Notes data: <a href="https://www.fragrantica.com" target="_blank" rel="noopener">Fragrantica</a></p>
        ${(vibe || comparableto) ? `<p>Vibes &amp; matching profiles: AI-generated suggestions, not verified</p>` : ''}
      </div>
    ` : ''}
  `
}

export function renderCandleCard(item) {
  const repurchase = (f(item, 'wouldrepurchase') || f(item, 'repurchase') || '').toLowerCase()
  const scentfamily = f(item, 'scentfamily')
  const scentnotes = f(item, 'scentnotes')
  const note = getNote(item)

  return `
    <div class="card">
      <div class="card-brand">${escHtml(f(item, 'brand'))}</div>
      <div class="card-name">${escHtml(f(item, 'name'))}</div>
      <div class="card-meta">
        ${repurchase === 'yes' ? `<span class="badge badge-available">Would repurchase</span>` : ''}
        ${repurchase === 'no' ? `<span class="badge badge-not-sharing">Wouldn't repurchase</span>` : ''}
        ${scentfamily ? `<span class="olfactory-tag">${escHtml(scentfamily)}</span>` : ''}
      </div>
      ${scentnotes ? `<div class="card-vibes">${escHtml(scentnotes)}</div>` : ''}
      ${note ? `<div class="card-note">${escHtml(note)}</div>` : ''}
    </div>
  `
}

export function renderCandleDetail(item) {
  const repurchase = (f(item, 'wouldrepurchase') || f(item, 'repurchase') || '').toLowerCase()
  const scentfamily = f(item, 'scentfamily')
  const scentnotes = f(item, 'scentnotes')
  const throwstrength = f(item, 'throwstrength')
  const burntime = f(item, 'burntime')
  const note = getNote(item)

  return `
    <div class="sheet-brand">${escHtml(f(item, 'brand'))}</div>
    <div class="sheet-name">${escHtml(f(item, 'name'))}</div>
    <div class="sheet-badges">
      ${repurchase === 'yes' ? `<span class="badge badge-available">Would repurchase</span>` : ''}
      ${repurchase === 'no' ? `<span class="badge badge-not-sharing">Wouldn't repurchase</span>` : ''}
      ${scentfamily ? `<span class="olfactory-tag">${escHtml(scentfamily)}</span>` : ''}
    </div>

    ${scentnotes ? `
      <div class="sheet-divider"></div>
      <div class="sheet-section-label">Scent</div>
      <div class="sheet-note" style="font-style:normal">${escHtml(scentnotes)}</div>
    ` : ''}

    ${throwstrength || burntime ? `
      <div class="sheet-divider"></div>
      <div class="scent-bars">
        ${throwstrength ? `
          <div class="scent-bar-row">
            <span class="scent-bar-label">Throw</span>
            <div class="scent-bar-track">
              <div class="scent-bar-fill" style="width:${throwPct(throwstrength)}%"></div>
            </div>
            <span class="scent-bar-value">${escHtml(throwstrength)}</span>
          </div>
          <p class="projection-note">${throwNote(throwstrength)}</p>
        ` : ''}
        ${burntime ? `
          <div class="scent-bar-row">
            <span class="scent-bar-label">Burn time</span>
            <div class="scent-bar-track"><div class="scent-bar-fill" style="width:100%"></div></div>
            <span class="scent-bar-value">${escHtml(burntime)}</span>
          </div>
        ` : ''}
      </div>
    ` : ''}

    ${note ? `
      <div class="sheet-divider"></div>
      <div class="sheet-section-label">Notes</div>
      <div class="sheet-note">"${escHtml(note)}"</div>
    ` : ''}
  `
}

function throwPct(raw) {
  const s = raw.toLowerCase()
  if (s.includes('strong')) return 100
  if (s.includes('moderate') || s.includes('medium')) return 60
  return 30
}

function throwNote(raw) {
  const s = raw.toLowerCase()
  if (s.includes('strong')) return 'Fills a room easily.'
  if (s.includes('moderate') || s.includes('medium')) return 'Scents the immediate area without being overwhelming.'
  return 'Subtle -- best appreciated up close.'
}

function longevityPct(raw) {
  const s = raw.toLowerCase()
  if (s.includes('very long') || s.includes('10+') || s.includes('12+')) return 100
  if (s.includes('long') || s.includes('7') || s.includes('8') || s.includes('9')) return 75
  if (s.includes('moderate') || s.includes('4') || s.includes('5') || s.includes('6')) return 50
  return 25
}

function sillagePct(raw) {
  const s = raw.toLowerCase()
  if (s.includes('very strong') || s.includes('enormous') || s.includes('beast')) return 100
  if (s.includes('strong') || s.includes('heavy')) return 75
  if (s.includes('moderate') || s.includes('medium')) return 50
  return 25
}

function projectionNote(raw) {
  const s = raw.toLowerCase()
  if (s.includes('very strong') || s.includes('enormous') || s.includes('beast'))
    return 'Commands a room. Wear sparingly, best outdoors or in large spaces.'
  if (s.includes('strong') || s.includes('heavy'))
    return 'Projects well. People around you will notice it.'
  if (s.includes('moderate') || s.includes('medium'))
    return 'A gentle presence, noticeable to those nearby without filling the room.'
  return 'Stays close to your skin -- a scent noticed only up close.'
}

function vibePhrase(vibe) {
  const parts = vibe.split(',').map(v => escHtml(v.trim()))
  if (parts.length === 1) return parts[0]
  return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1]
}

function renderComparableTo(comparableto, allFragrances) {
  return comparableto.split(',').map(segment => {
    const s = segment.trim()
    const match = allFragrances.find(f => {
      const name = (f['name'] || f['Name'] || '').toLowerCase()
      return name.length > 3 && s.toLowerCase().includes(name)
    })
    if (match) {
      const brand = escHtml(match['brand'] || match['Brand'] || '')
      const name = escHtml(match['name'] || match['Name'] || '')
      return `<button class="comparable-link" data-brand="${brand}" data-name="${name}">${escHtml(s)}</button>`
    }
    return escHtml(s)
  }).join(', ')
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
