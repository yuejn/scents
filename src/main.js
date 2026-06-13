import './style.css'
import { loadData } from './data.js'
import { applyEnrichment } from './enrichment.js'
import { applyCandleEnrichment } from './candle-enrichment.js'
import {
  renderFragranceCard, renderSkinCard, renderWishlistCard, renderCandleCard,
  renderFragranceDetail, renderSkinDetail, renderWishlistDetail, renderCandleDetail,
} from './render.js'
import {
  filterFragrances, filterSkin,
  uniqueOlfactoryGroups, uniqueCategories,
  getBroadCategory, buildTasteProfile,
} from './filters.js'

// ── State ──
let data = { fragrances: [], skinBodyHair: [], wishlist: [], candles: [] }
let activeTab = 'fragrances'
let fragState = { search: '', type: 'all', broadCategory: '', olfactory: '', wearingOnly: false, forSaleOnly: false }
let skinState = { search: '', category: '' }
let wishlistState = { search: '', priority: '' }

// ── DOM refs ──
const loading = document.getElementById('loading')
const errorEl = document.getElementById('error')
const sectionFrag = document.getElementById('section-fragrances')
const sectionSkin = document.getElementById('section-skin-body-hair')
const sectionWishlist = document.getElementById('section-wishlist')
const sectionCandles = document.getElementById('section-candles')
const gridFrag = document.getElementById('grid-fragrances')
const gridSkin = document.getElementById('grid-skin')
const emptyFrag = document.getElementById('empty-fragrances')
const emptySkin = document.getElementById('empty-skin')
const emptyWishlist = document.getElementById('empty-wishlist')
const gridWishlist = document.getElementById('grid-wishlist')
const broadChips = document.getElementById('broad-chips')
const olfactoryChips = document.getElementById('olfactory-chips')
const olfactorySubRow = document.getElementById('olfactory-sub-row')
const categoryChips = document.getElementById('category-chips')
const wearingToggle = document.getElementById('wearing-toggle')
const saleToggle = document.getElementById('sale-toggle')
const tasteProfile = document.getElementById('taste-profile')
const sheetBackdrop = document.getElementById('sheet-backdrop')
const detailSheet = document.getElementById('detail-sheet')
const sheetContent = document.getElementById('sheet-content')
const sheetClose = document.getElementById('sheet-close')
const searchFrag = document.getElementById('search-fragrances')
const searchSkin = document.getElementById('search-skin')

// ── Init ──
async function init() {
  try {
    const raw = await loadData()
    data = {
      ...raw,
      fragrances: applyEnrichment(raw.fragrances),
      wishlist: applyEnrichment(raw.wishlist),
      candles: applyCandleEnrichment(raw.candles),
    }
    loading.classList.add('hidden')
    restoreFromURL()
    buildOlfactoryChips()
    buildCategoryChips()
    buildWishlistPriorityChips()
    buildCandleRepurchaseChips()
    applyRestoredFilterUI()
    showTab(activeTab)

    // Restore detail sheet from hash
    const found = findItemFromHash(location.hash)
    if (found) openDetail(found.item, found.type, { pushState: false })
  } catch (e) {
    loading.classList.add('hidden')
    errorEl.classList.remove('hidden')
    console.error(e)
  }
}

// ── Tab switching ──
function showTab(tab) {
  activeTab = tab
  sectionFrag.classList.toggle('hidden', tab !== 'fragrances')
  sectionSkin.classList.toggle('hidden', tab !== 'skin-body-hair')
  sectionWishlist.classList.toggle('hidden', tab !== 'wishlist')
  sectionCandles.classList.toggle('hidden', tab !== 'candles')
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab)
  })
  if (tab === 'fragrances') renderFragrances()
  else if (tab === 'skin-body-hair') renderSkin()
  else if (tab === 'wishlist') renderWishlist()
  else renderCandles()
}

document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => { showTab(btn.dataset.tab); syncURL() })
})

// ── Fragrance filters ──
const BROAD_ORDER = ['Floral', 'Fresh', 'Woody', 'Oriental', 'Oud']
const BROAD_META = {
  Floral:   { sub: 'soft & romantic' },
  Fresh:    { sub: 'clean & airy' },
  Woody:    { sub: 'earthy & rich' },
  Oriental: { sub: 'warm & spicy' },
  Oud:      { sub: 'dark & intense' },
}

