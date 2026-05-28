import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORY_LABELS = {
  tarihi_yer: 'Tarihi Yer', plaj: 'Plaj', doga: 'Doğa',
  restoran: 'Restoran', gece_hayati: 'Gece Hayatı',
  alisveris: 'Alışveriş', eglence: 'Eğlence',
}

const CATEGORY_COLORS = {
  tarihi_yer: 'bg-amber-100 text-amber-700',
  plaj: 'bg-sky-100 text-sky-700',
  doga: 'bg-emerald-100 text-emerald-700',
  restoran: 'bg-orange-100 text-orange-700',
  gece_hayati: 'bg-violet-100 text-violet-700',
  alisveris: 'bg-pink-100 text-pink-700',
  eglence: 'bg-rose-100 text-rose-700',
}

const DAY_ACCENT = ['#38bdf8', '#a78bfa', '#fb923c', '#34d399', '#f472b6']

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function PlanStatusBadge({ status }) {
  const map = {
    active: { label: 'Aktif', cls: 'bg-emerald-50 text-emerald-600' },
    completed: { label: 'Tamamlandı', cls: 'bg-gray-100 text-gray-500' },
    draft: { label: 'Taslak', cls: 'bg-amber-50 text-amber-600' },
  }
  const s = map[status] || map.draft
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
  )
}

