import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { planChat, planBuild, planAdd, parseInput, savePlan as savePlanApi } from '../api/index'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const _PRIMARY_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const _BACKUP_KEY  = import.meta.env.VITE_GOOGLE_MAPS_API_KEY_BACKUP
const MAPS_API_KEY = sessionStorage.getItem('mapsKey') || _PRIMARY_KEY

if (_BACKUP_KEY && !sessionStorage.getItem('mapsKeyFailed')) {
  window.gm_authFailure = () => {
    sessionStorage.setItem('mapsKeyFailed', '1')
    sessionStorage.setItem('mapsKey', _BACKUP_KEY)
    window.location.reload()
  }
}
const MAP_CENTER = { lat: 36.8969, lng: 30.7133 }
const MAP_OPTIONS = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
}
const DAY_COLORS = [
  '#96C8C8', '#96AAD4', '#B896D4', '#D49696',
  '#96D4AA', '#D4B896', '#96B4CC', '#CC96B4',
  '#A8D496', '#D4D096', '#96C8BC', '#C896A0',
]

const CATEGORY_LABELS = {
  tarihi_yer: 'Tarihi Yer', plaj: 'Plaj', doga: 'Doğa',
  restoran: 'Restoran', gece_hayati: 'Gece Hayatı',
  alisveris: 'Alışveriş', eglence: 'Eğlence',
}


const CATEGORY_IMAGES = {
  tarihi_yer: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Side_Ancient_City.jpg/960px-Side_Ancient_City.jpg',
  plaj: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Kaputas_Beach.JPG/960px-Kaputas_Beach.JPG',
  doga: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80',
  restoran: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
  gece_hayati: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400&q=80',
  alisveris: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
  eglence: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400&q=80',
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

function getActivityImage(activity) {
  if (activity.image_url) return activity.image_url
  return CATEGORY_IMAGES[activity.category] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'
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

/* ── Activity Card (sortable, with drag handle) ── */
function SortableActivityCard({ activity, time, color, index, onRemove, onFocus, expandedId, setExpandedId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: activity.id })
  const expanded = expandedId === activity.id

  const handleClick = () => {
    if (isDragging) return
    onFocus(activity)
    setExpandedId(expanded ? null : activity.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition: transition || undefined }}
      className="mb-2"
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: isDragging ? 0.45 : 1, y: 0 }}
        exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0, overflow: 'hidden' }}
        transition={{ duration: 0.22, layout: { duration: 0.2 } }}
        onClick={handleClick}
        className={`bg-white rounded-xl border overflow-hidden transition-all cursor-pointer group ${
          expanded
            ? 'border-[#96C8C8] shadow-sm'
            : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
        } ${isDragging ? 'shadow-xl ring-1 ring-[#96C8C8]' : ''}`}
      >
        <div className="flex items-center gap-3 p-4">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-200 hover:text-gray-400 transition-colors flex-shrink-0 touch-none"
            onClick={e => e.stopPropagation()}
          >
            <svg className="w-3.5 h-5" viewBox="0 0 14 20" fill="currentColor">
              <circle cx="4" cy="4" r="1.5" /><circle cx="10" cy="4" r="1.5" />
              <circle cx="4" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" />
              <circle cx="4" cy="16" r="1.5" /><circle cx="10" cy="16" r="1.5" />
            </svg>
          </div>

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
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); onRemove() }}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 text-gray-300 hover:text-red-400 transition-all flex items-center justify-center"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <motion.svg
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.18 }}
                  className="w-3.5 h-3.5 text-gray-300 flex-shrink-0"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">{CATEGORY_LABELS[activity.category] || activity.category}</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-amber-500 font-medium">★ {activity.rating}</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs font-semibold text-[#4A9898]">
                {activity.price === 0 ? 'Ücretsiz' : `${activity.price} ₺`}
              </span>
              {activity.muzekart && activity.price === 0 && activity.original_price > 0 && (
                <>
                  <span className="text-xs text-gray-300">·</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af', textDecoration: 'line-through' }}>{activity.original_price} ₺</span>
                  <span className="text-xs italic text-emerald-600">Müzekart: ücretsiz</span>
                </>
              )}
              {activity.muzekart && activity.price > 0 && (
                <>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs italic text-emerald-600">Müzekart: ücretsiz</span>
                </>
              )}
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">{time}</span>
            </div>
          </div>
        </div>

        {/* Expandable description */}
        <AnimatePresence initial={false}>
          {expanded && activity.description && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-[11px] font-semibold text-[#4A9898] uppercase tracking-wide mb-1.5">Genel Bakış</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{activity.description}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/* ── User dropdown for Planner navbar ── */
function PlannerUserMenu({ navigate }) {
  const token = localStorage.getItem('token')
  const username = localStorage.getItem('username')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  if (!token) return (
    <button onClick={() => navigate('/login')} className="text-sm text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-full border border-gray-200 transition-colors">
      Giriş Yap
    </button>
  )
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 bg-white transition-colors"
      >
        <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#96C8C8' }}>
          {(username || 'U')[0].toUpperCase()}
        </span>
        <span className="hidden sm:block max-w-[90px] truncate text-gray-700">{username}</span>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
          <div className="px-4 py-2.5 border-b border-gray-50">
            <p className="text-xs text-gray-400">Giriş yapıldı</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{username}</p>
          </div>
          <button onClick={() => { setOpen(false); navigate('/plans') }} className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Planlarım</button>
          <button onClick={() => { setOpen(false); navigate('/profile') }} className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Profil Ayarları</button>
          <div className="border-t border-gray-100 my-1" />
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('username'); localStorage.removeItem('user_id'); setOpen(false); navigate('/') }} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">Çıkış Yap</button>
        </div>
      )}
    </div>
  )
}

