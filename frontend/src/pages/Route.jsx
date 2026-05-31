import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { savePlan } from '../api/index'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const DAY_COLORS = [
  '#96C8C8', '#96AAD4', '#B896D4', '#D49696',
  '#96D4AA', '#D4B896', '#96B4CC', '#CC96B4',
  '#A8D496', '#D4D096', '#96C8BC', '#C896A0',
]

const CATEGORY_IMAGES = {
  tarihi_yer:  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Side_Ancient_City.jpg/960px-Side_Ancient_City.jpg',
  plaj:        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Kaputas_Beach.JPG/960px-Kaputas_Beach.JPG',
  doga:        'https://images.unsplash.com/photo-1546180245-c59350c0dc6d?w=300&q=80',
  restoran:    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&q=80',
  gece_hayati: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=300&q=80',
}

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

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9dff0' }] },
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f5f5f0' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ebebeb' }] },
  ],
}

function getPlaceImage(activity) {
  if (activity.image_url) return activity.image_url
  return CATEGORY_IMAGES[activity.category] || 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=300&q=80'
}

function nearestNeighborSort(activities) {
  if (!activities || activities.length <= 1) return activities || []
  const withCoords = activities.filter(a => a.latitude && a.longitude)
  const withoutCoords = activities.filter(a => !a.latitude || !a.longitude)
  if (withCoords.length <= 1) return activities
  const result = [withCoords[0]]
  const remaining = [...withCoords.slice(1)]
  while (remaining.length > 0) {
    const last = result[result.length - 1]
    let minDist = Infinity, minIdx = 0
    remaining.forEach((a, i) => {
      const dlat = parseFloat(a.latitude) - parseFloat(last.latitude)
      const dlng = parseFloat(a.longitude) - parseFloat(last.longitude)
      const d = dlat * dlat + dlng * dlng
      if (d < minDist) { minDist = d; minIdx = i }
    })
    result.push(remaining.splice(minIdx, 1)[0])
  }
  return [...result, ...withoutCoords]
}

function initStorage() {
  try {
    const savedActs = localStorage.getItem('selected_activities')
    const savedPlan = localStorage.getItem('day_plan')
    if (!savedActs) return { dayPlan: [], activities: [] }
    const acts = JSON.parse(savedActs)
    if (savedPlan) {
      const plan = JSON.parse(savedPlan)
      const optimized = plan.map(day => ({ ...day, activities: nearestNeighborSort(day.activities) }))
      return { dayPlan: optimized, activities: optimized.flatMap(d => d.activities) }
    }
    const sorted = nearestNeighborSort(acts)
    const days = []
    for (let i = 0; i < Math.ceil(sorted.length / 4); i++) {
      days.push({ day: i + 1, activities: sorted.slice(i * 4, (i + 1) * 4) })
    }
    return { dayPlan: days, activities: sorted }
  } catch {
    return { dayPlan: [], activities: [] }
  }
}

