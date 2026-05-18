import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { optimizeRoute, getBudget } from '../api/index'

function StatCard({ value, label, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center"
    >
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wide">{label}</p>
    </motion.div>
  )
}

function ActivityRow({ activity, index, isOptimized }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
        isOptimized ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-600'
      }`}>
        {index + 1}
      </div>

      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
        <img
          src={activity.image_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80'}
          alt={activity.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{activity.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-amber-400 text-xs">{'★'.repeat(Math.round(activity.rating))}</span>
          <span className="text-xs text-gray-400">{activity.rating}</span>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-sky-600">
          {activity.price === 0 ? 'Ucretsiz' : `${activity.price} TL`}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 capitalize">
          {activity.category === 'tarihi_yer' ? 'Tarihi Yer' :
           activity.category === 'plaj' ? 'Plaj' :
           activity.category === 'restoran' ? 'Restoran' :
           activity.category === 'doga' ? 'Doga' :
           activity.category === 'gece_hayati' ? 'Gece' : activity.category}
        </p>
      </div>

      {index < 10 && isOptimized && (
        <div className="absolute" />
      )}
    </motion.div>
  )
}

export default function RoutePage() {
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [route, setRoute] = useState(null)
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('rota')

  useEffect(() => {
    const saved = localStorage.getItem('selected_activities')
    if (saved) setActivities(JSON.parse(saved))
  }, [])

  const handleOptimize = async () => {
    setLoading(true)
    try {
      const activityIds = activities.map(a => a.id)
      const res = await optimizeRoute({ trip_id: 1, activity_ids: activityIds })
      setRoute(res.data)
      const budgetRes = await getBudget(1)
      setBudget(budgetRes.data)
      setActiveTab('optimize')
    } catch {
      alert('Rota olusturulurken hata olustu')
    }
    setLoading(false)
  }

  const optimizedActivities = route
    ? route.optimized_order.map(id => activities.find(a => a.id === id)).filter(Boolean)
    : []

  return (
    <div className="min-h-screen bg-gray-50">

      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-100 px-6 h-16 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => navigate('/')} className="text-xl font-bold text-gray-900">
          Travel<span className="text-sky-500">Mind</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/planner')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-sky-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Planlayiciya Don
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Gezi Rotam
          </h1>
          <p className="text-gray-500 text-sm">
            {activities.length} mekan secildi — AI ile en verimli rotayi hesapla
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* SOL PANEL */}
          <div className="lg:col-span-1 space-y-4">

            {/* Secilen mekanlar */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Secilen Mekanlar</h2>
                  <span className="w-6 h-6 bg-sky-50 text-sky-600 rounded-full text-xs font-semibold flex items-center justify-center">
                    {activities.length}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {activities.map((activity, index) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    index={index}
                    isOptimized={false}
                  />
                ))}
              </div>
              <div className="px-4 pb-4">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOptimize}
                  disabled={loading || activities.length === 0}
                  className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-gray-200 text-white font-semibold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Hesaplaniyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                      </svg>
                      Rotami Optimize Et
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Butce - optimize sonrasi */}
            {budget && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-gray-50">
                  <h2 className="font-semibold text-gray-900">Butce Ozeti</h2>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { label: 'Aktivite Maliyeti', value: budget.activity_cost_sum },
                    { label: 'Ulasim Maliyeti', value: budget.transport_cost },
                    { label: 'Yedek Pay (%10)', value: budget.contingency },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className="text-sm font-medium text-gray-800">{item.value} TL</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold text-gray-900">Toplam</span>
                    <span className="text-xl font-bold text-sky-600">{budget.total_estimate} TL</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* SAG PANEL */}
          <div className="lg:col-span-2 space-y-4">

            {/* Harita alani */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Harita</h2>
                <span className="text-xs bg-amber-50 text-amber-600 px-3 py-1 rounded-full font-medium">
                  Google Maps yakinda eklenecek
                </span>
              </div>

              {/* Harita placeholder - koordinatlar hazir */}
              <div className="relative h-80 bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center">

                {/* Sahte harita grid */}
                <div className="absolute inset-0 opacity-20">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="absolute border-sky-300 border-dashed"
                      style={{
                        left: `${(i + 1) * 12}%`,
                        top: 0, bottom: 0,
                        borderLeftWidth: '1px'
                      }}
                    />
                  ))}
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="absolute border-sky-300 border-dashed"
                      style={{
                        top: `${(i + 1) * 16}%`,
                        left: 0, right: 0,
                        borderTopWidth: '1px'
                      }}
                    />
                  ))}
                </div>

                {/* Aktivite pinleri */}
                {activities.slice(0, 6).map((activity, i) => (
                  <motion.div
                    key={activity.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="absolute"
                    style={{
                      left: `${15 + (i % 3) * 28}%`,
                      top: `${20 + Math.floor(i / 3) * 45}%`,
                    }}
                  >
                    <div className="relative group cursor-pointer">
                      <div className="w-8 h-8 bg-sky-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
                        {i + 1}
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {activity.name}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Rota cizgisi */}
                {route && activities.length > 1 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                    {activities.slice(0, -1).map((_, i) => {
                      const x1 = 15 + (i % 3) * 28
                      const y1 = 20 + Math.floor(i / 3) * 45
                      const x2 = 15 + ((i + 1) % 3) * 28
                      const y2 = 20 + Math.floor((i + 1) / 3) * 45
                      return (
                        <motion.line
                          key={i}
                          x1={`${x1 + 4}%`} y1={`${y1 + 4}%`}
                          x2={`${x2 + 4}%`} y2={`${y2 + 4}%`}
                          stroke="#38bdf8" strokeWidth="2"
                          strokeDasharray="5,5"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: i * 0.2, duration: 0.5 }}
                        />
                      )
                    })}
                  </svg>
                )}

                {!route && (
                  <div className="text-center z-10">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto mb-3">
                      <svg className="w-7 h-7 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Rotani optimize et</p>
                    <p className="text-gray-400 text-xs mt-1">Mekanlar haritada gozukecek</p>
                  </div>
                )}
              </div>
            </div>

            {/* Optimize edilmis rota */}
            {route && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-gray-50">
                  <h2 className="font-semibold text-gray-900">Optimize Edilmis Rota</h2>
                </div>

                {/* Stats */}
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <StatCard value={`${route.total_distance} km`} label="Toplam Mesafe" color="text-sky-600" />
                    <StatCard value={`${route.total_duration} saat`} label="Tahmini Sure" color="text-violet-600" />
                    <StatCard value={`${route.total_cost_estimate} TL`} label="Maliyet" color="text-emerald-600" />
                  </div>

                  {/* Siralanmis aktiviteler */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Onerilen Ziyaret Sirasi
                    </p>
                    {optimizedActivities.map((activity, index) => (
                      <div key={activity.id}>
                        <ActivityRow
                          activity={activity}
                          index={index}
                          isOptimized={true}
                        />
                        {index < optimizedActivities.length - 1 && (
                          <div className="flex items-center gap-2 py-1 pl-14">
                            <div className="w-px h-4 bg-sky-200 ml-4"></div>
                            <span className="text-xs text-gray-400">Sonraki duraga gec</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}