function buildOlfactoryChips() {
  // Derive which broad categories actually have items
  const groups = uniqueOlfactoryGroups(data.fragrances)
  const activeBroads = BROAD_ORDER.filter(b =>
    groups.some(g => getBroadCategory(g) === b)
  )

  // Broad category row
  broadChips.innerHTML =
    `<button class="broad-chip active" data-broad=""><span class="broad-chip-label">All</span></button>` +
    activeBroads.map(b => {
      const m = BROAD_META[b] || {}
      return `<button class="broad-chip" data-broad="${b}">
        <span class="broad-chip-label">${b}</span>
        ${m.sub ? `<span class="broad-chip-sub">${m.sub}</span>` : ''}
      </button>`
    }).join('')

  broadChips.querySelectorAll('.broad-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      broadChips.querySelectorAll('.broad-chip').forEach(c => c.classList.remove('active'))
      chip.classList.add('active')
      fragState.broadCategory = chip.dataset.broad
      fragState.olfactory = ''
      buildSubChips()
      renderFragrances()
      syncURL()
    })
  })

  buildSubChips()
}

function buildSubChips() {
  const groups = uniqueOlfactoryGroups(data.fragrances)
  const sub = fragState.broadCategory
    ? groups.filter(g => getBroadCategory(g) === fragState.broadCategory)
    : []

  if (sub.length === 0) {
    olfactoryChips.innerHTML = ''
    olfactorySubRow.classList.add('hidden')
    return
  }

  olfactorySubRow.classList.remove('hidden')
  olfactoryChips.innerHTML =
    `<button class="chip active" data-olf="">All ${fragState.broadCategory}</button>` +
    sub.map(g =>
      `<button class="chip" data-olf="${g}">${g}</button>`
    ).join('')

  olfactoryChips.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      olfactoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'))
      chip.classList.add('active')
      fragState.olfactory = chip.dataset.olf
      renderFragrances()
      syncURL()
    })
  })
}

document.getElementById('type-chips').querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.getElementById('type-chips').querySelectorAll('.chip').forEach(c => c.classList.remove('active'))
    chip.classList.add('active')
    fragState.type = chip.dataset.type
    renderFragrances()
    syncURL()
  })
})

wearingToggle.addEventListener('click', () => {
  fragState.wearingOnly = !fragState.wearingOnly
  if (fragState.wearingOnly) { fragState.forSaleOnly = false; saleToggle.classList.remove('active') }
  wearingToggle.classList.toggle('active', fragState.wearingOnly)
  renderFragrances()
  syncURL()
})

saleToggle.addEventListener('click', () => {
  fragState.forSaleOnly = !fragState.forSaleOnly
  if (fragState.forSaleOnly) { fragState.wearingOnly = false; wearingToggle.classList.remove('active') }
  saleToggle.classList.toggle('active', fragState.forSaleOnly)
  renderFragrances()
  syncURL()
})

searchFrag.addEventListener('input', () => {
  fragState.search = searchFrag.value
  renderFragrances()
})

function renderFragrances() {
  const filtered = filterFragrances(data.fragrances, fragState)
  gridFrag.innerHTML = filtered.map(item => renderFragranceCard(item)).join('')
  emptyFrag.classList.toggle('hidden', filtered.length > 0)
  gridFrag.querySelectorAll('.card').forEach((card, i) => {
    card.addEventListener('click', () => openDetail(filtered[i], 'fragrance'))
  })

  if (fragState.wearingOnly) {
    const profile = buildTasteProfile(filtered)
    tasteProfile.innerHTML = profile ? `<p class="taste-profile-text">${profile}</p>` : ''
    tasteProfile.classList.toggle('hidden', !profile)
  } else {
    tasteProfile.classList.add('hidden')
  }
}

// ── Skin & Body filters ──
function buildCategoryChips() {
  const cats = uniqueCategories(data.skinBodyHair)
  const allBtn = `<button class="chip active" data-cat="">All</button>`
  categoryChips.innerHTML = allBtn + cats.map(c =>
    `<button class="chip" data-cat="${c}">${c}</button>`
  ).join('')
  categoryChips.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      categoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'))
      chip.classList.add('active')
      skinState.category = chip.dataset.cat
      renderSkin()
    })
  })
}

searchSkin.addEventListener('input', () => {
  skinState.search = searchSkin.value
  renderSkin()
})

