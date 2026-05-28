import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORY_LABELS = {
  tarihi_yer: 'Tarihi', plaj: 'Plaj', doga: 'Doğa',
  restoran: 'Restoran', gece_hayati: 'Gece', alisveris: 'Alışveriş', eglence: 'Eğlence',
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

const FALLBACK_IMAGE = '/pexels-esat-kucuksahin-2405819-37086609.jpg'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function PlanStatusBadge({ status }) {
  const map = {
    active: { label: 'Aktif', cls: 'bg-emerald-500/90 text-white' },
    completed: { label: 'Tamamlandı', cls: 'bg-white/20 text-white' },
    draft: { label: 'Taslak', cls: 'bg-amber-500/90 text-white' },
  }
  const s = map[status] || map.draft
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${s.cls}`}>
      {s.label}
    </span>
  )
}

function PlanCard({ plan, onDelete, onRename, onOpen, onToggleArchive }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [nameVal, setNameVal] = useState(plan.title)

  const coverImage = plan.days?.[0]?.activities?.find(a => a.image)?.image || FALLBACK_IMAGE
  const totalActivities = plan.days?.reduce((s, d) => s + d.activities.length, 0) || 0

  const dominantCat = (() => {
    const counts = {}
    plan.days?.forEach(d => d.activities.forEach(a => {
      counts[a.category] = (counts[a.category] || 0) + 1
    }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
  })()

  const handleRename = () => {
    if (nameVal.trim() && nameVal !== plan.title) onRename(plan.id, nameVal.trim())
    setEditing(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100"
    >
      {/* ── Cover Image ── */}
      <div className="relative h-48 overflow-hidden cursor-pointer" onClick={onOpen}>
        <img
          src={coverImage}
          alt={plan.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { e.target.src = FALLBACK_IMAGE }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        {/* Top row */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          {dominantCat && (
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${CATEGORY_COLORS[dominantCat]}`}>
              {CATEGORY_LABELS[dominantCat]}
            </span>
          )}
          <PlanStatusBadge status={plan.status || 'active'} />
        </div>

        {/* Title on image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {editing ? (
            <input
              autoFocus
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onBlur={handleRename}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') setEditing(false)
              }}
              onClick={e => e.stopPropagation()}
              className="w-full text-lg font-bold text-white bg-transparent border-b border-white/60 outline-none pb-0.5"
            />
          ) : (
            <div className="flex items-end gap-2 group/title">
              <h3 className="text-[17px] font-bold text-white leading-snug flex-1">{plan.title}</h3>
              <button
                onClick={e => { e.stopPropagation(); setEditing(true) }}
                className="opacity-0 group-hover/title:opacity-100 text-white/50 hover:text-white transition-all mb-0.5 flex-shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
          <p className="text-white/55 text-xs mt-0.5">{formatDate(plan.createdAt)}</p>
        </div>
      </div>

      {/* ── Card Body ── */}
      <div className="p-4">

        {/* Stats row */}
        <div className="flex items-center gap-2.5 mb-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{plan.days?.length || 0} gün</span>
          </div>
          <span className="w-1 h-1 bg-gray-200 rounded-full" />
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span>{totalActivities} mekan</span>
          </div>
          {plan.totalCost != null && (
            <>
              <span className="w-1 h-1 bg-gray-200 rounded-full" />
              <span className="font-semibold text-emerald-600">{plan.totalCost} TL</span>
            </>
          )}
        </div>

        {/* Day blocks */}
        {plan.days && plan.days.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {plan.days.map((day, i) => (
              <div
                key={day.day}
                className="flex-shrink-0 rounded-xl px-3 py-2 min-w-[90px]"
                style={{
                  backgroundColor: DAY_ACCENT[i % DAY_ACCENT.length] + '12',
                  borderLeft: `3px solid ${DAY_ACCENT[i % DAY_ACCENT.length]}`,
                }}
              >
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Gün {day.day}</p>
                <p className="text-xs font-semibold text-gray-700 mt-0.5 leading-tight line-clamp-2">{day.theme}</p>
                <p className="text-[10px] text-gray-400 mt-1">{day.activities.length} mekan</p>
              </div>
            ))}
          </div>
        )}

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
            onClick={() => onToggleArchive(plan.id)}
            className="text-xs font-semibold px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
            title={plan.status === 'completed' ? 'Aktife Al' : 'Tamamlandı işaretle'}
          >
            {plan.status === 'completed' ? '↩' : '✓'}
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDelete(plan.id)}
                className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2.5 py-2.5 rounded-xl transition-colors"
              >
                Sil
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2.5 rounded-xl transition-colors"
              >
                İptal
              </button>
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
    </motion.div>
  )
}

function EmptyState({ navigate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="relative mb-8">
        <img
          src={FALLBACK_IMAGE}
          alt="Antalya"
          className="w-64 h-40 object-cover rounded-2xl shadow-lg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl" />
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-white text-sm font-semibold">Antalya seni bekliyor</p>
        </div>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Henüz plan yok</h3>
      <p className="text-sm text-gray-400 mb-6 max-w-xs leading-relaxed">
        AI planlayıcıyla birkaç saniyede kişisel Antalya rotanı oluştur.
      </p>
      <button
        onClick={() => navigate('/planner')}
        className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors shadow-lg"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        İlk Planı Oluştur
      </button>
    </motion.div>
  )
}

export default function MyPlans() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState(() => {
    try { return JSON.parse(localStorage.getItem('travelmind_plans') || '[]') } catch { return [] }
  })
  const [filter, setFilter] = useState('all')

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
  const totalSpent = plans.reduce((s, p) => s + (p.totalCost || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Navbar ── */}
      <nav className="bg-white/80 backdrop-blur border-b border-gray-100 px-6 h-14 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => navigate('/')} className="text-lg font-bold text-gray-900">
          Travel<span className="text-sky-500">Mind</span>
        </button>
        <button
          onClick={() => navigate('/planner')}
          className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Plan
        </button>
      </nav>

      {/* ── Hero Header ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Planlarım</h1>
          <p className="text-sm text-gray-400">Oluşturduğun Antalya gezilerini buradan yönet.</p>

          {/* Stats bar */}
          {plans.length > 0 && (
            <div className="flex items-center gap-6 mt-5">
              {[
                { label: 'Toplam Plan', value: plans.length, color: 'text-gray-900' },
                { label: 'Aktif', value: activeCount, color: 'text-sky-600' },
                { label: 'Tamamlanan', value: completedCount, color: 'text-emerald-600' },
                ...(totalSpent > 0 ? [{ label: 'Toplam Harcama', value: `${totalSpent.toLocaleString('tr-TR')} TL`, color: 'text-violet-600' }] : []),
              ].map(s => (
                <div key={s.label}>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Filter tabs */}
        {plans.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            {[
              { key: 'all', label: `Tümü (${plans.length})` },
              { key: 'active', label: `Aktif (${activeCount})` },
              { key: 'completed', label: `Tamamlanan (${completedCount})` },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filter === f.key
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Plan grid */}
        {plans.length === 0 ? (
          <EmptyState navigate={navigate} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Bu kategoride plan yok.</div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
