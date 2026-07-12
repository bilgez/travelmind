import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getMyPlans, deletePlan, updatePlanStatus } from '../api/index'
import Navbar, { BRAND } from '../components/Navbar'

const FALLBACK = '/pexels-esat-kucuksahin-2405819-37086609.jpg'
const ACCENT = BRAND

const CAT_LABEL = {
  tarihi_yer: 'Tarihi', plaj: 'Plaj', doga: 'Doğa',
  restoran: 'Restoran', gece_hayati: 'Gece Hayatı',
  alisveris: 'Alışveriş', eglence: 'Eğlence',
}
const CAT_EMOJI = {
  tarihi_yer: '🏛️', plaj: '🏖️', doga: '🌿',
  restoran: '🍽️', gece_hayati: '🌙', alisveris: '🛍️', eglence: '🎡',
}

function dominant(plan) {
  const c = {}
  plan.days?.forEach(d => d.activities?.forEach(a => { c[a.category] = (c[a.category] || 0) + 1 }))
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0]
}

function coverImg(plan) {
  const all = (plan.days || []).flatMap(d => d.activities || []).filter(a => a.image_url)
  if (!all.length) return FALLBACK
  const dom = dominant(plan)
  const pool = dom ? all.filter(a => a.category === dom) : []
  const source = pool.length ? pool : all
  const seed = String(plan.id || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  return source[seed % source.length].image_url
}

function totalActs(plan) {
  return plan.days?.reduce((s, d) => s + d.activities.length, 0) || 0
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
}

function planCost(plan) {
  return plan.totalCost || plan.cost || 0
}

/* ─── Guest state (not logged in) ─── */
function GuestState({ navigate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-32 text-center px-6"
    >
      <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mb-6">
        <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Planlarını görmek için giriş yap</h2>
      <p className="text-gray-400 text-sm max-w-xs leading-relaxed mb-8">
        Oluşturduğun Antalya planlarını kaydetmek ve her zaman erişmek için bir hesabın olması gerekiyor.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 text-white font-semibold px-7 py-3.5 rounded-full text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          style={{ background: ACCENT }}
        >
          Giriş Yap
        </button>
        <button
          onClick={() => navigate('/planner')}
          className="inline-flex items-center gap-2 text-gray-600 font-semibold px-7 py-3.5 rounded-full text-sm border border-gray-200 hover:border-gray-300 transition-all"
        >
          Plan Oluştur
        </button>
      </div>
    </motion.div>
  )
}

/* ─── Empty state ─── */
function Empty({ navigate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-32 text-center px-6"
    >
      <div className="relative w-72 h-44 rounded-3xl overflow-hidden shadow-2xl mb-8">
        <img src={FALLBACK} className="w-full h-full object-cover" alt="Antalya" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
        <div className="absolute bottom-5 left-0 right-0 text-center">
          <p className="text-white text-lg font-bold">Antalya seni bekliyor</p>
          <p className="text-white/60 text-xs mt-0.5">Türkiye'nin incisi</p>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Henüz planın yok</h2>
      <p className="text-gray-400 text-sm max-w-xs leading-relaxed mb-8">
        AI ile birkaç saniyede kişisel Antalya rotanı oluştur. Tarihi turlar, plaj kaçamakları, gece hayatı — hepsi bir arada.
      </p>
      <button
        onClick={() => navigate('/planner')}
        className="inline-flex items-center gap-2 text-white font-semibold px-7 py-3.5 rounded-full text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        style={{ background: ACCENT }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        İlk Planı Oluştur
      </button>
    </motion.div>
  )
}

/* ─── Plan card ─── */
function Card({ plan, idx, onDelete, onOpen, onToggleArchive, onRename }) {
  const [del, setDel] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [nameVal, setNameVal] = useState(plan.title)
  const dom = dominant(plan)
  const acts = totalActs(plan)
  const cost = planCost(plan)
  const done = plan.status === 'completed'

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: idx * 0.05 }}
      className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-2xl transition-all duration-300 cursor-pointer"
      onClick={() => setExpanded(v => !v)}
    >
      {/* Cover image */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={coverImg(plan)} alt={plan.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={e => e.target.src = FALLBACK}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {dom && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10">
              {CAT_EMOJI[dom]} {CAT_LABEL[dom]}
            </span>
          )}
          {done && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/90 text-white">
              ✓ Tamamlandı
            </span>
          )}
        </div>

        {/* Delete button — hover only */}
        <div className="absolute top-4 right-4" onClick={e => e.stopPropagation()}>
          <AnimatePresence mode="wait">
            {del ? (
              <motion.div key="confirm"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1 bg-white rounded-xl overflow-hidden shadow-lg"
              >
                <button onClick={() => onDelete(plan.id)} className="text-xs font-bold text-white bg-red-500 px-3 py-2 hover:bg-red-600 transition-colors">Sil</button>
                <button onClick={() => setDel(false)} className="text-xs text-gray-500 px-3 py-2 hover:bg-gray-50 transition-colors">İptal</button>
              </motion.div>
            ) : (
              <motion.button key="btn"
                onClick={() => setDel(true)}
                className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white rounded-xl flex items-center justify-center transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Title block */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {editing ? (
            <input
              autoFocus
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onBlur={() => { if (nameVal.trim() && nameVal !== plan.title) onRename(plan.id, nameVal.trim()); setEditing(false) }}
              onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { setNameVal(plan.title); setEditing(false) } }}
              onClick={e => e.stopPropagation()}
              className="w-full text-[18px] font-bold text-white bg-transparent border-b border-white/50 outline-none pb-0.5 mb-1.5"
            />
          ) : (
            <div className="flex items-end gap-2 group/title mb-1.5">
              <h3 className="text-[18px] font-bold text-white leading-snug flex-1">{plan.title}</h3>
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
          <div className="flex items-center gap-2 text-white/55 text-xs">
            <span>{plan.days?.length || 0} gün</span>
            <span className="opacity-40">·</span>
            <span>{acts} mekan</span>
            {cost > 0 && (
              <>
                <span className="opacity-40">·</span>
                <span>{cost.toLocaleString('tr-TR')} TL</span>
              </>
            )}
            {plan.createdAt && (
              <>
                <span className="opacity-40">·</span>
                <span>{fmtDate(plan.createdAt)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Day pills */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {plan.days?.map((d, i) => (
            <div
              key={d.day}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600"
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: ACCENT, opacity: 0.5 + (i * 0.1) }} />
              Gün {d.day} · {d.theme}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 flex items-center gap-2" onClick={e => e.stopPropagation()}>
        <button
          onClick={onOpen}
          className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Düzenle
        </button>

        <button
          onClick={() => onToggleArchive(plan.id)}
          title={done ? 'Aktife al' : 'Tamamlandı işaretle'}
          className={`w-9 h-9 flex items-center justify-center rounded-xl border text-xs font-bold transition-all ${done ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-emerald-200 hover:text-emerald-500'}`}
        >
          {done ? '↩' : '✓'}
        </button>
      </div>

      {/* Expandable detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
              {plan.days?.map((day, i) => (
                <div key={day.day}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: ACCENT }}>
                      {day.day}
                    </span>
                    <p className="text-xs font-bold text-gray-700 flex-1">{day.theme}</p>
                    <span className="text-[10px] text-gray-400">{day.activities.length} mekan</span>
                  </div>
                  <div className="ml-7 space-y-1">
                    {day.activities.map((a, ai) => (
                      <div key={a.id || ai} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                        <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <img src={a.image_url || FALLBACK} alt="" className="w-full h-full object-cover" onError={e => e.target.src = FALLBACK} />
                        </div>
                        <span className="text-xs text-gray-700 flex-1 truncate font-medium">{a.name}</span>
                        <span className="text-[11px] font-semibold text-gray-400 flex-shrink-0">
                          {a.price === 0 ? 'Ücretsiz' : `${a.price} TL`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {cost > 0 && (
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Tahmini Toplam</span>
                  <span className="text-sm font-bold text-gray-900">{cost.toLocaleString('tr-TR')} TL</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

/* ─── Main page ─── */
export default function MyPlans() {
  const navigate = useNavigate()
  useEffect(() => { document.title = 'Planlarım | TravelMind' }, [])
  const token = localStorage.getItem('token')
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [errorToast, setErrorToast] = useState('')
  const showError = (msg) => { setErrorToast(msg); setTimeout(() => setErrorToast(''), 3000) }
  useEffect(() => {
    if (!token) { setLoading(false); return }
    getMyPlans()
      .then(res => setPlans(res.data.plans || []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false))
  }, [token])

  const handleDelete = async id => {
    try {
      await deletePlan(id)
      setPlans(p => p.filter(x => x.id !== id))
    } catch { showError('Plan silinemedi, tekrar dene.') }
  }

  const handleRename = async (id, title) => {
    try {
      await updatePlanStatus(id, { title })
      setPlans(p => p.map(x => x.id === id ? { ...x, title } : x))
    } catch { showError('İsim güncellenemedi, tekrar dene.') }
  }

  const handleToggle = async id => {
    const plan = plans.find(p => p.id === id)
    const newStatus = plan?.status === 'completed' ? 'active' : 'completed'
    try {
      await updatePlanStatus(id, { status: newStatus })
      setPlans(p => p.map(x => x.id === id ? { ...x, status: newStatus } : x))
    } catch { showError('Durum güncellenemedi, tekrar dene.') }
  }

  const handleOpen = plan => { localStorage.setItem('restore_plan', JSON.stringify(plan)); navigate('/planner') }

  const activeCount = plans.filter(p => (p.status || 'active') === 'active').length
  const doneCount = plans.filter(p => p.status === 'completed').length
  const totalSpent = plans.reduce((s, p) => s + planCost(p), 0)
  const filtered = filter === 'all' ? plans : plans.filter(p =>
    filter === 'completed' ? p.status === 'completed' : (p.status || 'active') === 'active'
  )

  return (
    <div className="min-h-screen bg-[#F8F8F6]">
      {errorToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg">
          {errorToast}
        </div>
      )}

      <Navbar />

      {/* Header */}
      {plans.length > 0 && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Planlarım</h1>
                <p className="text-gray-400 text-sm">Tüm Antalya gezilerini tek yerden yönet.</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {[
                  { n: plans.length, l: 'Toplam Plan' },
                  { n: activeCount, l: 'Aktif' },
                  { n: doneCount, l: 'Tamamlanan' },
                  ...(totalSpent > 0 ? [{ n: `${totalSpent.toLocaleString('tr-TR')} TL`, l: 'Tahmini Toplam' }] : []),
                ].map((s) => (
                  <div key={s.l} className="text-center px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-xl font-bold text-gray-900">{s.n}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
          </div>
        ) : !token ? (
          <GuestState navigate={navigate} />
        ) : plans.length === 0 ? (
          <Empty navigate={navigate} />
        ) : (
          <>
            {/* Filter tabs */}
            <div className="flex items-center gap-2 mb-7">
              {[
                { k: 'all', l: `Tümü · ${plans.length}` },
                { k: 'active', l: `Aktif · ${activeCount}` },
                { k: 'completed', l: `Tamamlanan · ${doneCount}` },
              ].map(f => (
                <button
                  key={f.k} onClick={() => setFilter(f.k)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${filter === f.k ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                >
                  {f.l}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-sm">Bu kategoride plan yok.</div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {filtered.map((plan, i) => (
                    <Card
                      key={plan.id} plan={plan} idx={i}
                      onDelete={handleDelete}
                      onRename={handleRename}
                      onOpen={() => handleOpen(plan)}
                      onToggleArchive={handleToggle}
                    />
                  ))}

                  {/* New plan card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: filtered.length * 0.05 }}
                    onClick={() => navigate('/planner')}
                    className="border-2 border-dashed border-gray-200 hover:border-[#96C8C8] rounded-3xl flex flex-col items-center justify-center min-h-[400px] cursor-pointer transition-all group hover:bg-[#EBF7F7]/50"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 group-hover:bg-[#DFF0EF] flex items-center justify-center mb-3 transition-all">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-[#4A9898] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="font-semibold text-gray-400 group-hover:text-[#4A9898] transition-colors text-sm">Yeni Plan Oluştur</p>
                    <p className="text-xs text-gray-300 mt-1">AI ile saniyeler içinde</p>
                  </motion.div>
                </div>
              </AnimatePresence>
            )}
          </>
        )}
      </div>
    </div>
  )
}