function renderSkin() {
  const filtered = filterSkin(data.skinBodyHair, skinState)
  gridSkin.innerHTML = filtered.map(item => renderSkinCard(item)).join('')
  emptySkin.classList.toggle('hidden', filtered.length > 0)
  gridSkin.querySelectorAll('.card').forEach((card, i) => {
    card.addEventListener('click', () => openDetail(filtered[i], 'skin'))
  })
}

// ── URL state ──
function syncURL() {
  const p = new URLSearchParams()
  if (activeTab !== 'fragrances') p.set('tab', activeTab)
  if (activeTab === 'fragrances') {
    if (fragState.type !== 'all') p.set('type', fragState.type)
    if (fragState.broadCategory) p.set('broad', fragState.broadCategory)
    if (fragState.olfactory) p.set('olf', fragState.olfactory)
    if (fragState.wearingOnly) p.set('wearing', '1')
    if (fragState.forSaleOnly) p.set('sale', '1')
  }
  if (activeTab === 'wishlist' && wishlistState.priority) p.set('priority', wishlistState.priority)
  if (activeTab === 'candles' && candleState.repurchase) p.set('repurchase', candleState.repurchase)
  const search = p.toString() ? '?' + p.toString() : location.pathname
  history.pushState(null, '', search + location.hash)
}

function restoreFromURL() {
  const p = new URLSearchParams(location.search)
  const tab = p.get('tab') || 'fragrances'
  activeTab = tab

  if (tab === 'fragrances') {
    fragState.type = p.get('type') || 'all'
    fragState.broadCategory = p.get('broad') || ''
    fragState.olfactory = p.get('olf') || ''
    fragState.wearingOnly = p.get('wearing') === '1'
    fragState.forSaleOnly = p.get('sale') === '1'
  }
  if (tab === 'wishlist') wishlistState.priority = p.get('priority') || ''
  if (tab === 'candles') candleState.repurchase = p.get('repurchase') || ''
}

function applyRestoredFilterUI() {
  // Type chips
  document.getElementById('type-chips').querySelectorAll('.chip').forEach(c => {
    c.classList.toggle('active', c.dataset.type === fragState.type)
  })
  // Wearing / sale toggles
  wearingToggle.classList.toggle('active', fragState.wearingOnly)
  saleToggle.classList.toggle('active', fragState.forSaleOnly)
  // Broad chips — rebuild will mark active automatically via buildSubChips
  if (fragState.broadCategory) {
    broadChips.querySelectorAll('.broad-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.broad === fragState.broadCategory)
    })
    buildSubChips()
    if (fragState.olfactory) {
      olfactoryChips.querySelectorAll('.chip').forEach(c => {
        c.classList.toggle('active', c.dataset.olf === fragState.olfactory)
      })
    }
  }
  // Wishlist priority
  if (activeTab === 'wishlist') {
    document.getElementById('wishlist-priority-chips').querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('active', c.dataset.priority === wishlistState.priority)
    })
  }
  // Candle repurchase
  if (activeTab === 'candles') {
    document.getElementById('candle-repurchase-chips').querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('active', c.dataset.repurchase === candleState.repurchase)
    })
  }
}

// ── Routing helpers ──
function itemToHash(item, type) {
  const brand = (item['brand'] || item['Brand'] || '').toLowerCase().trim()
  const name = (item['name'] || item['Name'] || '').toLowerCase().trim()
  return `#${type}|${encodeURIComponent(brand)}|${encodeURIComponent(name)}`
}

function findItemFromHash(hash) {
  if (!hash || !hash.startsWith('#')) return null
  const parts = hash.slice(1).split('|')
  if (parts.length < 3) return null
  const [type, brand, name] = [parts[0], decodeURIComponent(parts[1]), decodeURIComponent(parts[2])]
  const list = type === 'fragrance' ? data.fragrances : type === 'wishlist' ? data.wishlist : type === 'candle' ? data.candles : data.skinBodyHair
  const item = list.find(f =>
    (f['brand'] || f['Brand'] || '').toLowerCase().trim() === brand &&
    (f['name'] || f['Name'] || '').toLowerCase().trim() === name
  )
  return item ? { item, type } : null
}

// ── Wishlist filters ──
function buildWishlistPriorityChips() {
  document.getElementById('wishlist-priority-chips').querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('wishlist-priority-chips').querySelectorAll('.chip').forEach(c => c.classList.remove('active'))
      chip.classList.add('active')
      wishlistState.priority = chip.dataset.priority
      renderWishlist()
      syncURL()
    })
  })
}