function DayTimeline({ day, accent }) {
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
        <p className="text-xs font-semibold text-gray-700">Gün {day.day} — {day.theme}</p>
      </div>
      <div className="ml-3 space-y-1.5 pl-3 border-l-2" style={{ borderColor: accent + '40' }}>
        {day.activities.map((a, i) => (
          <div key={a.id || i} className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 w-10 flex-shrink-0 font-mono">
              {getActivityTime(day.activities, i)}
            </span>
            <span className="text-xs text-gray-700 flex-1 truncate">{a.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[a.category] || 'bg-gray-100 text-gray-500'}`}>
              {CATEGORY_LABELS[a.category] || a.category}
            </span>
            <span className="text-[10px] text-gray-400 flex-shrink-0">
              {a.price === 0 ? 'Ücretsiz' : `${a.price} TL`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const VISIT_DURATIONS = {
  tarihi_yer: 90, plaj: 180, doga: 120,
  restoran: 75, gece_hayati: 120, alisveris: 90, eglence: 120,
}

function getActivityTime(activities, index) {
  let current = 9 * 60
  for (let i = 0; i < index; i++) {
    const dur = VISIT_DURATIONS[activities[i].category] || 90
    current += dur + 20
    if (current >= 12.5 * 60 && current < 14 * 60) current = 14 * 60
  }
  const h = Math.floor(current / 60)
  const m = current % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function PlanCard({ plan, onDelete, onRename, onOpen, onToggleArchive }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [nameVal, setNameVal] = useState(plan.title)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const totalActivities = plan.days?.reduce((s, d) => s + d.activities.length, 0) || 0
  const dominantCats = (() => {
    const counts = {}
    plan.days?.forEach(d => d.activities.forEach(a => { counts[a.category] = (counts[a.category] || 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k)
  })()

  const handleRename = () => {
    if (nameVal.trim() && nameVal !== plan.title) onRename(plan.id, nameVal.trim())
    setEditing(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                autoFocus
                value={nameVal}
                onChange={e => setNameVal(e.target.value)}
                onBlur={handleRename}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditing(false) }}
                className="w-full text-base font-bold text-gray-900 border-b-2 border-sky-400 outline-none bg-transparent pb-0.5"
              />
            ) : (
              <div className="flex items-center gap-2 group">
                <h3 className="text-base font-bold text-gray-900 truncate">{plan.title}</h3>
                <button
                  onClick={() => setEditing(true)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-sky-500 transition-all flex-shrink-0"
                  title="İsmi düzenle"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(plan.createdAt)}</p>
          </div>
          <PlanStatusBadge status={plan.status || 'active'} />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {plan.days?.length || 0} gün
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {totalActivities} mekan
          </div>
          {plan.totalCost != null && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {plan.totalCost} TL
            </div>
          )}
        </div>

        {/* Category chips */}
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          {dominantCats.map(cat => (
            <span key={cat} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-500'}`}>
              {CATEGORY_LABELS[cat]}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpen}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Düzenle
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors border ${
              expanded ? 'bg-sky-50 text-sky-600 border-sky-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {expanded ? 'Gizle' : 'Detay'}
          </button>
          <button
            onClick={() => onToggleArchive(plan.id)}
            className="text-xs font-semibold px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
            title={plan.status === 'completed' ? 'Aktife Al' : 'Arşivle'}
          >
            {plan.status === 'completed' ? '↩' : '✓'}
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={() => onDelete(plan.id)} className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2.5 py-2.5 rounded-xl transition-colors">Sil</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2.5 rounded-xl transition-colors">İptal</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-400 hover:text-red-400 hover:border-red-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Day Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-gray-50"
          >
            <div className="px-5 pb-5 pt-4 space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Günlük Program</p>
              {plan.days?.map((day, i) => (
                <DayTimeline key={day.day} day={day} accent={DAY_ACCENT[i % DAY_ACCENT.length]} />
              ))}
              {/* Budget breakdown */}
              {plan.days && (
                <div className="mt-5 pt-4 border-t border-gray-50">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Bütçe Özeti</p>
                  <div className="space-y-2">
                    {Object.entries(
                      plan.days.flatMap(d => d.activities).reduce((acc, a) => {
                        acc[a.category] = (acc[a.category] || 0) + (a.price || 0)
                        return acc
                      }, {})
                    ).map(([cat, total]) => (
                      <div key={cat} className="flex items-center justify-between">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-500'}`}>
                          {CATEGORY_LABELS[cat]}
                        </span>
                        <span className="text-xs font-semibold text-gray-700">
                          {total === 0 ? 'Ücretsiz' : `${total} TL`}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-xs font-bold text-gray-900">Toplam</span>
                      <span className="text-sm font-bold text-sky-600">{plan.totalCost || 0} TL</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function EmptyState({ navigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-2">Henüz plan yok</h3>
      <p className="text-sm text-gray-400 mb-6 max-w-xs">
        AI planlayıcıyla Antalya turun için ilk planını oluştur.
      </p>
      <button
        onClick={() => navigate('/planner')}
        className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Yeni Plan Oluştur
      </button>
    </div>
  )
}

export default function MyPlans() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [filter, setFilter] = useState('all') // all | active | completed

  useEffect(() => {
    const raw = localStorage.getItem('travelmind_plans')
    if (raw) {
      try { setPlans(JSON.parse(raw)) } catch { setPlans([]) }
    }
  }, [])

  const persist = (updated) => {
    setPlans(updated)
    localStorage.setItem('travelmind_plans', JSON.stringify(updated))
  }

  const handleDelete = (id) => persist(plans.filter(p => p.id !== id))

  const handleRename = (id, newTitle) => persist(plans.map(p => p.id === id ? { ...p, title: newTitle } : p))

  const handleToggleArchive = (id) => persist(
    plans.map(p => p.id === id ? { ...p, status: p.status === 'completed' ? 'active' : 'completed' } : p)
  )

  const handleOpen = (plan) => {
    localStorage.setItem('restore_plan', JSON.stringify(plan))
    navigate('/planner')
  }

  const filtered = filter === 'all' ? plans : plans.filter(p => (p.status || 'active') === filter)
  const activeCount = plans.filter(p => (p.status || 'active') === 'active').length
  const completedCount = plans.filter(p => p.status === 'completed').length

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => navigate('/')} className="text-lg font-bold text-gray-900">
          Travel<span className="text-sky-500">Mind</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/planner')}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Plan
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Planlarım</h1>
          <p className="text-sm text-gray-400">Oluşturduğun Antalya gezilerini buradan yönet.</p>
        </div>

        {/* Stats */}
        {plans.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Toplam Plan', value: plans.length, color: 'text-gray-900' },
              { label: 'Aktif', value: activeCount, color: 'text-emerald-600' },
              { label: 'Tamamlanan', value: completedCount, color: 'text-gray-400' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        {plans.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            {[
              { key: 'all', label: 'Tümü' },
              { key: 'active', label: 'Aktif' },
              { key: 'completed', label: 'Tamamlanan' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filter === f.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Plan list */}
        {plans.length === 0 ? (
          <EmptyState navigate={navigate} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Bu kategoride plan yok.</div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onDelete={handleDelete}
                  onRename={handleRename}
                  onOpen={() => handleOpen(plan)}
                  onToggleArchive={handleToggleArchive}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* CTA at bottom */}
        {plans.length > 0 && (
          <div className="mt-10 text-center">
            <button
              onClick={() => navigate('/planner')}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni plan oluştur
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
