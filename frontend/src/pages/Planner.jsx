import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { parseInput, getAllActivities } from '../api/index'

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const MAP_CENTER = { lat: 36.8969, lng: 30.7133 }
const MAP_OPTIONS = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
}
const DAY_COLORS = ['#38bdf8', '#a78bfa', '#fb923c', '#34d399', '#f472b6']

const CATEGORY_LABELS = {
  tarihi_yer: 'Tarihi Yer', plaj: 'Plaj', doga: 'Doğa',
  restoran: 'Restoran', gece_hayati: 'Gece Hayatı',
  alisveris: 'Alışveriş', eglence: 'Eğlence',
}

const MUZEKART_VENUES = new Set([
  'Perge Antik Kenti', 'Aspendos Tiyatrosu', 'Termessos Antik Kenti',
  'Phaselis Antik Kenti', 'Olympos Antik Kenti', 'Antalya Müzesi',
  'Kaleiçi Müzesi', 'Karain Mağarası', 'Karatay Medresesi', 'Altınbeşik Mağarası',
])

const CATEGORY_IMAGES = {
  tarihi_yer: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Side_Ancient_City.jpg/960px-Side_Ancient_City.jpg',
  plaj: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Kaputas_Beach.JPG/960px-Kaputas_Beach.JPG',
  doga: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80',
  restoran: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
  gece_hayati: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400&q=80',
  alisveris: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
  eglence: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400&q=80',
}

const VISIT_DURATIONS = {
  tarihi_yer: 90, plaj: 180, doga: 120,
  restoran: 75, gece_hayati: 120, alisveris: 90, eglence: 120,
}

const QUICK_PROMPTS = [
  '2 günlük tarihi tur, 1500 TL',
  'Romantik akşam ve gece hayatı',
  'Aile dostu 3 günlük gezi',
  'Doğa ve plaj, 1000 TL',
]

const CONTEXTUAL_SUGGESTIONS = [
  'Daha ucuz alternatifler öner',
  'Daha fazla restoran ekle',
  'Tarihi mekan ekle',
  'Gece hayatı öner',
  'Plaj aktivitesi ekle',
]

const DAY_THEME_MAP = {
  tarihi_yer: 'Tarihi Keşif', plaj: 'Plaj ve Deniz', doga: 'Doğa Macerası',
  restoran: 'Gastronomi Günü', gece_hayati: 'Gece Hayatı',
  alisveris: 'Alışveriş ve Keşif', eglence: 'Eğlence Günü',
}

function getActivityImage(activity) {
  if (activity.image_url) return activity.image_url
  return CATEGORY_IMAGES[activity.category] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'
}

function getDayTheme(activities) {
  const counts = {}
  activities.forEach(a => { counts[a.category] = (counts[a.category] || 0) + 1 })
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
  return DAY_THEME_MAP[dominant] || 'Antalya Turu'
}

function getTripTitle(allActivities, numDays) {
  const counts = {}
  allActivities.forEach(a => { counts[a.category] = (counts[a.category] || 0) + 1 })
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const titles = {
    tarihi_yer: `${numDays} Günlük Tarihi Antalya Turu`,
    plaj: `${numDays} Günlük Antalya Plaj Tatili`,
    doga: `${numDays} Günlük Doğa Kaçamağı`,
    restoran: `${numDays} Günlük Gastronomi Turu`,
    gece_hayati: `${numDays} Günlük Eğlence Tatili`,
    alisveris: `${numDays} Günlük Keşif Turu`,
    eglence: `${numDays} Günlük Eğlenceli Tatil`,
  }
  return titles[dominant] || `${numDays} Günlük Antalya Tatili`
}

