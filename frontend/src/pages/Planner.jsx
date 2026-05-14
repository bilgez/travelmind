import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseInput, getRecommendations } from '../api/index'
import ActivityCard from '../components/ActivityCard'

function Planner() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [activities, setActivities] = useState([])
  const [selected, setSelected] = useState([])
  const [category, setCategory] = useState('tarihi_yer')
  const [message, setMessage] = useState('')
  const username = localStorage.getItem('username') || 'Kullanici'
  const userId = parseInt(localStorage.getItem('user_id')) || 1

  const categories = [
    { key: 'tarihi_yer', label: 'Tarihi Yerler', emoji: '🏛' },
    { key: 'restoran', label: 'Restoranlar', emoji: '🍽' },
    { key: 'plaj', label: 'Plajlar', emoji: '🌊' },
    { key: 'eglence', label: 'Eglence', emoji: '🎭' },
  ]

  useEffect(() => {
    loadActivities(category)
  }, [category])

  const loadActivities = async (cat) => {
    try {
      const res = await getRecommendations(userId, cat)
      setActivities(res.data.recommendations)
    } catch {
      setActivities([])
    }
  }

  const handleSend = async () => {
    if (!text.trim()) return
    setLoading(true)
    setMessage('')
    try {
      const res = await parseInput({ user_id: userId, text })
      const parsed = res.data.parsed_plan
      setMessage('Planin olusturuldu! Asagidan aktivite ekleyebilirsin.')
      setText('')
    } catch {
      setMessage('Bir hata olustu, tekrar dene.')
    }
    setLoading(false)
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
    <div className="min-h-screen bg-gray-50">
      
      {/* Navbar */}
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-orange-500">TravelMind</h1>
        <span className="text-gray-600">Merhaba, {username}!</span>
      </div>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Sol - AI Chat */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">T</div>
            <div>
              <p className="font-semibold">TravelMind AI</p>
              <p className="text-xs text-green-500">Cevrimici</p>
            </div>
          </div>

          <div className="bg-orange-50 rounded-xl p-4 mb-4">
            <p className="text-gray-700 text-sm">
              Merhaba! Antalya'da nasil bir gezi planlamak istiyorsun? 
              Bana yaz, sana en iyi aktiviteleri onereyim!
            </p>
          </div>

          {message && (
            <div className="bg-green-50 text-green-700 rounded-xl p-4 mb-4 text-sm">
              {message}
            </div>
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 resize-none"
            rows={4}
            placeholder="Ornek: 2 gunluk gezi, muzeler ve iyi restoranlar istiyorum..."
          />

          <button
            onClick={handleSend}
            disabled={loading}
            className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Isleniyor...' : 'Gonder'}
          </button>

          {/* Kategori secimi */}
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Kategoriye Gore Bak:</p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                    category === cat.key
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-orange-100'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sag - Aktiviteler */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">Aktiviteler</h2>
            {selected.length > 0 && (
              <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                {selected.length} secildi
              </span>
            )}
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Bu kategoride aktivite bulunamadi.</p>
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

          {selected.length > 0 && (
            <button
              onClick={handleRoute}
              className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Rotami Olustur ({selected.length} aktivite)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Planner