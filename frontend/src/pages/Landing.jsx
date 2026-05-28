import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { getAllActivities } from '../api/index'

const CATEGORIES = [
  { key: 'all', label: 'Tümü' },
  { key: 'tarihi_yer', label: 'Tarihi' },
  { key: 'plaj', label: 'Plaj' },
  { key: 'doga', label: 'Doğa' },
  { key: 'restoran', label: 'Restoran' },
  { key: 'gece_hayati', label: 'Gece Hayatı' },
  { key: 'alisveris', label: 'Alışveriş' },
  { key: 'eglence', label: 'Eğlence' },
]

const QUICK_PROMPTS = [
  '3 günlük tarihi tur',
  'Plaj ve deniz',
  'Romantik kaçamak',
  'Doğa yürüyüşü',
]

const CATEGORY_SHOWCASE = [
  { key: 'tarihi_yer', label: 'Tarihi Yerler', count: '19', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Side_Ancient_City.jpg/960px-Side_Ancient_City.jpg', big: true },
  { key: 'plaj', label: 'Plajlar', count: '8', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Kaputas_Beach.JPG/960px-Kaputas_Beach.JPG', big: false },
  { key: 'doga', label: 'Doğa & Aktivite', count: '16', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80', big: false },
  { key: 'restoran', label: 'Restoranlar', count: '5', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80', big: false },
  { key: 'alisveris', label: 'Alışveriş', count: '8', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80', big: false },
]

const CATEGORY_FALLBACK = {
  tarihi_yer: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Side_Ancient_City.jpg/960px-Side_Ancient_City.jpg',
  plaj: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Kaputas_Beach.JPG/960px-Kaputas_Beach.JPG',
  doga: 'https://images.unsplash.com/photo-1546180245-c59350c0dc6d?w=600&q=80',
  restoran: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
  gece_hayati: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&q=80',
  alisveris: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
  eglence: 'https://images.unsplash.com/photo-1575783970733-1aaedde1db74?w=600&q=80',
}

const CATEGORY_LABELS = {
  tarihi_yer: 'Tarihi Yer', plaj: 'Plaj', doga: 'Doğa',
  restoran: 'Restoran', gece_hayati: 'Gece Hayatı',
  alisveris: 'Alışveriş', eglence: 'Eğlence & Spa',
}

function getPlaceImage(a) {
  if (a.image_url) return a.image_url
  return CATEGORY_FALLBACK[a.category] || 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&q=80'
}

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-400 ml-1">{rating}</span>
    </div>
  )
}

function ActivityCard({ activity, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(activity)}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <img src={getPlaceImage(activity)} alt={activity.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&q=80' }}
        />
        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
          {CATEGORY_LABELS[activity.category] || activity.category}
        </span>
        {activity.price === 0 && (
          <span className="absolute bottom-3 left-3 bg-emerald-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">Ücretsiz</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-2 truncate">{activity.name}</h3>
        <StarRating rating={activity.rating} />
        {activity.description && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">{activity.description}</p>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <span className="text-sm font-bold text-sky-600">
            {activity.price === 0 ? 'Ücretsiz' : `${activity.price} TL`}
          </span>
          <span className="text-xs text-gray-400">Detaylar →</span>
        </div>
      </div>
    </motion.div>
  )
}

function ActivityModal({ activity, onClose, onAddToRoute }) {
  if (!activity) return null
  const imgSrc = getPlaceImage(activity)
  const lat = activity.latitude || activity.lat
  const lng = activity.longitude || activity.lng
  const mapSrc = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
        onClick={onClose}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}>
          <div className="relative h-56">
            <img src={imgSrc} alt={activity.name} className="w-full h-full object-cover"
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&q=80' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="absolute bottom-4 left-4">
              <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {CATEGORY_LABELS[activity.category] || activity.category}
              </span>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900 flex-1 mr-4">{activity.name}</h2>
              <span className="flex-shrink-0 font-bold text-lg">
                {activity.price === 0 ? <span className="text-emerald-600">Ücretsiz</span> : <span className="text-sky-600">{activity.price} TL</span>}
              </span>
            </div>
            <StarRating rating={activity.rating} />
            {activity.description && <p className="text-gray-600 text-sm mt-3 leading-relaxed">{activity.description}</p>}
            {lat && lng && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-800">Konum</h3>
                  <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-sky-500 hover:text-sky-600 font-medium flex items-center gap-1 transition-colors">
                    Google Maps'te Aç
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                <div className="rounded-2xl overflow-hidden border border-gray-100 h-44">
                  <iframe title={`${activity.name} haritası`} src={mapSrc} width="100%" height="100%"
                    style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
              </div>
            )}
            <button onClick={() => { onAddToRoute(activity); onClose() }}
              className="w-full mt-4 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Rotama Ekle
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─────────────── FEATURE MOCKUPS ─────────────── */

function ChatMockup() {
  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 max-w-sm w-full">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-50">
        <div className="w-9 h-9 rounded-2xl bg-sky-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">TravelMind AI</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            <span className="text-xs text-gray-400">Aktif</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-3">
        <div className="bg-gray-900 text-white text-xs px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[85%] leading-relaxed">
          3 günlük tarihi tur, 1500 TL bütçe, çift kişi
        </div>
      </div>

      <div className="flex gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-xl bg-sky-500 flex-shrink-0 flex items-center justify-center mt-0.5">
          <span className="text-white text-[9px] font-bold">AI</span>
        </div>
        <div className="bg-sky-50 text-gray-700 text-xs px-4 py-3 rounded-2xl rounded-bl-sm flex-1 leading-relaxed">
          Harika! Antalya için 3 günlük tarihi rota hazırladım.
        </div>
      </div>

      <div className="space-y-2">
        {[
          { name: 'Kaleiçi Eski Şehir', price: 'Ücretsiz' },
          { name: 'Hadrian Kapısı', price: 'Ücretsiz' },
          { name: 'Perge Antik Kenti', price: '590 ₺' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
            <div className="w-5 h-5 rounded-lg bg-sky-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[9px] font-bold">{i + 1}</span>
            </div>
            <span className="text-xs font-medium text-gray-700 flex-1">{item.name}</span>
            <span className="text-[10px] text-gray-400">{item.price}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlanMockup() {
  const stops = [
    { time: '09:00', name: 'Kaleiçi Eski Şehir', price: 'Ücretsiz', dot: 'bg-sky-400' },
    { time: '11:30', name: 'Hadrian Kapısı', price: 'Ücretsiz', dot: 'bg-violet-400' },
    { time: '14:00', name: 'Perge Antik Kenti', price: '590 ₺', dot: 'bg-emerald-400' },
    { time: '17:30', name: 'Aspendos Tiyatrosu', price: '800 ₺', dot: 'bg-orange-400' },
  ]
  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 max-w-sm w-full">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-50">
        <div>
          <p className="text-sm font-bold text-gray-900">Gün 1 — Tarihi Keşif</p>
          <p className="text-xs text-gray-400 mt-0.5">4 mekan · ~8 saat</p>
        </div>
        <span className="text-xs bg-sky-50 text-sky-600 font-semibold px-2.5 py-1 rounded-full">Optimize</span>
      </div>

      <div className="space-y-4">
        {stops.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-10 flex-shrink-0 font-mono">{s.time}</span>
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.dot}`} />
            <span className="text-sm text-gray-800 flex-1 font-medium truncate">{s.name}</span>
            <span className="text-xs text-gray-500 flex-shrink-0">{s.price}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-400">Tahmini toplam</span>
        <span className="text-sm font-bold text-sky-600">1.390 ₺</span>
      </div>
    </div>
  )
}

function MapMockup() {
  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-w-sm w-full">
      <div className="relative bg-sky-50 h-52 overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(56,189,248,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.08) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }} />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 208" fill="none">
          <path d="M 55,55 C 90,40 160,70 200,95 S 250,145 270,165" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="7,4" opacity="0.7" />
          <circle cx="55" cy="55" r="10" fill="#38bdf8" />
          <circle cx="55" cy="55" r="16" fill="#38bdf8" fillOpacity="0.15" />
          <circle cx="200" cy="95" r="10" fill="#a78bfa" />
          <circle cx="200" cy="95" r="16" fill="#a78bfa" fillOpacity="0.15" />
          <circle cx="270" cy="165" r="10" fill="#34d399" />
          <circle cx="270" cy="165" r="16" fill="#34d399" fillOpacity="0.15" />
        </svg>
        <div className="absolute top-9 left-3 bg-white rounded-xl shadow-md px-2.5 py-1.5 text-xs font-semibold text-gray-800">Kaleiçi</div>
        <div className="absolute top-16 left-[52%] bg-white rounded-xl shadow-md px-2.5 py-1.5 text-xs font-semibold text-gray-800">Perge</div>
        <div className="absolute bottom-6 right-4 bg-white rounded-xl shadow-md px-2.5 py-1.5 text-xs font-semibold text-gray-800">Aspendos</div>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-sm font-bold text-gray-900">Optimize Rota</p>
          <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-2.5 py-1 rounded-full">3 Durak</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>~23 km toplam</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <span>~6 saat</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <span>1.390 TL tahmini</span>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── MAIN COMPONENT ─────────────── */

export default function Landing() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [activities, setActivities] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [routeList, setRouteList] = useState([])
  const [loading, setLoading] = useState(true)
  const [heroPrompt, setHeroPrompt] = useState('')

  const featRef = useRef(null)
  const catRef = useRef(null)
  const discoverRef = useRef(null)

  const featInView = useInView(featRef, { once: true, margin: '-80px' })
  const catInView = useInView(catRef, { once: true, margin: '-80px' })

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    getAllActivities().then(res => {
      setActivities(res.data.activities || res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = activeCategory === 'all' ? activities : activities.filter(a => a.category === activeCategory)

  const addToRoute = (activity) => {
    if (!routeList.find(a => a.id === activity.id)) {
      const updated = [...routeList, activity]
      setRouteList(updated)
      localStorage.setItem('selected_activities', JSON.stringify(updated))
    }
  }

  const handleHeroSearch = (e) => {
    e.preventDefault()
    if (heroPrompt.trim()) localStorage.setItem('pending_prompt', heroPrompt.trim())
    navigate('/planner')
  }

  const scrollToDiscover = () => discoverRef.current?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="min-h-screen bg-white">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/97 backdrop-blur-md border-b border-gray-100 shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`text-xl font-bold transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}
          >
            Travel<span className="text-sky-400">Mind</span>
          </button>
          <div className={`hidden md:flex items-center gap-8 text-sm transition-colors ${scrolled ? 'text-gray-500' : 'text-white/80'}`}>
            <button onClick={scrollToDiscover} className="hover:opacity-100 transition-opacity">Mekanlar</button>
            <button onClick={() => navigate('/plans')} className="hover:opacity-100 transition-opacity">Planlarım</button>
            <button onClick={() => navigate('/about')} className="hover:opacity-100 transition-opacity">Hakkında</button>
          </div>
          <div className="flex items-center gap-3">
            {routeList.length > 0 && (
              <button
                onClick={() => navigate('/route')}
                className="flex items-center gap-1.5 bg-sky-500 text-white text-sm font-medium px-3.5 py-2 rounded-full hover:bg-sky-600 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Listem ({routeList.length})
              </button>
            )}
            <button
              onClick={() => navigate('/login')}
              className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white'}`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => navigate('/planner')}
              className="text-sm font-semibold bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-full transition-colors"
            >
              Plan Oluştur
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative h-screen min-h-[700px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/pexels-esat-kucuksahin-2405819-37086609.jpg"
            alt="Antalya"
            className="w-full h-full object-cover scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 w-full">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-sky-300 text-xs font-semibold uppercase tracking-[0.25em] mb-5"
          >
            Yapay Zeka Destekli Seyahat Planlayıcı
          </motion.p>

          <div className="mb-2">
            <motion.h1
              initial={{ clipPath: 'inset(0 100% 0 0)' }}
              animate={{ clipPath: 'inset(0 0% 0 0)' }}
              transition={{ delay: 0.2, duration: 5.0, ease: 'linear' }}
              className="text-[100px] md:text-[128px] lg:text-[158px] text-white"
              style={{ fontFamily: "'Pinyon Script', cursive", lineHeight: 1.5 }}
            >
              Antalya
            </motion.h1>
          </div>


          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            onSubmit={handleHeroSearch}
            className="flex items-center bg-white rounded-2xl overflow-hidden shadow-2xl max-w-2xl mb-5"
          >
            <div className="w-12 flex items-center justify-center flex-shrink-0 text-gray-400 pl-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={heroPrompt}
              onChange={e => setHeroPrompt(e.target.value)}
              placeholder="Örn: 3 günlük tarihi tur, 2000 TL bütçe, çift kişi..."
              className="flex-1 py-4 text-gray-700 text-sm outline-none bg-transparent placeholder-gray-400"
            />
            <button
              type="submit"
              className="flex-shrink-0 bg-sky-500 hover:bg-sky-600 text-white font-semibold px-7 py-4 transition-colors text-sm"
            >
              Planla
            </button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <span className="text-white/40 text-xs">Popüler:</span>
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => { localStorage.setItem('pending_prompt', p); navigate('/planner') }}
                className="text-xs text-white/70 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 px-3 py-1.5 rounded-full transition-colors"
              >
                {p}
              </button>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/30 cursor-pointer"
          onClick={scrollToDiscover}
        >
          <span className="text-[10px] uppercase tracking-widest">Keşfet</span>
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURE HIGHLIGHTS ── */}
      <section ref={featRef} className="overflow-hidden">

        {/* Feature 1: Chat */}
        <div className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={featInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                <span className="text-xs font-bold text-sky-500 uppercase tracking-widest mb-4 block">01</span>
                <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-5">
                  Türkçe yaz,<br />
                  <span className="text-gray-400 font-light">plan hazır olsun.</span>
                </h2>
                <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
                  "3 günlük tarihi tur, 1500 TL bütçe" yaz — hepsi bu kadar. NLP motorumuz
                  isteğini analiz eder, 80'den fazla Antalya mekanı arasından sana özel
                  bir program oluşturur.
                </p>
                <button
                  onClick={() => navigate('/planner')}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-sky-500 hover:text-sky-600 transition-colors"
                >
                  Planlamaya başla
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={featInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
                className="flex justify-center lg:justify-end"
              >
                <ChatMockup />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Feature 2: Plan */}
        <div className="py-24 bg-stone-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={featInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
                className="flex justify-center lg:justify-start order-2 lg:order-1"
              >
                <PlanMockup />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={featInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
                className="order-1 lg:order-2"
              >
                <span className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-4 block">02</span>
                <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-5">
                  Sana özel günlük<br />
                  <span className="text-gray-400 font-light">program, otomatik.</span>
                </h2>
                <p className="text-gray-500 text-base leading-relaxed max-w-md">
                  Bütçe, grup büyüklüğü ve ilgi alanlarına göre akıllıca planlanmış
                  günlük program. Zaman çakışması yok, coğrafi güzergah optimize
                  edilmiş — sadece gez.
                </p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Feature 3: Map */}
        <div className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={featInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
              >
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4 block">03</span>
                <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-5">
                  Her mekan,<br />
                  <span className="text-gray-400 font-light">haritada sıralanmış.</span>
                </h2>
                <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
                  Google Maps entegrasyonuyla rotanı harita üzerinde gör. Her mekan
                  pinleniyor, duraklar optimize ediliyor. Şehri tanımadan bile en
                  verimli şekilde gezebilirsin.
                </p>
                <button
                  onClick={() => navigate('/planner')}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-500 hover:text-emerald-600 transition-colors"
                >
                  Rotanı oluştur
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={featInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.45, ease: 'easeOut' }}
                className="flex justify-center lg:justify-end"
              >
                <MapMockup />
              </motion.div>
            </div>
          </div>
        </div>

      </section>

      {/* ── EXAMPLE TRIP CARDS ── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sky-500 text-xs font-semibold uppercase tracking-widest mb-2">Hazır Turlar</p>
              <h2 className="text-3xl font-bold text-gray-900">Popüler tur paketleri</h2>
            </div>
            <button onClick={() => navigate('/planner')}
              className="hidden md:flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
              Hepsini gör
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: 'Tarihi Antalya',
                desc: 'Kaleiçi, Hadrian Kapısı, Perge ve Aspendos — Türkiye\'nin en zengin antik şehri.',
                days: 3,
                places: 12,
                budget: '~3.000 TL',
                image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Hadrian%27s_Gate%2C_Antalya_01.jpg/960px-Hadrian%27s_Gate%2C_Antalya_01.jpg',
                tag: 'Tarihi',
                tagColor: 'bg-amber-50 text-amber-600',
                prompt: '3 günlük tarihi tur, 1500 TL bütçe',
              },
              {
                title: 'Plaj & Deniz',
                desc: 'Konyaaltı, Lara, Kaputaş — Akdeniz\'in en mavi koyları ve en güzel plajları.',
                days: 2,
                places: 8,
                budget: '~1.500 TL',
                image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Kaputas_Beach.JPG/960px-Kaputas_Beach.JPG',
                tag: 'Plaj',
                tagColor: 'bg-sky-50 text-sky-600',
                prompt: '2 günlük plaj ve deniz turu, 1000 TL',
              },
              {
                title: 'Doğa Macerası',
                desc: 'Düden Şelalesi, Köprülü Kanyon, Güver Uçurumu — adrenalin ve huzurun buluştuğu yer.',
                days: 2,
                places: 10,
                budget: '~2.500 TL',
                image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
                tag: 'Doğa',
                tagColor: 'bg-emerald-50 text-emerald-600',
                prompt: '2 günlük doğa yürüyüşü turu',
              },
            ].map((trip, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => { localStorage.setItem('pending_prompt', trip.prompt); navigate('/planner') }}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={trip.image} alt={trip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${trip.tagColor}`}>{trip.tag}</span>
                  <div className="absolute bottom-3 left-4">
                    <h3 className="text-white font-bold text-base">{trip.title}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">{trip.desc}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {trip.days} gün
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {trip.places} mekan
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      ~{trip.budget}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-50">
                    <span className="text-xs font-semibold text-sky-500 group-hover:text-sky-600 transition-colors flex items-center gap-1">
                      Turu AI ile kişiselleştir
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY SHOWCASE ── */}
      <section ref={catRef} className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={catInView ? { opacity: 1 } : {}}
                className="text-sky-500 text-xs font-semibold uppercase tracking-widest mb-2"
              >
                Kategoriler
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 14 }}
                animate={catInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 }}
                className="text-3xl font-bold text-gray-900"
              >
                Antalya'yı tüm yönleriyle keşfet
              </motion.h2>
            </div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={catInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2 }}
              onClick={scrollToDiscover}
              className="hidden md:flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              Tümünü gör
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {CATEGORY_SHOWCASE.map((cat, i) => (
              <motion.button
                key={cat.key}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={catInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.08 * i }}
                onClick={() => { setActiveCategory(cat.key); scrollToDiscover() }}
                className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'md:row-span-2' : ''}`}
                style={{ height: i === 0 ? undefined : 160, minHeight: i === 0 ? 340 : 160 }}
              >
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 text-left">
                  <p className="font-bold text-white text-base md:text-lg leading-tight">{cat.label}</p>
                  <p className="text-white/60 text-xs mt-0.5">{cat.count} mekan</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACTIVITY DISCOVERY ── */}
      <section ref={discoverRef} id="discover" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sky-500 text-xs font-semibold uppercase tracking-widest mb-2">Mekanlar</p>
              <h2 className="text-3xl font-bold text-gray-900">Popüler mekanları keşfet</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-10">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.key
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {Array(8).fill(0).map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {(activeCategory === 'all' ? activities.slice(0, 8) : filtered).map((activity, i) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ActivityCard activity={activity} onClick={setSelectedActivity} />
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-14">
            <button
              onClick={() => navigate('/planner')}
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-semibold px-8 py-3.5 rounded-full transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              Planlamaya Başla
            </button>
          </div>
        </div>
      </section>


      {/* ── CTA BANNER ── */}
      <section className="bg-gray-950 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sky-400 text-xs font-semibold uppercase tracking-widest mb-5">Hazır mısın?</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            <span className="italic font-light">Antalya</span> gezini<br />şimdi planla.
          </h2>
          <p className="text-gray-400 text-base mb-10 max-w-md mx-auto">
            Ücretsiz. Türkçe yaz, rotanı birkaç saniyede al.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/planner')}
              className="bg-sky-500 hover:bg-sky-400 text-white font-bold px-8 py-4 rounded-2xl transition-colors text-sm shadow-lg shadow-sky-500/20"
            >
              Planlamaya Başla
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-white/8 hover:bg-white/12 border border-white/10 text-white font-semibold px-8 py-4 rounded-2xl transition-colors text-sm"
            >
              Hesap Oluştur
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 border-t border-white/5 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            <div>
              <p className="text-xl font-bold mb-3">Travel<span className="text-sky-400">Mind</span></p>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                Antalya için Türkçe yapay zeka destekli seyahat planlama platformu.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Sayfalar</p>
              <ul className="space-y-2.5">
                {[
                  { label: 'AI Planlayıcı', fn: () => navigate('/planner') },
                  { label: 'Planlarım', fn: () => navigate('/plans') },
                  { label: 'Hakkında', fn: () => navigate('/about') },
                  { label: 'Giriş Yap', fn: () => navigate('/login') },
                ].map((l, i) => (
                  <li key={i}>
                    <button onClick={l.fn} className="text-sm text-gray-500 hover:text-white transition-colors">{l.label}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Kategoriler</p>
              <ul className="space-y-2.5">
                {['Tarihi Yerler', 'Plajlar', 'Doğa & Aktivite', 'Restoranlar', 'Gece Hayatı'].map((cat, i) => (
                  <li key={i}>
                    <button onClick={scrollToDiscover} className="text-sm text-gray-500 hover:text-white transition-colors">{cat}</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6">
            <p className="text-sm text-gray-600">© 2026 TravelMind · THK Üniversitesi Yazılım Mühendisliği</p>
          </div>
        </div>
      </footer>

      {selectedActivity && (
        <ActivityModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} onAddToRoute={addToRoute} />
      )}
    </div>
  )
}