/* ── Main Component ── */
export default function Planner() {
  const navigate = useNavigate()
  const location = useLocation()
  const navLink = (path) => `text-sm font-medium transition-colors ${location.pathname === path ? '' : 'text-gray-400 hover:text-gray-700'}`
  const messagesEndRef = useRef(null)
  const dayRefs = useRef({})
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

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
  const [expandedActivityId, setExpandedActivityId] = useState(null)
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
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).slice(2)}`)
  const sessionContext = useRef({
    budget: null, days: null, categories: [],
    groupType: 'solo', locations: [], sentimentVector: {}, timeSlots: {},
    has_muzekart: false, age_groups: [], is_family_trip: false, keywords: [],
  })

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

    const ctx = sessionContext.current

    // Mevcut ctx'ten backend'e gönderilecek collected objesini oluşturur
    const ctxToCollected = (overrides = {}) => ({
      budget:          ctx.budget,
      duration_days:   ctx.days || 1,
      group_type:      ctx.groupType || 'solo',
      categories:      ctx.categories || [],
      locations:       ctx.locations || [],
      sentiment_vector: ctx.sentimentVector || {},
      time_slots:      ctx.timeSlots || {},
      has_muzekart:    ctx.has_muzekart || false,
      age_groups:      ctx.age_groups || [],
      is_family_trip:  ctx.is_family_trip || false,
      keywords:        ctx.keywords || [],
      ...overrides,
    })

    // Backend'den plan al ve state'e set et
    const applyPlan = (backendPlan) => {
      setPlan({
        days:      backendPlan.days,
        budget:    backendPlan.budget,
        duration:  backendPlan.duration,
        title:     backendPlan.title,
        totalCost: backendPlan.totalCost,
      })
      setActiveDay(backendPlan.days[0]?.day || null)
    }

    try {
      // ── PLAN VAR: Refine modu — parseInput + plan-build ──
      if (plan) {
        const parseRes = await parseInput({ user_id: parseInt(localStorage.getItem('user_id')) || 1, text: userText })
        const parsed = parseRes.data.parsed_plan || {}
        const t = userText.toLowerCase()

        if (parsed.budget) ctx.budget = parsed.budget
        if (parsed.duration_days) ctx.days = parsed.duration_days
        if (parsed.group_type && parsed.group_type !== 'solo') ctx.groupType = parsed.group_type
        if (parsed.categories?.length) ctx.categories = [...new Set([...ctx.categories, ...parsed.categories])]
        if (parsed.locations?.length) {
          ctx.locations = [...ctx.locations, ...parsed.locations]
            .filter((l, i, arr) => arr.findIndex(x => x.name === l.name) === i)
        }
        const sv = parsed.parsed?.sentiment_vector || {}
        Object.entries(sv).forEach(([cat, score]) => { if (score !== 0) ctx.sentimentVector[cat] = score })
        const hasSentimentChange = Object.values(sv).some(s => s !== 0)

        // Müzekart değişikliği tespiti
        const muzekartYes = ['müzekart var', 'müzekartım var', 'müzekart aldım', 'müzekartım', 'müzekart aldı']
        const muzekartNo  = ['müzekart yok', 'müzekartım yok', 'müzekart almadım', 'müzekartsız']
        const hasMuzekartChange =
          muzekartYes.some(k => t.includes(k)) ? 'yes' :
          muzekartNo.some(k => t.includes(k))  ? 'no'  : null
        if (hasMuzekartChange === 'yes') { ctx.has_muzekart = true;  setHasMuzekart(true) }
        if (hasMuzekartChange === 'no')  { ctx.has_muzekart = false; setHasMuzekart(false) }

        const existingIds = plan.days.flatMap(d => d.activities).map(a => a.id)
        const isAddIntent = t.includes('ekle') || t.includes('öner') || t.includes('istiyorum') || t.includes('daha fazla')

        // ── EKLE operasyonu: backend aktivite seçer + Dijkstra optimize eder ──
        if (isAddIntent && (parsed.categories?.length || parsed.locations?.length)) {
          const category = parsed.categories?.[0] || parsed.locations?.[0]?.name || null
          if (category) {
            const currentPlan = {
              days: plan.days, budget: plan.budget, duration: plan.duration,
              title: plan.title, totalCost: plan.totalCost, has_muzekart: ctx.has_muzekart,
            }
            const res = await planAdd({
              current_plan: currentPlan,
              category,
              existing_ids: existingIds,
              count: 2,
              has_muzekart: ctx.has_muzekart || false,
              budget_per_activity: ctx.budget ? ctx.budget / (ctx.days || 1) : null,
            })
            const updated = res.data.plan
            const addedNames = res.data.added_names || []
            if (updated?.days?.length > 0) {
              applyPlan(updated)
              addAiMessage(addedNames.length > 0
                ? `${addedNames.join(' ve ')} planına eklendi!`
                : 'Bu kategoride eklenecek yeni mekan bulunamadı.')
            } else {
              addAiMessage('Eklenecek mekan bulunamadı.')
            }
          } else {
            addAiMessage('Hangi kategoriyi eklemek istediğini belirtir misin?')
          }
          setLoading(false); return
        }

        // ── Daha ucuz: bütçe değişmeden planı yeniden oluştur ──
        const isCheaperRequest = t.includes('ucuz') || t.includes('ekonomik') || t.includes('uygun fiyat')
        if (isCheaperRequest && !parsed.budget) {
          const res = await planBuild(ctxToCollected())
          const newPlan = res.data.plan
          if (newPlan?.days?.length > 0) {
            applyPlan(newPlan)
            addAiMessage(`Plan bütçene uygun alternatiflerle güncellendi! Tahmini harcama: ${newPlan.totalCost} TL.`)
          } else {
            addAiMessage('Plan güncellenirken bir sorun oluştu.')
          }
          setLoading(false); return
        }

        // ── MÜZEKART: aktiviteler aynı kalır, sadece fiyatlar güncellenir ──
        if (hasMuzekartChange !== null) {
          const hasMuzekart = ctx.has_muzekart
          const updatedDays = plan.days.map(d => ({
            ...d,
            activities: d.activities.map(a => ({
              ...a,
              price: (hasMuzekart && a.muzekart) ? 0 : (a.original_price ?? a.price),
            })),
            day_cost: d.activities.reduce((s, a) =>
              s + ((hasMuzekart && a.muzekart) ? 0 : (a.original_price ?? a.price)), 0),
          }))
          const totalCost = updatedDays.reduce((s, d) => s + d.day_cost, 0)
          setPlan(prev => ({ ...prev, days: updatedDays, totalCost }))
          addAiMessage(hasMuzekart
            ? `Müzekart eklendi! Müzekart kabul eden mekanlar ücretsiz. Yeni toplam: ${totalCost} TL.`
            : `Müzekart kaldırıldı. Yeni toplam: ${totalCost} TL.`)
          setLoading(false); return
        }

        // ── YENİDEN OLUŞTUR: gün/bütçe/sentiment/grup değişikliği ──
        const needsRebuild =
          (parsed.duration_days && parsed.duration_days !== plan.duration) ||
          (parsed.budget && parsed.budget !== ctx.budget) ||
          parsed.group_type ||
          hasSentimentChange

        if (needsRebuild) {
          const res = await planBuild(ctxToCollected())
          const newPlan = res.data.plan
          if (newPlan?.days?.length > 0) {
            applyPlan(newPlan)
            const excluded = Object.entries(ctx.sentimentVector)
              .filter(([, s]) => s < 0)
              .map(([c]) => ({ beach: 'plaj', nightlife: 'gece hayatı', restaurant: 'restoran', historical: 'tarihi', nature: 'doğa', shopping: 'alışveriş' }[c]))
              .filter(Boolean)
            const exNote = excluded.length ? ` (${excluded.join(', ')} dışarıda bırakıldı)` : ''
            const allActs = newPlan.days.flatMap(d => d.activities)
            addAiMessage(`Plan güncellendi${exNote}! ${allActs.length} mekan, tahmini ${newPlan.totalCost} TL.`)
          } else {
            addAiMessage('Plan güncellenirken bir sorun oluştu. Lütfen tekrar dene.')
          }
          setLoading(false); return
        }

        addAiMessage('Planı nasıl değiştirmemi istersin? "Tarihi mekan ekle", "daha ucuz alternatifler" veya "3 günlük yap" gibi söyleyebilirsin.')
        setLoading(false); return
      }

      // ── PLAN YOK: ChatEngine ile çok turlu konuşma ──
      const chatRes = await planChat({ session_id: sessionId, text: userText })
      const chat = chatRes.data

      if (chat.state === 'greeting' || chat.state === 'need_budget' || chat.state === 'need_muzekart') {
        addAiMessage(chat.reply)
        setLoading(false); return
      }

      if (chat.state === 'ready') {
        const collected = chat.session_summary?.collected || {}
        ctx.budget        = collected.budget || ctx.budget
        ctx.days          = collected.duration_days || ctx.days
        ctx.groupType     = collected.group_type || ctx.groupType
        ctx.categories    = collected.categories?.length ? collected.categories : ctx.categories
        ctx.locations     = collected.locations?.length ? collected.locations : ctx.locations
        ctx.sentimentVector = collected.sentiment_vector || ctx.sentimentVector
        ctx.timeSlots     = collected.time_slots || ctx.timeSlots
        ctx.has_muzekart  = collected.has_muzekart ?? ctx.has_muzekart
        setHasMuzekart(ctx.has_muzekart)
        ctx.age_groups    = collected.age_groups || ctx.age_groups
        ctx.is_family_trip = collected.is_family_trip ?? ctx.is_family_trip

        const backendPlan = chat.plan
        if (backendPlan?.days?.length > 0) {
          applyPlan(backendPlan)
          addAiMessage(chat.reply + ` Tahmini harcama: ${backendPlan.totalCost} TL. Planı özelleştirmek için mesaj yaz.`)
        } else {
          addAiMessage('Plan oluşturulurken bir sorun oluştu. Lütfen tekrar dene.')
        }
      }

    } catch (err) {
      console.error('Planner API error:', err)
      addAiMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar dene.')
    }
    setLoading(false)
  }

  const [hasMuzekart, setHasMuzekart] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const [loginBanner, setLoginBanner] = useState(false)

  const savePlan = async () => {
    if (!plan) return
    if (!localStorage.getItem('token')) {
      setLoginBanner(true)
      return
    }
    try {
      const payload = {
        trip_id: plan.id && !isNaN(Number(plan.id)) ? Number(plan.id) : null,
        title: plan.title,
        plan_data: JSON.stringify({ days: plan.days, title: plan.title, duration: plan.duration, budget: plan.budget }),
        total_cost: plan.totalCost || 0,
        duration: plan.duration || 1,
        budget: plan.budget || 0,
        status: 'active',
      }
      const res = await savePlanApi(payload)
      setPlan(prev => ({ ...prev, id: String(res.data.id) }))
      setSavedToast(true)
      setTimeout(() => setSavedToast(false), 2500)
    } catch {
      setSavedToast(false)
    }
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

  const handleDragEnd = ({ active, over }) => {
    if (!over || !plan || active.id === over.id) return
    let srcDay = -1, srcIdx = -1, tgtDay = -1, tgtIdx = -1
    plan.days.forEach((day, di) => {
      const ai = day.activities.findIndex(a => a.id === active.id)
      if (ai !== -1) { srcDay = di; srcIdx = ai }
      const oi = day.activities.findIndex(a => a.id === over.id)
      if (oi !== -1) { tgtDay = di; tgtIdx = oi }
    })
    if (srcDay === -1 || tgtDay === -1) return
    setPlan(prev => {
      const newDays = prev.days.map(d => ({ ...d, activities: [...d.activities] }))
      const [removed] = newDays[srcDay].activities.splice(srcIdx, 1)
      newDays[tgtDay].activities.splice(tgtIdx, 0, removed)
      const filtered = newDays.filter(d => d.activities.length > 0)
      return { ...prev, days: filtered, totalCost: filtered.flatMap(d => d.activities).reduce((s, a) => s + (a.price || 0), 0) }
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
    localStorage.setItem('plan_meta', JSON.stringify({
      id: plan.id,
      title: plan.title,
      totalCost: plan.totalCost,
      budget: plan.budget,
      duration: plan.duration,
      createdAt: plan.createdAt,
    }))
    navigate('/route')
  }

  const totalPlaces = plan ? plan.days.flatMap(d => d.activities).length : 0
  const visibleDays = activeDay !== null ? plan?.days.filter(d => d.day === activeDay) : plan?.days

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">

      {/* ── NAVBAR ── */}
      <nav className="relative bg-white border-b border-gray-100 px-5 h-14 flex items-center justify-between flex-shrink-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-xl font-bold text-gray-900 flex-shrink-0">
            Travel<span style={{ color: '#96C8C8' }}>Mind</span>
          </button>
          {plan && (
            <>
              <span className="text-gray-200 font-light">/</span>
              <span className="text-sm text-gray-500 font-medium truncate max-w-xs">{plan.title}</span>
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
          <button onClick={() => navigate('/')} className={navLink('/')} style={location.pathname === '/' ? { color: '#96C8C8' } : {}}>Ana Sayfa</button>
          <button onClick={() => navigate('/planner')} className={navLink('/planner')} style={location.pathname === '/planner' ? { color: '#96C8C8' } : {}}>Planlayıcı</button>
          <button onClick={() => navigate('/plans')} className={navLink('/plans')} style={location.pathname === '/plans' ? { color: '#96C8C8' } : {}}>Planlarım</button>
          <button onClick={() => navigate('/about')} className={navLink('/about')} style={location.pathname === '/about' ? { color: '#96C8C8' } : {}}>Hakkında</button>
        </div>

        <div className="flex items-center gap-2">
          {plan && (
            <button
              onClick={savePlan}
              className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-all border ${
                savedToast
                  ? 'bg-[#96C8C8] text-gray-900 border-[#96C8C8]'
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
          <PlannerUserMenu navigate={navigate} />
        </div>
      </nav>

      {/* ── LOGIN BANNER ── */}
      <AnimatePresence>
        {loginBanner && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 flex items-center justify-between gap-4 bg-gray-900 text-white px-5 py-3"
          >
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-[#96C8C8] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">Planını kaydetmek için giriş yapman gerekiyor.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate('/login')}
                className="text-xs font-bold bg-[#96C8C8] text-gray-900 px-4 py-1.5 rounded-full hover:bg-[#7DBCBC] transition-colors"
              >
                Giriş Yap
              </button>
              <button onClick={() => setLoginBanner(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#96C8C8] rounded-full border-2 border-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm leading-none">TravelMind AI</p>
                <p className="text-[11px] text-[#96C8C8] mt-0.5">Çevrimiçi</p>
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
                onChange={e => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); e.target.style.height = 'auto' } }}
                placeholder="Gezini anlat..."
                className="flex-1 bg-transparent text-xs text-gray-800 placeholder-gray-400 resize-none outline-none py-0.5 px-1"
                rows={1}
                style={{ height: 'auto', maxHeight: '120px', overflowY: 'auto' }}
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
          className="w-1 flex-shrink-0 bg-gray-100 hover:bg-[#7DBCBC]00 cursor-col-resize transition-colors"
        />

        {/* ── MIDDLE: ITINERARY ── */}
        <div className="flex-1 bg-stone-50 overflow-y-auto min-w-0">
          {!plan ? (

            /* Empty state — category browser */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full overflow-y-auto p-6"
            >
              <div className="max-w-lg mx-auto">
                <h3 className="text-base font-bold text-gray-800 mb-1">Ne tür aktiviteler istiyorsun?</h3>
                <p className="text-sm text-gray-400 mb-5 leading-relaxed">
                  Bir kategori seç veya sol panelde istediğin geziden bahset.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { key: 'tarihi_yer',  label: 'Tarihi Yerler',  sub: 'Antik kentler, müzeler, yapılar',  prompt: 'Tarihi yerler ve antik kentler görmek istiyorum',     emoji: '🏛️' },
                    { key: 'plaj',        label: 'Plajlar',        sub: 'Kıyılar, beach club, su sporları', prompt: 'Plaj ve deniz aktiviteleri istiyorum',                emoji: '🏖️' },
                    { key: 'doga',        label: 'Doğa',           sub: 'Şelaleler, kanyonlar, mağaralar',  prompt: 'Doğa yürüyüşü ve şelale gibi doğa aktiviteleri',     emoji: '🌿' },
                    { key: 'restoran',    label: 'Yeme & İçme',    sub: 'Restoranlar, kahvaltı, kafeler',   prompt: 'Güzel restoranlar ve kahvaltı mekanları istiyorum',   emoji: '🍽️' },
                    { key: 'gece_hayati', label: 'Gece Hayatı',    sub: 'Barlar, kulüpler, gece turları',   prompt: 'Barlar ve kulüpler istiyorum, gece eğlencesi',        emoji: '🌙' },
                    { key: 'alisveris',   label: 'Alışveriş',      sub: 'Çarşılar, AVM, butikler',          prompt: 'Alışveriş ve çarşı gezmek istiyorum',                emoji: '🛍️' },
                    { key: 'eglence',     label: 'Eğlence',        sub: 'Tema parkları, rafting, zipline',  prompt: 'Akvaryum, tema parkı ve rafting gibi aktiviteler',   emoji: '🎢' },
                  ].map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => sendMessage(cat.prompt)}
                      className="group relative flex items-start gap-3 p-3.5 bg-white rounded-2xl border border-gray-100 hover:border-[#96C8C8]/50 hover:shadow-sm transition-all text-left overflow-hidden"
                    >
                      <div
                        className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 relative"
                      >
                        <img
                          src={CATEGORY_IMAGES[cat.key]}
                          alt={cat.label}
                          className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-300"
                          onError={e => { e.target.style.display = 'none' }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-lg"
                          style={{ display: 'none' }}
                        >{cat.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{cat.label}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{cat.sub}</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-200 group-hover:text-[#96C8C8] transition-colors flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-center text-gray-300">veya sol panelde istediğin geziden bahset</p>
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
                      {(() => {
                        const origTotal = plan.days.flatMap(d => d.activities).reduce((s, a) => s + (a.original_price || 0), 0)
                        const muzekartSaving = hasMuzekart && origTotal > 0 && plan.totalCost < origTotal
                        return muzekartSaving
                          ? <span className="text-sm text-gray-600">
                              <span className="font-medium">{plan.totalCost} TL</span>
                              {' '}<span style={{textDecoration:'line-through',color:'#9ca3af'}}>{origTotal} TL</span>
                              {' '}<span style={{color:'#7DBCBC',fontSize:'11px'}}>müzekartla</span>
                            </span>
                          : <span className="text-sm text-gray-600">{plan.totalCost} TL tahmini</span>
                      })()}
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
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                    <SortableContext items={day.activities.map(a => a.id)} strategy={verticalListSortingStrategy}>
                      <AnimatePresence>
                        {day.activities.map((activity, actIndex) => (
                          <SortableActivityCard
                            key={activity.id}
                            activity={activity}
                            time={activity.start_time || ''}
                            color={DAY_COLORS[dayIndex]}
                            index={actIndex + 1}
                            onRemove={() => removeActivity(dayIndex, activity.id)}
                            onFocus={focusMarker}
                            expandedId={expandedActivityId}
                            setExpandedId={setExpandedActivityId}
                          />
                        ))}
                      </AnimatePresence>
                    </SortableContext>
                  </motion.div>
                )
              })}
              </DndContext>

              {/* Budget footer card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-900 text-white rounded-2xl p-5 flex items-center justify-between mb-6"
              >
                <div>
                  <p className="text-xs text-gray-400 mb-1">Toplam Tahmini Maliyet</p>
                  {(() => {
                    const origTotal = plan.days.flatMap(d => d.activities).reduce((s, a) => s + (a.original_price || 0), 0)
                    const muzekartSaving = hasMuzekart && origTotal > 0 && plan.totalCost < origTotal
                    return muzekartSaving
                      ? <div>
                          <p className="text-2xl font-bold">{plan.totalCost} TL</p>
                          <p className="text-xs mt-0.5" style={{color:'#9ca3af'}}>
                            <span style={{textDecoration:'line-through'}}>{origTotal} TL</span>
                            {' '}<span style={{color:'#7DBCBC'}}>müzekartla indirim uygulandı</span>
                          </p>
                        </div>
                      : <p className="text-2xl font-bold">{plan.totalCost} TL</p>
                  })()}
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
          className="w-1 flex-shrink-0 bg-gray-100 hover:bg-[#7DBCBC]00 cursor-col-resize transition-colors"
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
                    <p style={{ fontSize: 11, color: '#4A9898', fontWeight: 600 }}>
                      {selectedMarker.price === 0 ? 'Ücretsiz' : `${selectedMarker.price} ₺`}
                      {selectedMarker.muzekart && selectedMarker.price === 0 && selectedMarker.original_price > 0 && (
                        <span style={{ marginLeft: 4, fontSize: 10, textDecoration: 'line-through', color: '#9ca3af' }}>{selectedMarker.original_price} ₺</span>
                      )}
                    </p>
                    {selectedMarker.muzekart && selectedMarker.price > 0 && (
                      <p style={{ fontSize: 10, color: '#059669', fontStyle: 'italic', margin: '2px 0 0' }}>Müzekart: ücretsiz</p>
                    )}
                    {selectedMarker.muzekart && selectedMarker.price === 0 && (
                      <p style={{ fontSize: 10, color: '#059669', fontStyle: 'italic', margin: '2px 0 0' }}>Müzekart ile ücretsiz</p>
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