function categoryMatches(nlpCat, dbCat) {
  if (nlpCat === 'historical' || nlpCat === 'ruins' || nlpCat === 'museum') return dbCat === 'tarihi_yer'
  if (nlpCat === 'beach' || nlpCat === 'beachclub') return dbCat === 'plaj'
  if (nlpCat === 'nature' || nlpCat === 'waterfall' || nlpCat === 'cave' || nlpCat === 'park' || nlpCat === 'activity') return dbCat === 'doga'
  if (nlpCat === 'restaurant' || nlpCat === 'fine_dining') return dbCat === 'restoran'
  if (nlpCat === 'nightlife') return dbCat === 'gece_hayati'
  if (nlpCat === 'shopping' || nlpCat === 'mall' || nlpCat === 'market') return dbCat === 'alisveris'
  if (nlpCat === 'themepark' || nlpCat === 'family') return dbCat === 'eglence'
  return false
}

function buildTravelPlan(activities, days, budget, categories) {
  const numDays = days || 1  // Varsayılan 1 gün

  // Kategori filtresi
  let catFiltered = categories.length === 0
    ? [...activities]
    : activities.filter(a => categories.some(c => categoryMatches(c, a.category)))

  // Bütçe filtresi: aktivite fiyatı günlük bütçeyi geçemesin
  if (budget && catFiltered.length > 0) {
    const perDayBudget = budget / numDays
    const budgetFiltered = catFiltered.filter(a => a.price <= perDayBudget)
    // Bütçe filtrelemesi sonuç veriyorsa kullan, yoksa esnelt
    if (budgetFiltered.length >= numDays * 2) {
      catFiltered = budgetFiltered
    } else {
      // Esnek filtre: toplam bütçenin 1.5 katına kadar izin ver
      const relaxed = catFiltered.filter(a => a.price <= perDayBudget * 1.5)
      if (relaxed.length >= numDays) catFiltered = relaxed
    }
  }

  // Rating'e göre sırala
  let filtered = catFiltered.sort((a, b) => b.rating - a.rating)

  // Eşleşen aktivite yoksa tüm aktiviteleri kullan (bütçeye uygun)
  if (filtered.length === 0) {
    filtered = [...activities].sort((a, b) => b.rating - a.rating)
    if (budget) {
      const perDayBudget = budget / numDays
      const bf = filtered.filter(a => a.price <= perDayBudget)
      if (bf.length >= numDays) filtered = bf
    }
  }

  const plan = []
  for (let d = 0; d < numDays; d++) {
    const dayActivities = filtered.slice(d * 4, (d + 1) * 4)
    if (dayActivities.length > 0) {
      plan.push({ day: d + 1, theme: getDayTheme(dayActivities), activities: dayActivities })
    }
  }

  // Eksik günleri tüm aktivitelerden tamamla
  if (plan.length < numDays && filtered.length > 0) {
    const allSorted = [...activities].sort((a, b) => b.rating - a.rating)
    for (let d = plan.length; d < numDays; d++) {
      const dayActivities = allSorted.slice(d * 4, (d + 1) * 4)
      if (dayActivities.length > 0) {
        plan.push({ day: d + 1, theme: getDayTheme(dayActivities), activities: dayActivities })
      }
    }
  }

  return plan
}

function getActivityTime(activities, index) {
  let current = 9 * 60
  for (let i = 0; i < index; i++) {
    const dur = VISIT_DURATIONS[activities[i].category] || 90
    current += dur + 20
    if (current >= 12.5 * 60 && current < 14 * 60) current = 14 * 60
    if (current >= 21 * 60) current = 9 * 60
  }
  const h = Math.floor(current / 60)
  const m = current % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-2 h-2 bg-gray-400 rounded-full"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.13 }}
        />
      ))}
    </div>
  )
}

