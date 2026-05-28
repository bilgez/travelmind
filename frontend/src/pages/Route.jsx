import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const DAY_COLORS = ['#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#fbbf24']

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

export default function RoutePage() {
  const navigate = useNavigate()
  const [activities] = useState(() => initStorage().activities)
  const [dayPlan] = useState(() => initStorage().dayPlan)
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

  const handleSave = () => {
    const existing = JSON.parse(localStorage.getItem('saved_plans') || '[]')
    const plan = {
      id: Date.now(),
      title: `Antalya Gezisi ${new Date().toLocaleDateString('tr-TR')}`,
      date: new Date().toLocaleDateString('tr-TR'),
      activities,
      totalCost,
    }
    localStorage.setItem('saved_plans', JSON.stringify([...existing, plan]))
    navigate('/plans')
  }

  return (
    <div className="h-screen bg-stone-50 flex flex-col overflow-hidden">

      {/* NAVBAR */}
      <nav className="flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-gray-100 z-40">
        <div className="max-w-full px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-xl font-bold text-gray-900">
            Travel<span className="text-sky-500">Mind</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/planner')}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Planlayıcı
            </button>
            <button
              onClick={handleSave}
              className="text-sm font-semibold bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-full transition-colors"
            >
              Planı Kaydet
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* LEFT PANEL */}
        <div className="flex-shrink-0 flex flex-col bg-white overflow-hidden" style={{ width: leftWidth }}>

          <div className="px-5 py-5 border-b border-gray-100 flex-shrink-0">
            <h1 className="text-lg font-bold text-gray-900">Gezi Rotam</h1>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
              <span>{activities.length} mekan</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>{dayPlan.length} gün</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span className="font-semibold text-sky-600">{totalCost} TL</span>
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
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => setFocused(activity)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                    focused?.id === activity.id
                      ? 'border-sky-300 bg-sky-50'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
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
                    <span className="text-xs font-semibold text-sky-600">
                      {activity.price === 0 ? 'Ücretsiz' : `${activity.price} ₺`}
                    </span>
                    {MUZEKART_VENUES.has(activity.name) && (
                      <span className="text-[10px] italic text-emerald-600 whitespace-nowrap">Müzekart: ücretsiz</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* MAP */}
        <div
          onMouseDown={handleResizeStart}
          className="w-1 flex-shrink-0 bg-gray-100 hover:bg-sky-400 cursor-col-resize transition-colors"
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
                <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
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
                    <p className="text-xs font-semibold text-sky-600 mt-1">
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
