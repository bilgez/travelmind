import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { parseInput, getRecommendations } from '../api/index'

const QUICK_PROMPTS = [
  "2 gunluk tarih turu, muzeler ve antik kentler",
  "Romantik akşam yemegi ve gece hayati",
  "Aile dostu aktiviteler, cocuklar icin",
  "Dogada yuruyus ve selaleler",
]

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0,1,2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-sky-400 rounded-full"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

function ActivityCard({ activity, selected, onToggle }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
        selected
          ? 'border-sky-400 bg-sky-50'
          : 'border-gray-100 bg-white hover:border-sky-200'
      }`}
      onClick={() => onToggle(activity)}
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
        <img
          src={activity.image_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80'}
          alt={activity.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{activity.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-amber-400 text-xs">{'★'.repeat(Math.round(activity.rating))}</span>
          <span className="text-xs text-gray-400">{activity.rating}</span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs font-medium text-sky-600">
            {activity.price === 0 ? 'Ucretsiz' : `${activity.price} TL`}
          </span>
        </div>
      </div>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        selected ? 'border-sky-500 bg-sky-500' : 'border-gray-200'
      }`}>
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
          </svg>
        )}
      </div>
    </motion.div>
  )
}

export default function Planner() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Merhaba! Ben TravelMind. Antalya'da nasil bir gezi planliyorsun? Bana biraz anlat — kac gun, ne gormek istiyorsun, butcen ne kadar?",
      time: new Date().toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activities, setActivities] = useState([])
  const [selected, setSelected] = useState([])
  const [category, setCategory] = useState('tarihi_yer')
  const [showActivities, setShowActivities] = useState(false)
  const username = localStorage.getItem('username') || 'Gezgin'
  const userId = parseInt(localStorage.getItem('user_id')) || 1

  const categories = [
    { key: 'tarihi_yer', label: 'Tarihi' },
    { key: 'plaj', label: 'Plajlar' },
    { key: 'restoran', label: 'Yeme-Icme' },
    { key: 'doga', label: 'Doga' },
    { key: 'gece_hayati', label: 'Gece' },
  ]

  useEffect(() => {
    loadActivities(category)
  }, [category])

  const loadActivities = async (cat) => {
    try {
      const res = await getRecommendations(userId, cat)
      setActivities(res.data.recommendations || [])
    } catch {
      setActivities([])
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg = {
      role: 'user',
      text: input,
      time: new Date().toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      await parseInput({ user_id: userId, text: input })
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'ai',
          text: "Harika! Planini analiz ettim. Asagida sana ozel mekan onerileri hazirladim. Begendiklerini secip rotana ekleyebilirsin!",
          time: new Date().toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit' })
        }])
        setShowActivities(true)
        setLoading(false)
      }, 1200)
    } catch {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'ai',
          text: "Anladim! Sana en iyi Antalya deneyimi icin onerilerimi hazirladim. Asagidan mekan secebilirsin.",
          time: new Date().toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit' })
        }])
        setShowActivities(true)
        setLoading(false)
      }, 1200)
    }
  }

  const toggleActivity = (activity) => {
    if (selected.find(a => a.id === activity.id)) {
      setSelected(selected.filter(a => a.id !== activity.id))
    } else {
      setSelected([...selected, activity])
    }
  }

  const handleRoute = () => {
    localStorage.setItem('selected_activities', JSON.stringify(selected))
    navigate('/route')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-100 px-6 h-16 flex items-center justify-between flex-shrink-0">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900">
            Travel<span className="text-sky-500">Mind</span>
          </span>
        </button>
        <div className="flex items-center gap-3">
          {selected.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleRoute}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
              Rota Olustur ({selected.length})
            </motion.button>
          )}
          <span className="text-sm text-gray-500">Hos geldin, <span className="font-medium text-gray-800">{username}</span></span>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full px-6 py-6 gap-6">

        {/* SOL - AI CHAT */}
        <div className="w-full md:w-[420px] flex-shrink-0 flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">TravelMind AI</p>
              <p className="text-xs text-green-500">Cevrimici</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-7 h-7 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                      </svg>
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === 'user' ? '' : ''}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-sky-500 text-white rounded-br-sm'
                        : 'bg-gray-50 text-gray-800 rounded-bl-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <p className={`text-xs text-gray-400 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      {msg.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 mr-2">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                </div>
                <div className="bg-gray-50 rounded-2xl rounded-bl-sm">
                  <TypingIndicator />
                </div>
              </motion.div>
            )}
          </div>

          {/* Quick prompts */}
          {messages.length === 1 && (
            <div className="px-4 pb-3">
              <p className="text-xs text-gray-400 mb-2">Hizli baslangic:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(p)}
                    className="text-xs bg-sky-50 hover:bg-sky-100 text-sky-600 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4">
            <div className="flex items-end gap-2 bg-gray-50 rounded-2xl p-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Gezini anlat..."
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none outline-none max-h-24 py-1 px-2"
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-9 h-9 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* SAG - AKTIVITELER */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Kategori tabs */}
          <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  category === cat.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Aktivite listesi */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex-1 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Onerilen Mekanlar</h2>
              {selected.length > 0 && (
                <span className="text-xs bg-sky-50 text-sky-600 px-2.5 py-1 rounded-full font-medium">
                  {selected.length} secildi
                </span>
              )}
            </div>

            <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
              {activities.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">Bu kategoride mekan bulunamadi</p>
                </div>
              ) : (
                activities.map(activity => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    selected={!!selected.find(a => a.id === activity.id)}
                    onToggle={toggleActivity}
                  />
                ))
              )}
            </div>
          </div>

          {/* Rota butonu */}
          {selected.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <button
                onClick={handleRoute}
                className="w-full bg-gray-900 hover:bg-gray-700 text-white font-semibold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                </svg>
                {selected.length} Mekan ile Rota Olustur
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}