document.getElementById('search-wishlist').addEventListener('input', e => {
  wishlistState.search = e.target.value
  renderWishlist()
})

function renderWishlist() {
  const q = wishlistState.search.toLowerCase()
  const filtered = data.wishlist.filter(item => {
    if (q && !item['brand'].toLowerCase().includes(q) && !item['name'].toLowerCase().includes(q)) return false
    if (wishlistState.priority && (item['priority'] || '').toLowerCase() !== wishlistState.priority) return false
    return true
  })
  gridWishlist.innerHTML = filtered.map(item => renderWishlistCard(item)).join('')
  emptyWishlist.classList.toggle('hidden', filtered.length > 0)
  gridWishlist.querySelectorAll('.card').forEach((card, i) => {
    card.addEventListener('click', () => openDetail(filtered[i], 'wishlist'))
  })
}

// ── Candles ──
let candleState = { search: '', repurchase: '' }
const gridCandles = document.getElementById('grid-candles')
const emptyCandles = document.getElementById('empty-candles')

function buildCandleRepurchaseChips() {
  document.getElementById('candle-repurchase-chips').querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('candle-repurchase-chips').querySelectorAll('.chip').forEach(c => c.classList.remove('active'))
      chip.classList.add('active')
      candleState.repurchase = chip.dataset.repurchase
      renderCandles()
      syncURL()
    })
  })
}

document.getElementById('search-candles').addEventListener('input', e => {
  candleState.search = e.target.value
  renderCandles()
})

function renderCandles() {
  const q = candleState.search.toLowerCase()
  const filtered = data.candles.filter(item => {
    if (q && !(item['brand'] || '').toLowerCase().includes(q) && !(item['name'] || '').toLowerCase().includes(q)) return false
    if (candleState.repurchase) {
      const r = (item['wouldrepurchase'] || item['repurchase'] || '').toLowerCase()
      if (r !== candleState.repurchase) return false
    }
    return true
  })
  gridCandles.innerHTML = filtered.map(item => renderCandleCard(item)).join('')
  emptyCandles.classList.toggle('hidden', filtered.length > 0)
  gridCandles.querySelectorAll('.card').forEach((card, i) => {
    card.addEventListener('click', () => openDetail(filtered[i], 'candle'))
  })
}

// ── Detail sheet ──
function openDetail(item, type, { pushState = true } = {}) {
  sheetContent.innerHTML = type === 'fragrance'
    ? renderFragranceDetail(item, data.fragrances)
    : type === 'wishlist'
    ? renderWishlistDetail(item, data.fragrances)
    : type === 'candle'
    ? renderCandleDetail(item)
    : renderSkinDetail(item)

  // Wire up in-collection "matching profiles" links
  sheetContent.querySelectorAll('.comparable-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const brand = btn.dataset.brand.toLowerCase()
      const name = btn.dataset.name.toLowerCase()
      const linked = data.fragrances.find(f =>
        (f['brand'] || f['Brand'] || '').toLowerCase() === brand &&
        (f['name'] || f['Name'] || '').toLowerCase() === name
      )
      if (linked) openDetail(linked, 'fragrance')
    })
  })

  if (pushState) history.pushState({ type, open: true }, '', itemToHash(item, type))

  sheetBackdrop.classList.remove('hidden')
  detailSheet.classList.remove('hidden')
  document.body.style.overflow = 'hidden'
  detailSheet.scrollTop = 0
}

function closeDetail({ pushState = true } = {}) {
  sheetBackdrop.classList.add('hidden')
  detailSheet.classList.add('hidden')
  document.body.style.overflow = ''
  if (pushState) history.pushState(null, '', location.pathname + location.search)
}

sheetClose.addEventListener('click', () => closeDetail())
sheetBackdrop.addEventListener('click', () => closeDetail())
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetail() })

// Back/forward button — restore full page state
window.addEventListener('popstate', () => {
  const found = findItemFromHash(location.hash)
  if (found) {
    openDetail(found.item, found.type, { pushState: false })
  } else {
    closeDetail({ pushState: false })
    restoreFromURL()
    applyRestoredFilterUI()
    showTab(activeTab)
  }
})

// ── Start ──
init()

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/scents/sw.js').catch(() => {})
}
