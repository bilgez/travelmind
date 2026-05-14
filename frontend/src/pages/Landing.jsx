import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getAllActivities } from '../api/index'

const CATEGORIES = [
  { key: 'all', label: 'Tümü' },
  { key: 'tarihi_yer', label: 'Tarihi Yerler' },
  { key: 'plaj', label: 'Plajlar' },
  { key: 'restoran', label: 'Restoranlar' },
  { key: 'doga', label: 'Doga' },
  { key: 'gece_hayati', label: 'Gece Hayati' },
]

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating}</span>
    </div>
  )
}

function ActivityCard({ activity, onClick }) {
  const [saved, setSaved] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onClick(activity)}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={activity.image_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'}
          alt={activity.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
            {activity.category === 'tarihi_yer' ? 'Tarihi Yer' :
             activity.category === 'plaj' ? 'Plaj' :
             activity.category === 'restoran' ? 'Restoran' :
             activity.category === 'doga' ? 'Doga' :
             activity.category === 'gece_hayati' ? 'Gece Hayati' : activity.category}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setSaved(!saved) }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
        >
          <svg className={`w-4 h-4 ${saved ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>
        {activity.price === 0 && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-green-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">Ucretsiz</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-1.5 line-clamp-1">{activity.name}</h3>
        <StarRating rating={activity.rating} />
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{activity.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm font-semibold text-sky-600">
            {activity.price === 0 ? 'Ucretsiz' : `${activity.price} TL`}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onClick(activity) }}
            className="text-xs bg-sky-50 hover:bg-sky-100 text-sky-600 font-medium px-3 py-1.5 rounded-full transition-colors"
          >
            Detay
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function ActivityModal({ activity, onClose, onAddToRoute }) {
  if (!activity) return null
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="relative h-64">
            <img
              src={activity.image_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'}
              alt={activity.name}
              className="w-full h-full object-cover"
            />
            <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{activity.name}</h2>
                <span className="text-xs text-sky-500 font-medium mt-1 block">{activity.category}</span>
              </div>
              <span className="text-xl font-bold text-sky-600">
                {activity.price === 0 ? 'Ucretsiz' : `${activity.price} TL`}
              </span>
            </div>
            <StarRating rating={activity.rating} />
            <p className="text-gray-600 text-sm mt-3 leading-relaxed">{activity.description}</p>
            <button
              onClick={() => { onAddToRoute(activity); onClose() }}
              className="w-full mt-5 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Rotama Ekle
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [filtered, setFiltered] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [routeList, setRouteList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllActivities().then(res => {
      setActivities(res.data.activities)
      setFiltered(res.data.activities)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (activeCategory === 'all') {
      setFiltered(activities)
    } else {
      setFiltered(activities.filter(a => a.category === activeCategory))
    }
  }, [activeCategory, activities])

  const addToRoute = (activity) => {
    if (!routeList.find(a => a.id === activity.id)) {
      const newList = [...routeList, activity]
      setRouteList(newList)
      localStorage.setItem('selected_activities', JSON.stringify(newList))
    }
  }

  const tarihi = filtered.filter(a => a.category === 'tarihi_yer')
  const plajlar = filtered.filter(a => a.category === 'plaj')
  const restoranlar = filtered.filter(a => a.category === 'restoran')
  const doga = filtered.filter(a => a.category === 'doga')
  const gece = filtered.filter(a => a.category === 'gece_hayati')

  const sections = [
    { title: 'Tarihi Yerler', items: tarihi },
    { title: 'Plajlar', items: plajlar },
    { title: 'Restoranlar', items: restoranlar },
    { title: 'Doga & Aktivite', items: doga },
    { title: 'Gece Hayati', items: gece },
  ].filter(s => s.items.length > 0)

  return (
    <div className="min-h-screen bg-stone-50">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">
              Travel<span className="text-sky-500">Mind</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <span className="hover:text-sky-500 cursor-pointer transition-colors">Kesfet</span>
            <span className="hover:text-sky-500 cursor-pointer transition-colors">Planlarim</span>
            <span className="hover:text-sky-500 cursor-pointer transition-colors">Hakkinda</span>
          </div>
          <div className="flex items-center gap-3">
            {routeList.length > 0 && (
              <button
                onClick={() => navigate('/route')}
                className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                </svg>
                Rotam ({routeList.length})
              </button>
            )}
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-gray-700 hover:text-sky-500 transition-colors"
            >
              Giris Yap
            </button>
            <button
              onClick={() => navigate('/planner')}
              className="text-sm font-medium bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-full transition-colors"
            >
              Plan Olustur
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative h-screen max-h-[680px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80"
          alt="Antalya"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center"
          >
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 1.2 }}
              className="text-6xl md:text-8xl font-bold mb-4 leading-none tracking-tight"
            >
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                Antalya
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.8 }}
                className="block italic text-sky-300"
              >
                kesfediyoruz
              </motion.span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              className="text-lg text-white/80 max-w-md mx-auto mb-8 font-light"
            >
              Tarihi yerler, plajlar ve lezzetler — AI ile kisisel rotanizi olusturun
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.6 }}
              className="flex gap-3 justify-center"
            >
              <button
                onClick={() => navigate('/planner')}
                className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-8 py-3.5 rounded-full transition-colors shadow-lg"
              >
                Gezini Planla
              </button>
              <button
                onClick={() => document.getElementById('discover').scrollIntoView({ behavior: 'smooth' })}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold px-8 py-3.5 rounded-full transition-colors border border-white/30"
              >
                Mekanlari Gör
              </button>
            </motion.div>
          </motion.div>
        </div>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
          </svg>
        </motion.div>
      </div>

      {/* STATS */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-3 gap-6 text-center">
          {[
            { num: '120+', label: 'Kesfedilecek Mekan' },
            { num: '4.8', label: 'Ortalama Puan' },
            { num: 'AI', label: 'Destekli Rota' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-2xl font-bold text-gray-900">{s.num}</div>
              <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* DISCOVER */}
      <div id="discover" className="max-w-7xl mx-auto px-6 py-12">

        {/* Kategori filtreleri */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-10 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Yukluyor...</div>
        ) : activeCategory === 'all' ? (
          <div className="space-y-14">
            {sections.map(section => (
              <div key={section.title}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {section.title}
                  </h2>
                  <button className="text-sm text-sky-500 hover:text-sky-600 font-medium">
                    Tümünü gör
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {section.items.map(activity => (
                    <ActivityCard key={activity.id} activity={activity} onClick={setSelectedActivity} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map(activity => (
              <ActivityCard key={activity.id} activity={activity} onClick={setSelectedActivity} />
            ))}
          </div>
        )}
      </div>

      {/* AI BANNER */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-3">
              AI ile rota olustur
            </h2>
            <p className="text-gray-400 max-w-md leading-relaxed">
              Ne görmek istedigini yaz, butceni belirt. TravelMind sana en iyi rotayi saniyeler icinde hazirlasin.
            </p>
          </div>
          <button
            onClick={() => navigate('/planner')}
            className="flex-shrink-0 bg-sky-500 hover:bg-sky-600 text-white font-semibold px-8 py-4 rounded-full transition-colors text-lg"
          >
            Hemen Baslayalim
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-400">
          © 2026 TravelMind · Türk Hava Kurumu Üniversitesi Bitirme Projesi
        </div>
      </footer>

      {/* MODAL */}
      {selectedActivity && (
        <ActivityModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onAddToRoute={addToRoute}
        />
      )}

    </div>
  )
}