function UserMenu({ navigate }) {
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

export default function RoutePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const navLink = (path) => `text-sm font-medium transition-colors ${location.pathname === path ? '' : 'text-gray-400 hover:text-gray-700'}`
  const [activities] = useState(() => initStorage().activities)
  const [dayPlan] = useState(() => initStorage().dayPlan)
  const [planMeta] = useState(() => {
    try { return JSON.parse(localStorage.getItem('plan_meta') || '{}') } catch { return {} }
  })
  const [planTitle, setPlanTitle] = useState(() => {
    try {
      const meta = JSON.parse(localStorage.getItem('plan_meta') || '{}')
      return meta.title || ''
    } catch { return '' }
  })
  const [editingTitle, setEditingTitle] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [roadPaths, setRoadPaths] = useState({})
  const [activeDay, setActiveDay] = useState('all')
  const [focused, setFocused] = useState(null)
  const [map, setMap] = useState(null)
  const polylinesRef = useRef([])
  const [leftWidth, setLeftWidth] = useState(() => Math.max(380, Math.round(window.innerWidth * 0.28)))
  const dragState = useRef(null)

  const handleResizeStart = (e) => {
    e.preventDefault()
    dragState.current = { startX: e.clientX, startWidth: leftWidth }
    const onMove = (e) => {
      if (!dragState.current) return
      const delta = e.clientX - dragState.current.startX
      setLeftWidth(Math.min(620, Math.max(280, dragState.current.startWidth + delta)))
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

  const { isLoaded, loadError } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: MAPS_API_KEY })
  const [mapFailed, setMapFailed] = useState(false)
  const mapReady = isLoaded && !loadError && !mapFailed

  useEffect(() => {
    window.gm_authFailure = () => setMapFailed(true)
    return () => { delete window.gm_authFailure }
  }, [])

  // OSRM road-following routes
  useEffect(() => {
    if (dayPlan.length === 0) return
    dayPlan.forEach(async (day, dayIndex) => {
      const valid = day.activities.filter(a => a.latitude && a.longitude)
      if (valid.length < 2) return
      const coordStr = valid.map(a => `${parseFloat(a.longitude)},${parseFloat(a.latitude)}`).join(';')
      const endpoints = [
        `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`,
        `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coordStr}?overview=full&geometries=geojson`,
      ]
      for (const url of endpoints) {
        try {
          const controller = new AbortController()
          const tid = setTimeout(() => controller.abort(), 8000)
          const res = await fetch(url, { signal: controller.signal })
          clearTimeout(tid)
          if (!res.ok) continue
          const data = await res.json()
          const geoCoords = data.routes?.[0]?.geometry?.coordinates
          if (geoCoords?.length > 1) {
            setRoadPaths(prev => ({ ...prev, [dayIndex]: geoCoords.map(([lng, lat]) => ({ lat, lng })) }))
            return
          }
        } catch (e) {
          console.warn(`[Route] Gün ${dayIndex + 1} routing hatası:`, e?.message || e)
        }
      }
    })
  }, [dayPlan])

  // Draw polylines with raw Google Maps API (avoids React Polyline prop-update bugs)
  useEffect(() => {
    if (!map || !isLoaded) return
    polylinesRef.current.forEach(p => p.setMap(null))
    polylinesRef.current = []
    dayPlan.forEach((day, dayIndex) => {
      if (activeDay !== 'all' && activeDay !== String(day.day)) return
      const path = roadPaths[dayIndex] || day.activities
        .filter(a => a.latitude && a.longitude)
        .map(a => ({ lat: parseFloat(a.latitude), lng: parseFloat(a.longitude) }))
      if (path.length < 2) return
      const polyline = new window.google.maps.Polyline({
        path,
        strokeColor: DAY_COLORS[dayIndex % DAY_COLORS.length],
        strokeWeight: 5,
        strokeOpacity: 0.85,
        geodesic: true,
        map,
      })
      polylinesRef.current.push(polyline)
    })
    return () => {
      polylinesRef.current.forEach(p => p.setMap(null))
      polylinesRef.current = []
    }
  }, [map, isLoaded, dayPlan, roadPaths, activeDay])

  const onMapLoad = useCallback(m => setMap(m), [])

  const visibleActivities = activeDay === 'all'
    ? activities
    : dayPlan.find(d => String(d.day) === activeDay)?.activities || []

  const totalCost = activities.reduce((s, a) => s + (a.price || 0), 0)

  const firstWithCoords = activities.find(a => a.latitude && a.longitude)
  const mapCenter = firstWithCoords
    ? { lat: parseFloat(firstWithCoords.latitude), lng: parseFloat(firstWithCoords.longitude) }
    : { lat: 36.8969, lng: 30.7133 }

  const handleSave = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      const title = planTitle || planMeta.title || `Antalya Gezisi ${new Date().toLocaleDateString('tr-TR')}`
      const payload = {
        trip_id: planMeta.id && !isNaN(Number(planMeta.id)) ? Number(planMeta.id) : null,
        title,
        plan_data: JSON.stringify({ days: dayPlan, budget: planMeta.budget, duration: planMeta.duration }),
        total_cost: totalCost,
        duration: planMeta.duration || 1,
        budget: planMeta.budget || 0,
        status: 'active',
      }
      const res = await savePlan(payload)
      // Store returned DB id for future saves
      const meta = JSON.parse(localStorage.getItem('plan_meta') || '{}')
      localStorage.setItem('plan_meta', JSON.stringify({ ...meta, id: String(res.data.id) }))
      navigate('/plans')
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Kaydetme başarısız')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-screen bg-stone-50 flex flex-col overflow-hidden">

      {/* NAVBAR */}
      <nav className="relative flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-gray-100 z-40">
        <div className="max-w-full px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={() => navigate('/')} className="text-xl font-bold text-gray-900">
              Travel<span style={{ color: '#96C8C8' }}>Mind</span>
            </button>
            <span className="text-gray-200 font-light">/</span>
            {editingTitle ? (
              <input
                autoFocus
                value={planTitle}
                onChange={e => setPlanTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false) }}
                className="text-sm font-medium text-gray-700 border-b border-[#96C8C8] outline-none bg-transparent w-48 pb-0.5"
              />
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 group transition-colors max-w-[180px]"
              >
                <span className="truncate">{planTitle || 'Rota'}</span>
                <svg className="w-3 h-3 text-gray-300 group-hover:text-[#96C8C8] flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>

          <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <button onClick={() => navigate('/')} className={navLink('/')} style={location.pathname === '/' ? { color: '#96C8C8' } : {}}>Ana Sayfa</button>
            <button onClick={() => { localStorage.setItem('restore_plan', JSON.stringify({ ...planMeta, days: dayPlan })); navigate('/planner') }} className={navLink('/planner')} style={location.pathname === '/planner' ? { color: '#96C8C8' } : {}}>Planlayıcı</button>
            <button onClick={() => navigate('/plans')} className={navLink('/plans')} style={location.pathname === '/plans' ? { color: '#96C8C8' } : {}}>Planlarım</button>
            <button onClick={() => navigate('/about')} className={navLink('/about')} style={location.pathname === '/about' ? { color: '#96C8C8' } : {}}>Hakkında</button>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm font-semibold bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-full transition-colors flex items-center gap-2"
            >
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? 'Kaydediliyor…' : localStorage.getItem('token') ? 'Planı Kaydet' : 'Kaydet — Giriş Yap'}
            </button>
            <UserMenu navigate={navigate} />
          </div>
        </div>
        {saveError && (
          <div className="bg-red-50 border-b border-red-100 px-6 py-2 text-xs text-red-600">{saveError}</div>
        )}
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* LEFT PANEL */}
        <div className="flex-shrink-0 flex flex-col bg-white overflow-hidden relative h-full" style={{ width: leftWidth }}>
          <AnimatePresence mode="wait">
            {focused ? (
              /* ── DETAIL VIEW ── */
              <motion.div
                key="detail"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute inset-0 flex flex-col bg-white overflow-hidden"
              >
                {/* Back bar */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setFocused(null)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center flex-shrink-0"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-xs text-gray-400 truncate">Gezi Rotam</span>
                  <svg className="w-3 h-3 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-xs text-gray-600 font-medium truncate">{focused.name}</span>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Hero image */}
                  <div className="w-full h-52 bg-gray-100 flex-shrink-0">
                    <img
                      src={getPlaceImage(focused)}
                      alt={focused.name}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&q=80' }}
                    />
                  </div>

                  {/* Content */}
                  <div className="px-5 py-5">
                    {/* Name + badges */}
                    <h2 className="text-base font-bold text-gray-900 leading-snug mb-2">{focused.name}</h2>
                    <div className="flex items-center gap-2 flex-wrap mb-5">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: '#E8F7F6', color: '#4A9898' }}
                      >
                        {focused.price === 0 ? 'Ücretsiz' : `${focused.price} ₺`}
                      </span>
                      {MUZEKART_VENUES.has(focused.name) && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                          Müzekart ile ücretsiz
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {CATEGORY_LABELS[focused.category] || focused.category}
                      </span>
                    </div>

                    {/* Overview */}
                    {focused.description && (
                      <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Genel Bakış</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{focused.description}</p>
                      </div>
                    )}

                    {/* Location */}
                    {focused.latitude && focused.longitude && (
                      <div className="border-t border-gray-100 pt-5">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Konum</h3>
                        <a
                          href={`https://www.google.com/maps?q=${focused.latitude},${focused.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-[#96C8C8]/50 hover:bg-[#E8F7F6]/40 transition-all group"
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: '#E8F7F6' }}
                          >
                            <svg className="w-4 h-4" style={{ color: '#4A9898' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{focused.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Google Maps'te aç</p>
                          </div>
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-[#96C8C8] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ── LIST VIEW ── */
              <motion.div
                key="list"
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute inset-0 flex flex-col bg-white overflow-hidden"
              >
                <div className="px-5 py-5 border-b border-gray-100 flex-shrink-0">
                  <h1 className="text-lg font-bold text-gray-900">Gezi Rotam</h1>
                  <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
                    <span>{activities.length} mekan</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span>{dayPlan.length} gün</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span className="font-semibold text-[#4A9898]">{totalCost} TL</span>
                  </div>
                </div>

                {/* Day tabs */}
                <div className="px-4 py-3 flex gap-2 overflow-x-auto border-b border-gray-100 flex-shrink-0">
                  <button
                    onClick={() => setActiveDay('all')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                      activeDay === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    Tümü
                  </button>
                  {dayPlan.map((day, i) => (
                    <button
                      key={day.day}
                      onClick={() => setActiveDay(String(day.day))}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                        activeDay === String(day.day) ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      style={activeDay === String(day.day) ? { backgroundColor: DAY_COLORS[i % DAY_COLORS.length] } : {}}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: activeDay === String(day.day) ? 'rgba(255,255,255,0.7)' : DAY_COLORS[i % DAY_COLORS.length] }}
                      />
                      Gün {day.day}
                    </button>
                  ))}
                </div>

                {/* Activity list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  <AnimatePresence>
                    {visibleActivities.map((activity, index) => (
                      <div key={activity.id}>
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                          onClick={() => setFocused(activity)}
                          className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border border-gray-100 bg-white hover:border-[#96C8C8]/50 hover:bg-[#E8F7F6]/40 group"
                        >
                          <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                            <img
                              src={getPlaceImage(activity)}
                              alt={activity.name}
                              className="w-full h-full object-cover"
                              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=100&q=80' }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{activity.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{CATEGORY_LABELS[activity.category] || activity.category}</p>
                          </div>
                          <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                            <span className="text-xs font-semibold text-[#4A9898]">
                              {activity.price === 0 ? 'Ücretsiz' : `${activity.price} ₺`}
                            </span>
                            {MUZEKART_VENUES.has(activity.name) && (
                              <span className="text-[10px] italic text-emerald-600 whitespace-nowrap">Müzekart</span>
                            )}
                          </div>
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-[#96C8C8] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.div>
                        {/* Dijkstra seyahat süresi — sonraki aktiviteye geçiş */}
                        {index < visibleActivities.length - 1 && activity.drive_min > 0 && (
                          <div className="flex items-center gap-2 px-4 py-1 my-0.5">
                            <div className="w-px h-4 bg-gray-100 ml-5" />
                            <span className="text-[10px] text-gray-300 flex items-center gap-2">
                              <span>🚗 {activity.drive_min} dk</span>
                              <span>🚶 {activity.walk_min} dk</span>
                              <span className="text-gray-200">·</span>
                              <span>{activity.distance_km?.toFixed(1)} km</span>
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* MAP */}
        <div
          onMouseDown={handleResizeStart}
          className="w-1 flex-shrink-0 bg-gray-100 hover:bg-[#7DBCBC]00 cursor-col-resize transition-colors"
        />
        <div className="flex-1 relative">
          {!mapReady ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center bg-gray-50">
              {isLoaded ? (
                <>
                  <div className="w-12 h-12 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Harita yüklenemedi</p>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
                    Google Maps günlük kotası doldu. Rota listesi solda görünmeye devam eder. Harita yarın yenilenir.
                  </p>
                </>
              ) : (
                <div className="w-8 h-8 border-2 border-[#96C8C8] border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={mapCenter}
              zoom={12}
              options={mapOptions}
              onLoad={onMapLoad}
            >
              {dayPlan.map((day, dayIndex) => {
                if (activeDay !== 'all' && activeDay !== String(day.day)) return null
                return day.activities
                  .filter(a => a.latitude && a.longitude)
                  .map((activity, actIdx) => (
                    <Marker
                      key={activity.id}
                      position={{ lat: parseFloat(activity.latitude), lng: parseFloat(activity.longitude) }}
                      onClick={() => setFocused(activity)}
                      label={{ text: `${actIdx + 1}`, color: 'white', fontWeight: 'bold', fontSize: '11px' }}
                      icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 14,
                        fillColor: DAY_COLORS[dayIndex % DAY_COLORS.length],
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2,
                      }}
                    />
                  ))
              })}

              {focused && focused.latitude && focused.longitude && (
                <InfoWindow
                  position={{ lat: parseFloat(focused.latitude), lng: parseFloat(focused.longitude) }}
                  onCloseClick={() => setFocused(null)}
                >
                  <div className="p-1 min-w-[160px]">
                    <p className="font-semibold text-gray-900 text-sm">{focused.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{CATEGORY_LABELS[focused.category] || focused.category}</p>
                    <p className="text-xs font-semibold text-[#4A9898] mt-1">
                      {focused.price === 0 ? 'Ücretsiz' : `${focused.price} ₺`}
                    </p>
                    {MUZEKART_VENUES.has(focused.name) && (
                      <p className="text-[10px] italic text-emerald-600 mt-0.5">Müzekart: ücretsiz</p>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}

          {/* Day legend overlay */}
          {dayPlan.length > 1 && (
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-3 space-y-2">
              {dayPlan.map((day, i) => (
                <button
                  key={day.day}
                  onClick={() => setActiveDay(activeDay === String(day.day) ? 'all' : String(day.day))}
                  className="flex items-center gap-2 w-full text-left hover:opacity-70 transition-opacity"
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: DAY_COLORS[i % DAY_COLORS.length] }} />
                  <span className="text-xs font-medium text-gray-700">Gün {day.day}</span>
                  <span className="text-xs text-gray-400 ml-auto">{day.activities.length} durak</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