/* ── Activity Card (Layla.ai style) ── */
function ActivityCard({ activity, time, color, index, onRemove, onFocus }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => onFocus(activity)}
      className="bg-white rounded-xl border border-gray-100 mb-2 overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-4 p-4">
        {/* Photo */}
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
          <img
            src={getActivityImage(activity)}
            alt={activity.name}
            className="w-full h-full object-cover"
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80' }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: color }}
              >
                {index}
              </div>
              <p className="font-semibold text-gray-900 text-sm leading-tight">{activity.name}</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onRemove() }}
              className="opacity-0 group-hover:opacity-100 w-5 h-5 text-gray-300 hover:text-red-400 transition-all flex-shrink-0 flex items-center justify-center"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400">{CATEGORY_LABELS[activity.category] || activity.category}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-amber-500 font-medium">★ {activity.rating}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs font-semibold text-sky-600">
              {activity.price === 0 ? 'Ücretsiz' : `${activity.price} ₺`}
            </span>
            {MUZEKART_VENUES.has(activity.name) && (
              <>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs italic text-emerald-600">Müzekart: ücretsiz</span>
              </>
            )}
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">{time}</span>
          </div>
          {activity.description && (
            <p className="text-xs text-gray-400 mt-1.5 line-clamp-1 leading-relaxed">{activity.description}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ── Main Component ── */
export default function Planner() {
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)
  const dayRefs = useRef({})

  const [messages, setMessages] = useState([{
    role: 'ai',
    text: "Merhaba! Antalya'da nasıl bir gezi planlıyorsun? Kaç gün, ne görmek istiyorsun ve bütçen ne kadar?",
    time: new Date().toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit' })
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState(null)
  const [selectedMarker, setSelectedMarker] = useState(null)
  const [mapInstance, setMapInstance] = useState(null)
  const [activeDay, setActiveDay] = useState(null)
  const [leftWidth, setLeftWidth] = useState(() => Math.max(400, Math.round(window.innerWidth * 0.25)))
  const [rightWidth, setRightWidth] = useState(() => Math.round(window.innerWidth * 0.33))
  const dragState = useRef(null)

  const handleResizeStart = (panel, e) => {
    e.preventDefault()
    dragState.current = { panel, startX: e.clientX, startWidth: panel === 'left' ? leftWidth : rightWidth }
    const onMove = (e) => {
      if (!dragState.current) return
      const delta = e.clientX - dragState.current.startX
      if (dragState.current.panel === 'left') {
        setLeftWidth(Math.min(560, Math.max(400, dragState.current.startWidth + delta)))
      } else {
        setRightWidth(Math.min(760, Math.max(360, dragState.current.startWidth - delta)))
      }
    }
    const onUp = () => {
      dragState.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }
  const { isLoaded, loadError } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: MAPS_API_KEY || '' })
  const [mapFailed, setMapFailed] = useState(false)
  const mapReady = isLoaded && !loadError && !mapFailed
  const onMapLoad = useCallback(m => setMapInstance(m), [])

  useEffect(() => {
    window.gm_authFailure = () => setMapFailed(true)
    return () => { delete window.gm_authFailure }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (!mapInstance || !isLoaded || !plan) return
    const all = plan.days.flatMap(d => d.activities).filter(a => a.latitude && a.longitude)
    if (all.length === 0) return
    const bounds = new window.google.maps.LatLngBounds()
    all.forEach(a => bounds.extend({ lat: parseFloat(a.latitude), lng: parseFloat(a.longitude) }))
    mapInstance.fitBounds(bounds, { padding: 50 })
  }, [mapInstance, isLoaded, plan])

  // Biriken bağlam: plan oluştuktan sonra bütçe ve gün hatırlanır
  const sessionContext = useRef({ budget: null, days: null, categories: [] })

  const addAiMessage = (text) => setMessages(prev => [...prev, {
    role: 'ai', text,
    time: new Date().toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit' })
  }])

  const sendMessage = async (overrideText) => {
    const userText = (overrideText || input).trim()
    if (!userText) return
    setMessages(prev => [...prev, {
      role: 'user', text: userText,
      time: new Date().toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit' })
    }])
    setInput('')
    setLoading(true)

    try {
      const [parseRes, activitiesRes] = await Promise.all([
        parseInput({ user_id: parseInt(localStorage.getItem('user_id')) || 1, text: userText }),
        getAllActivities()
      ])
      const parsed = parseRes.data.parsed_plan || {}
      const allActivities = activitiesRes.data.activities || []
      const t = userText.toLowerCase()

      // Bağlamı güncelle (belirtilmişse)
      if (parsed.budget) sessionContext.current.budget = parsed.budget
      if (parsed.duration_days) sessionContext.current.days = parsed.duration_days
      if (parsed.categories?.length) {
        const merged = [...new Set([...sessionContext.current.categories, ...parsed.categories])]
        sessionContext.current.categories = merged
      }

      const ctx = sessionContext.current

      // ── Mevcut plan varsa: Refine ──
      if (plan) {
        const existingIds = new Set(plan.days.flatMap(d => d.activities).map(a => a.id))

        // Yeni gün sayısı belirtildiyse planı yeniden oluştur
        if (parsed.duration_days && parsed.duration_days !== plan.duration) {
          const newDays = buildTravelPlan(allActivities, parsed.duration_days, ctx.budget, ctx.categories)
          const allActs = newDays.flatMap(d => d.activities)
          const title = getTripTitle(allActs, newDays.length)
          const totalCost = allActs.reduce((s, a) => s + (a.price || 0), 0)
          setPlan({ days: newDays, budget: ctx.budget, duration: newDays.length, title, totalCost })
          setActiveDay(newDays[0]?.day || null)
          addAiMessage(`Plan ${parsed.duration_days} güne güncellendi! ${allActs.length} mekan, tahmini ${totalCost} TL.`)
          setLoading(false)
          return
        }

        // "Daha ucuz" → mevcut aktiviteleri daha ucuzu ile değiştir
        if (t.includes('ucuz') || t.includes('ekonomik') || t.includes('bütçe')) {
          const budget = parsed.budget || ctx.budget
          if (budget) {
            sessionContext.current.budget = budget
            const cheaper = allActivities
              .filter(a => !existingIds.has(a.id) && a.price <= budget / (plan.days.length * 4))
              .sort((a, b) => b.rating - a.rating)
            const newDays = buildTravelPlan(allActivities, plan.days.length, budget, ctx.categories)
            const allActs = newDays.flatMap(d => d.activities)
            const totalCost = allActs.reduce((s, a) => s + (a.price || 0), 0)
            setPlan(prev => ({ ...prev, days: newDays, budget, totalCost }))
            addAiMessage(`Bütçeye uygun ${cheaper.length > 0 ? 'daha uygun fiyatlı' : ''} mekanlarla plan güncellendi. Yeni toplam: ${totalCost} TL.`)
          } else {
            addAiMessage('Bütçeni belirtir misin? Örnek: "1500 TL bütçe ile yeniden planla"')
          }
          setLoading(false)
          return
        }

        // Kategori ekleme: "ekle", "öner" + kategori kelimesi
        if ((t.includes('ekle') || t.includes('öner') || t.includes('istiyorum')) && parsed.categories?.length) {
          const newCats = parsed.categories
          const toAdd = allActivities
            .filter(a => newCats.some(c => categoryMatches(c, a.category)) && !existingIds.has(a.id))
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 2)

          if (toAdd.length > 0) {
            setPlan(prev => {
              const updatedDays = prev.days.map((d, i) =>
                i === prev.days.length - 1
                  ? { ...d, activities: [...d.activities, ...toAdd], theme: getDayTheme([...d.activities, ...toAdd]) }
                  : d
              )
              const allActs = updatedDays.flatMap(d => d.activities)
              return { ...prev, days: updatedDays, totalCost: allActs.reduce((s, a) => s + (a.price || 0), 0) }
            })
            addAiMessage(`${toAdd.map(a => a.name).join(' ve ')} planına eklendi!`)
          } else {
            addAiMessage('Bu kategoride henüz eklenecek yeni mekan bulamadım. Farklı bir kategori dene!')
          }
          setLoading(false)
          return
        }

        // Genel güncelleme: yeni kategorilerle mevcut planı zenginleştir
        if (parsed.categories?.length > 0 || parsed.budget) {
          const newDays = buildTravelPlan(allActivities, ctx.days || plan.days.length, ctx.budget, ctx.categories)
          const allActs = newDays.flatMap(d => d.activities)
          const title = getTripTitle(allActs, newDays.length)
          const totalCost = allActs.reduce((s, a) => s + (a.price || 0), 0)
          setPlan({ days: newDays, budget: ctx.budget, duration: newDays.length, title, totalCost })
          addAiMessage(`Plan güncellendi! ${allActs.length} mekan, tahmini ${totalCost} TL.`)
          setLoading(false)
          return
        }

        // Tanımlanamayan mesaj
        addAiMessage('Planı nasıl değiştirmemi istersin? "Tarihi mekan ekle", "daha ucuz alternatifler" veya "3 günlük yap" gibi söyleyebilirsin.')
        setLoading(false)
        return
      }

      // ── İlk plan oluşturma ──
      const newDays = buildTravelPlan(allActivities, ctx.days, ctx.budget, ctx.categories)
      const allActs = newDays.flatMap(d => d.activities)
      const title = getTripTitle(allActs, newDays.length)
      const totalCost = allActs.reduce((s, a) => s + (a.price || 0), 0)
      setPlan({ days: newDays, budget: ctx.budget, duration: newDays.length, title, totalCost })
      setActiveDay(newDays[0]?.day || null)
      const budgetNote = ctx.budget ? ` Bütçen: ${ctx.budget} TL, tahmini harcama: ${totalCost} TL.` : ` Tahmini maliyet: ${totalCost} TL.`
      addAiMessage(`${title} hazırlandı! ${newDays.length} günlük programında ${allActs.length} mekan var.${budgetNote} Planı özelleştirmek için yeni mesaj yaz.`)
    } catch (err) {
      console.error('Planner API error:', err)
      addAiMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar dene.')
    }
    setLoading(false)
  }

  const [savedToast, setSavedToast] = useState(false)

  const savePlan = () => {
    if (!plan) return
    const raw = localStorage.getItem('travelmind_plans')
    const plans = raw ? JSON.parse(raw) : []
    const existing = plans.findIndex(p => p.id === plan.id)
    const entry = {
      id: plan.id || Date.now().toString(),
      title: plan.title,
      createdAt: plan.createdAt || new Date().toISOString(),
      days: plan.days,
      totalCost: plan.totalCost,
      budget: plan.budget,
      duration: plan.duration,
      status: 'active',
    }
    if (existing >= 0) plans[existing] = entry
    else plans.unshift(entry)
    localStorage.setItem('travelmind_plans', JSON.stringify(plans))
    setPlan(prev => ({ ...prev, id: entry.id, createdAt: entry.createdAt }))
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 2500)
  }

  useEffect(() => {
    const restore = localStorage.getItem('restore_plan')
    if (restore) {
      localStorage.removeItem('restore_plan')
      try {
        const restoredPlan = JSON.parse(restore)
        setTimeout(() => {
          setPlan(restoredPlan)
          setActiveDay(restoredPlan.days?.[0]?.day || null)
          sessionContext.current.budget = restoredPlan.budget || null
          sessionContext.current.days = restoredPlan.duration || null
          setMessages(prev => [...prev, {
            role: 'ai',
            text: `"${restoredPlan.title}" planı yüklendi! Değişiklik yapmak için mesaj yazabilirsin.`,
            time: new Date().toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit' })
          }])
        }, 0)
      } catch { /* ignore */ }
      return
    }
    const pending = localStorage.getItem('pending_prompt')
    if (pending) {
      localStorage.removeItem('pending_prompt')
      setTimeout(() => sendMessage(pending), 200)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const removeActivity = (dayIndex, activityId) => {
    setPlan(prev => {
      const newDays = prev.days
        .map((d, i) => i === dayIndex
          ? { ...d, activities: d.activities.filter(a => a.id !== activityId) }
          : d)
        .filter(d => d.activities.length > 0)
      const allActs = newDays.flatMap(d => d.activities)
      return { ...prev, days: newDays, totalCost: allActs.reduce((s, a) => s + (a.price || 0), 0) }
    })
  }

  const focusMarker = (activity) => {
    if (!mapInstance || !activity.latitude || !activity.longitude) return
    setSelectedMarker(activity)
    mapInstance.panTo({ lat: parseFloat(activity.latitude), lng: parseFloat(activity.longitude) })
    mapInstance.setZoom(15)
  }

  const goToRoute = () => {
    if (!plan) return
    const allActivities = plan.days.flatMap(d => d.activities)
    localStorage.setItem('selected_activities', JSON.stringify(allActivities))
    localStorage.setItem('day_plan', JSON.stringify(plan.days))
    navigate('/route')
  }

  const totalPlaces = plan ? plan.days.flatMap(d => d.activities).length : 0
  const visibleDays = activeDay !== null ? plan?.days.filter(d => d.day === activeDay) : plan?.days

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">

      {/* ── NAVBAR ── */}
      <nav className="bg-white border-b border-gray-100 px-5 h-14 flex items-center justify-between flex-shrink-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-lg font-bold text-gray-900 tracking-tight">
            Travel<span className="text-sky-500">Mind</span>
          </button>
          {plan && (
            <>
              <span className="text-gray-200 font-light">/</span>
              <span className="text-sm text-gray-500 font-medium truncate max-w-xs">{plan.title}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/plans')}
            className="hidden md:flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded-full transition-colors"
          >
            Planlarım
          </button>
          {plan && (
            <button
              onClick={savePlan}
              className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-all border ${
                savedToast
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              {savedToast ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Kaydedildi
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Kaydet
                </>
              )}
            </button>
          )}
          {plan && (
            <button
              onClick={goToRoute}
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Rotayı Gör
            </button>
          )}
        </div>
      </nav>

      {/* ── BODY ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT: AI CHAT ── */}
        <div className="flex-shrink-0 flex flex-col bg-white" style={{ width: leftWidth }}>

          {/* Chat header */}
          <div className="px-4 py-3.5 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm leading-none">TravelMind AI</p>
                <p className="text-[11px] text-emerald-500 mt-0.5">Çevrimiçi</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2.5 leading-relaxed">
              Seyahat tarzını ve bütçeni anlat, Antalya için kişisel programını oluşturayım.
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  )}
                  <div className="max-w-[85%]">
                    <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gray-900 text-white rounded-br-sm'
                        : 'bg-gray-50 text-gray-700 rounded-bl-sm border border-gray-100'
                    }`}>
                      {msg.text}
                    </div>
                    <p className={`text-[10px] text-gray-300 mt-0.5 ${msg.role === 'user' ? 'text-right' : ''}`}>{msg.time}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-3">
                  <TypingIndicator />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && !plan && (
            <div className="px-3 pb-2">
              <p className="text-[10px] text-gray-300 mb-2 uppercase tracking-widest font-medium">Hızlı başlangıç</p>
              <div className="flex flex-col gap-1.5">
                {QUICK_PROMPTS.map((p, i) => (
                  <button key={i} onClick={() => sendMessage(p)}
                    className="text-left text-[11px] bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded-xl transition-colors border border-gray-100 hover:border-gray-200">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {plan && (
            <div className="px-3 pb-2">
              <p className="text-[10px] text-gray-300 mb-2 uppercase tracking-widest font-medium">Planı düzenle</p>
              <div className="flex flex-wrap gap-1.5">
                {CONTEXTUAL_SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    className="text-[11px] bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-100 px-2.5 py-1 rounded-full transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-4 pt-2 flex-shrink-0 border-t border-gray-50">
            <div className="flex items-end gap-2 bg-gray-50 rounded-2xl p-2.5 border border-gray-100 focus-within:border-gray-300 transition-colors">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Gezini anlat..."
                className="flex-1 bg-transparent text-xs text-gray-800 placeholder-gray-400 resize-none outline-none max-h-20 py-0.5 px-1"
                rows={1}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-7 h-7 bg-gray-900 hover:bg-gray-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Resize handle — left */}
        <div
          onMouseDown={(e) => handleResizeStart('left', e)}
          className="w-1 flex-shrink-0 bg-gray-100 hover:bg-sky-400 cursor-col-resize transition-colors"
        />

        {/* ── MIDDLE: ITINERARY ── */}
        <div className="flex-1 bg-stone-50 overflow-y-auto min-w-0">
          {!plan ? (

            /* Empty state */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center p-8"
            >
              <div className="w-16 h-16 bg-white rounded-2xl border border-gray-100 flex items-center justify-center mb-5 shadow-sm">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1.5">Seyahat planın burada görünecek</h3>
              <p className="text-sm text-gray-400 max-w-xs mb-7 leading-relaxed">
                Sol tarafta ne görmek istediğini anlat. Kaç gün, hangi aktiviteler, bütçen ne kadar?
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-sm w-full">
                {QUICK_PROMPTS.map((p, i) => (
                  <button key={i} onClick={() => sendMessage(p)}
                    className="text-xs bg-white border border-gray-200 hover:border-gray-300 text-gray-600 px-3 py-2.5 rounded-xl transition-all shadow-sm hover:shadow text-left">
                    {p}
                  </button>
                ))}
              </div>
            </motion.div>

          ) : (

            /* Plan content */
            <div className="p-6 w-full">

              {/* Trip header */}
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">

                {/* Stats row */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4">
                  <h1 className="text-lg font-bold text-gray-900 mb-3">{plan.title}</h1>
                  <div className="flex items-center gap-5 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-600">{plan.days.length} gün</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">{totalPlaces} mekan</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">{plan.totalCost} TL tahmini</span>
                    </div>
                  </div>
                </div>

                {/* Day tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    onClick={() => setActiveDay(null)}
                    className={`flex-shrink-0 text-xs font-semibold px-3.5 py-2 rounded-full border transition-all ${
                      activeDay === null
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Tümü
                  </button>
                  {plan.days.map((day, i) => (
                    <button
                      key={day.day}
                      onClick={() => setActiveDay(day.day)}
                      className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full border transition-all ${
                        activeDay === day.day
                          ? 'text-white border-transparent'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                      style={activeDay === day.day ? { backgroundColor: DAY_COLORS[i], borderColor: DAY_COLORS[i] } : {}}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${activeDay === day.day ? 'bg-white' : ''}`}
                        style={activeDay !== day.day ? { backgroundColor: DAY_COLORS[i] } : {}} />
                      Gün {day.day}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Day sections */}
              {(visibleDays || []).map((day, di) => {
                const dayIndex = plan.days.findIndex(d => d.day === day.day)
                return (
                  <motion.div
                    key={day.day}
                    ref={el => { dayRefs.current[day.day] = el }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * di }}
                    className="mb-6"
                  >
                    {/* Day header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: DAY_COLORS[dayIndex] }}
                      >
                        {day.day}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">Gün {day.day} — {day.theme}</h3>
                        <p className="text-xs text-gray-400">
                          {day.activities.length} aktivite · {day.activities.reduce((s, a) => s + (a.price || 0), 0)} TL
                        </p>
                      </div>
                      {/* Stacked thumbnails */}
                      <div className="flex items-center">
                        {day.activities.slice(0, 3).map((a, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full overflow-hidden border-2 border-white shadow-sm"
                            style={{ marginLeft: i > 0 ? -8 : 0 }}
                          >
                            <img src={getActivityImage(a)} alt="" className="w-full h-full object-cover"
                              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=60&q=80' }} />
                          </div>
                        ))}
                        {day.activities.length > 3 && (
                          <div
                            className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                            style={{ marginLeft: -8, backgroundColor: DAY_COLORS[dayIndex] }}
                          >
                            +{day.activities.length - 3}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Activities */}
                    <div>
                      {day.activities.map((activity, actIndex) => (
                        <ActivityCard
                          key={activity.id}
                          activity={activity}
                          time={getActivityTime(day.activities, actIndex)}
                          color={DAY_COLORS[dayIndex]}
                          index={actIndex + 1}
                          onRemove={() => removeActivity(dayIndex, activity.id)}
                          onFocus={focusMarker}
                        />
                      ))}
                    </div>
                  </motion.div>
                )
              })}

              {/* Budget footer card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-900 text-white rounded-2xl p-5 flex items-center justify-between mb-6"
              >
                <div>
                  <p className="text-xs text-gray-400 mb-1">Toplam Tahmini Maliyet</p>
                  <p className="text-2xl font-bold">{plan.totalCost} TL</p>
                  <p className="text-xs text-gray-500 mt-0.5">{plan.days.length} gün · {totalPlaces} mekan</p>
                </div>
                <button
                  onClick={goToRoute}
                  className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
                >
                  Rotayı Gör
                </button>
              </motion.div>

            </div>
          )}
        </div>

        {/* Resize handle — right */}
        <div
          onMouseDown={(e) => handleResizeStart('right', e)}
          className="w-1 flex-shrink-0 bg-gray-100 hover:bg-sky-400 cursor-col-resize transition-colors"
        />

        {/* ── RIGHT: MAP ── */}
        <div className="flex-shrink-0 bg-gray-100 relative" style={{ width: rightWidth }}>
          {!mapReady ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
              {isLoaded ? (
                <>
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Harita yüklenemedi</p>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
                    Google Maps günlük kotası doldu. Plan oluşturma ve kaydetme çalışmaya devam eder. Harita yarın yenilenir.
                  </p>
                </>
              ) : (
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={MAP_CENTER}
              zoom={11}
              options={MAP_OPTIONS}
              onLoad={onMapLoad}
            >
              {plan && plan.days.map((day, dayIndex) => {
                const isVisible = activeDay === null || activeDay === day.day
                if (!isVisible) return null
                return day.activities
                  .filter(a => a.latitude && a.longitude)
                  .map((activity, actIndex) => (
                    <Marker
                      key={activity.id}
                      position={{ lat: parseFloat(activity.latitude), lng: parseFloat(activity.longitude) }}
                      onClick={() => focusMarker(activity)}
                      label={{ text: String(actIndex + 1), color: 'white', fontWeight: 'bold', fontSize: '10px' }}
                      icon={{
                        path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
                        fillColor: DAY_COLORS[dayIndex],
                        fillOpacity: 1,
                        strokeColor: 'white',
                        strokeWeight: 2,
                        scale: 0.85,
                      }}
                    />
                  ))
              })}

              {selectedMarker && selectedMarker.latitude && selectedMarker.longitude && (
                <InfoWindow
                  position={{ lat: parseFloat(selectedMarker.latitude), lng: parseFloat(selectedMarker.longitude) }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div style={{ maxWidth: 160 }}>
                    <img
                      src={getActivityImage(selectedMarker)}
                      alt={selectedMarker.name}
                      style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }}
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80' }}
                    />
                    <p style={{ fontWeight: '700', fontSize: 12, margin: '0 0 3px' }}>{selectedMarker.name}</p>
                    <p style={{ fontSize: 11, color: '#f59e0b', margin: '0 0 2px' }}>★ {selectedMarker.rating}</p>
                    <p style={{ fontSize: 11, color: '#0ea5e9', fontWeight: 600 }}>
                      {selectedMarker.price === 0 ? 'Ücretsiz' : `${selectedMarker.price} ₺`}
                    </p>
                    {MUZEKART_VENUES.has(selectedMarker.name) && (
                      <p style={{ fontSize: 10, color: '#059669', fontStyle: 'italic', margin: '2px 0 0' }}>Müzekart: ücretsiz</p>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}

          {!plan && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 text-center shadow-sm border border-white/50">
                <p className="text-sm font-semibold text-gray-600">Planını oluştur</p>
                <p className="text-xs text-gray-400 mt-0.5">Mekanlar haritada görünecek</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}